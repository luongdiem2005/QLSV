// ============================================================================
//  Service module Payment: thu học phí (PHIEUTHUHOCPHI).
//  Mỗi lần thu cập nhật SoTienDaDong/SoTienConLai của phiếu đăng ký trong
//  CÙNG transaction. Việc trừ tiền dùng updateMany có điều kiện để đảm bảo
//  atomic (chống hai lần thu đồng thời làm âm số dư).
// ============================================================================
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

function sinhMaPhieuThu() {
  return 'PT' + Date.now().toString(36).toUpperCase();
}

exports.create = async ({ MaPhieuDK, SoTienThu }) => {
  const soTien = Number(SoTienThu);

  return prisma.$transaction(async (tx) => {
    // 1. Phiếu đăng ký phải tồn tại
    const phieu = await tx.pHIEUDANGKY.findUnique({ where: { MaPhieu: MaPhieuDK } });
    if (!phieu) throw new ApiError(404, `Phiếu đăng ký "${MaPhieuDK}" không tồn tại.`, 'PHIEUDK_NOT_FOUND');

    // 2. Trừ tiền ATOMIC: chỉ cập nhật khi SoTienConLai >= soTien
    const ketQua = await tx.pHIEUDANGKY.updateMany({
      where: { MaPhieu: MaPhieuDK, SoTienConLai: { gte: soTien } },
      data: {
        SoTienDaDong: { increment: soTien },
        SoTienConLai: { decrement: soTien },
      },
    });
    if (ketQua.count === 0) {
      throw new ApiError(409, `Số tiền thu (${soTien}) vượt quá số tiền còn lại (${Number(phieu.SoTienConLai)}).`, 'EXCEED_REMAINING');
    }

    // 3. Tạo phiếu thu
    return tx.pHIEUTHUHOCPHI.create({
      data: { MaPhieuThu: sinhMaPhieuThu(), MaPhieuDK, SoTienThu: soTien },
    });
  });
};

exports.list = async ({ maPhieuDK, maSoSinhVien, maHKNH }, currentUser) => {
  const where = {};
  if (maPhieuDK) where.MaPhieuDK = maPhieuDK;

  // Lọc qua quan hệ tới phiếu đăng ký (theo SV / học kỳ)
  const phieuFilter = {};
  if (currentUser.VaiTro === 'SV') {
    phieuFilter.MaSoSinhVien = currentUser.MaSoSinhVien; // SV chỉ thấy của mình
  } else if (maSoSinhVien) {
    phieuFilter.MaSoSinhVien = maSoSinhVien;
  }
  if (maHKNH) phieuFilter.MaHKNH = maHKNH;
  if (Object.keys(phieuFilter).length) where.phieuDangKy = phieuFilter;

  return prisma.pHIEUTHUHOCPHI.findMany({
    where,
    include: {
      phieuDangKy: {
        select: {
          MaPhieu: true, MaSoSinhVien: true, MaHKNH: true,
          sinhVien: { select: { HoTen: true } },
        },
      },
    },
    orderBy: { NgayLapPhieu: 'desc' },
  });
};

exports.getOne = async (maPhieuThu, currentUser) => {
  const pt = await prisma.pHIEUTHUHOCPHI.findUnique({
    where: { MaPhieuThu: maPhieuThu },
    include: {
      phieuDangKy: {
        include: {
          sinhVien: { select: { MaSoSinhVien: true, HoTen: true } },
          hocKyNamHoc: { select: { MaHKNH: true, HocKy: true } },
        },
      },
    },
  });
  if (!pt) throw new ApiError(404, 'Không tìm thấy phiếu thu.', 'NOT_FOUND');
  if (currentUser.VaiTro === 'SV' && pt.phieuDangKy.MaSoSinhVien !== currentUser.MaSoSinhVien) {
    throw new ApiError(403, 'Bạn chỉ được xem phiếu thu của mình.', 'FORBIDDEN');
  }
  return pt;
};

exports.remove = async (maPhieuThu) => {
  const pt = await prisma.pHIEUTHUHOCPHI.findUnique({ where: { MaPhieuThu: maPhieuThu } });
  if (!pt) throw new ApiError(404, 'Không tìm thấy phiếu thu.', 'NOT_FOUND');
  const soTien = Number(pt.SoTienThu);

  return prisma.$transaction(async (tx) => {
    await tx.pHIEUTHUHOCPHI.delete({ where: { MaPhieuThu: maPhieuThu } });
    // Hoàn lại số dư cho phiếu đăng ký
    await tx.pHIEUDANGKY.update({
      where: { MaPhieu: pt.MaPhieuDK },
      data: {
        SoTienDaDong: { decrement: soTien },
        SoTienConLai: { increment: soTien },
      },
    });
    return { message: 'Đã hủy phiếu thu và hoàn lại số dư cho phiếu đăng ký.' };
  });
};
