// ============================================================================
//  Service module Enrollment: đăng ký / hủy môn + tính tiền học phí.
//  Mọi thao tác thay đổi đều bọc trong $transaction để đảm bảo toàn vẹn:
//  thêm/bớt môn, tăng/giảm sĩ số, và tính lại tiền phải đi cùng nhau.
// ============================================================================
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

// Số tín chỉ = số tiết / số tiết mỗi tín chỉ (làm tròn xuống)
function tinhTinChi(soTiet, soTietMotTinChi) {
  if (!soTietMotTinChi) return 0;
  return Math.floor(soTiet / soTietMotTinChi);
}

// Sinh mã phiếu ngắn, vừa cột VARCHAR(15)
function sinhMaPhieu() {
  return 'PDK' + Date.now().toString(36).toUpperCase();
}

// Đọc tham số hệ thống (trả giá trị mặc định nếu chưa cấu hình)
async function layThamSo(tx, ten, macDinh) {
  const ts = await tx.tHAMSO.findUnique({ where: { TenThamSo: ten } });
  return ts ? ts.GiaTri : macDinh;
}

// Tính lại toàn bộ tiền cho 1 phiếu. GỌI BÊN TRONG transaction.
async function tinhLaiTien(tx, maPhieu) {
  const phieu = await tx.pHIEUDANGKY.findUnique({
    where: { MaPhieu: maPhieu },
    include: {
      sinhVien: { include: { doiTuong: true } },
      ctPhieuDKList: { include: { monHoc: { include: { loaiMonHoc: true } } } },
    },
  });

  let tongTienDK = 0;
  for (const ct of phieu.ctPhieuDKList) {
    const loai = ct.monHoc.loaiMonHoc;
    const soTinChi = tinhTinChi(ct.monHoc.SoTiet, loai.SoTietMotTinChi);
    tongTienDK += soTinChi * Number(loai.SoTienMotTinChi);
  }

  const tyLe = phieu.sinhVien.doiTuong ? Number(phieu.sinhVien.doiTuong.TyLeMienGiam) : 0;
  const tienMienGiam = Math.round((tongTienDK * tyLe) / 100);
  const tongTienPhaiDong = tongTienDK - tienMienGiam;
  const soTienConLai = tongTienPhaiDong - Number(phieu.SoTienDaDong);

  return tx.pHIEUDANGKY.update({
    where: { MaPhieu: maPhieu },
    data: {
      TongTienDK: tongTienDK,
      TienMienGiam: tienMienGiam,
      TongTienPhaiDong: tongTienPhaiDong,
      SoTienConLai: soTienConLai,
    },
  });
}

// --------------------------- ĐỌC ---------------------------

exports.list = async ({ maHKNH, maSoSinhVien }, currentUser) => {
  const where = {};
  if (maHKNH) where.MaHKNH = maHKNH;
  if (currentUser.VaiTro === 'SV') {
    where.MaSoSinhVien = currentUser.MaSoSinhVien; // SV chỉ thấy phiếu của mình
  } else if (maSoSinhVien) {
    where.MaSoSinhVien = maSoSinhVien;
  }

  return prisma.pHIEUDANGKY.findMany({
    where,
    include: {
      sinhVien: { select: { MaSoSinhVien: true, HoTen: true } },
      hocKyNamHoc: { select: { MaHKNH: true, HocKy: true } },
      _count: { select: { ctPhieuDKList: true } },
    },
    orderBy: { NgayLapPhieu: 'desc' },
  });
};

exports.getOne = async (maPhieu, currentUser) => {
  const phieu = await prisma.pHIEUDANGKY.findUnique({
    where: { MaPhieu: maPhieu },
    include: {
      sinhVien: { include: { doiTuong: true } },
      hocKyNamHoc: true,
      ctPhieuDKList: { include: { monHoc: { include: { loaiMonHoc: true } } } },
      phieuThuList: { orderBy: { NgayLapPhieu: 'asc' } },
    },
  });
  if (!phieu) throw new ApiError(404, 'Không tìm thấy phiếu đăng ký.', 'NOT_FOUND');
  if (currentUser.VaiTro === 'SV' && phieu.MaSoSinhVien !== currentUser.MaSoSinhVien) {
    throw new ApiError(403, 'Bạn chỉ được xem phiếu đăng ký của mình.', 'FORBIDDEN');
  }

  // Đính số tín chỉ mỗi môn cho frontend hiển thị
  const monHocList = phieu.ctPhieuDKList.map((ct) => ({
    MaMonHoc: ct.monHoc.MaMonHoc,
    TenMonHoc: ct.monHoc.TenMonHoc,
    SoTiet: ct.monHoc.SoTiet,
    LoaiMon: ct.monHoc.loaiMonHoc.TenLoaiMonHoc,
    SoTinChi: tinhTinChi(ct.monHoc.SoTiet, ct.monHoc.loaiMonHoc.SoTietMotTinChi),
  }));

  const { ctPhieuDKList, ...rest } = phieu;
  return { ...rest, monHocList };
};

// --------------------------- GHI ---------------------------

exports.dangKyMon = async ({ MaSoSinhVien, MaHKNH, MaMonHoc }) => {
  // Kiểm tra tồn tại (đọc trước, ngoài transaction)
  const sv = await prisma.sINHVIEN.findUnique({ where: { MaSoSinhVien } });
  if (!sv) throw new ApiError(404, `Sinh viên "${MaSoSinhVien}" không tồn tại.`, 'SV_NOT_FOUND');

  const monMo = await prisma.mONHOCMO.findUnique({
    where: { MaHKNH_MaMonHoc: { MaHKNH, MaMonHoc } },
  });
  if (!monMo) throw new ApiError(409, 'Môn học chưa được mở trong học kỳ này.', 'NOT_OFFERED');

  return prisma.$transaction(async (tx) => {
    // 1. Tìm hoặc tạo phiếu của SV trong học kỳ này
    let phieu = await tx.pHIEUDANGKY.findUnique({
      where: { MaSoSinhVien_MaHKNH: { MaSoSinhVien, MaHKNH } },
    });
    if (!phieu) {
      phieu = await tx.pHIEUDANGKY.create({
        data: { MaPhieu: sinhMaPhieu(), MaSoSinhVien, MaHKNH },
      });
    }

    // 2. Chống đăng ký TRÙNG môn
    const daDangKy = await tx.cT_PHIEUDK.findUnique({
      where: { MaPhieuDK_MaMonHoc: { MaPhieuDK: phieu.MaPhieu, MaMonHoc } },
    });
    if (daDangKy) throw new ApiError(409, 'Sinh viên đã đăng ký môn này rồi.', 'ALREADY_REGISTERED');

    // 3. Kiểm tra sĩ số (đọc lại TRONG transaction cho chính xác)
    const monMoTx = await tx.mONHOCMO.findUnique({
      where: { MaHKNH_MaMonHoc: { MaHKNH, MaMonHoc } },
    });
    if (monMoTx.SiSoHienTai >= monMoTx.SiSoToiDa) {
      throw new ApiError(409, 'Lớp đã đầy, không thể đăng ký thêm.', 'CLASS_FULL');
    }

    // 4. Kiểm tra môn tiên quyết (chỉ khi tham số KIEM_TRA_MON_TRUOC = "true")
    const batKiemTra = (await layThamSo(tx, 'KIEM_TRA_MON_TRUOC', 'false')) === 'true';
    if (batKiemTra) {
      const dsTruoc = await tx.cT_MONHOCTRUOC.findMany({
        where: { MaMonHoc },
        select: { MaMonHocTruoc: true },
      });
      for (const { MaMonHocTruoc } of dsTruoc) {
        // SV phải đã từng đăng ký môn tiên quyết ở một học kỳ KHÁC
        const daHoc = await tx.cT_PHIEUDK.findFirst({
          where: {
            MaMonHoc: MaMonHocTruoc,
            phieuDangKy: { MaSoSinhVien, MaHKNH: { not: MaHKNH } },
          },
        });
        if (!daHoc) {
          throw new ApiError(409, `Chưa hoàn thành môn tiên quyết "${MaMonHocTruoc}".`, 'PREREQ_MISSING');
        }
      }
    }

    // 5. Thêm chi tiết + tăng sĩ số
    await tx.cT_PHIEUDK.create({ data: { MaPhieuDK: phieu.MaPhieu, MaMonHoc } });
    await tx.mONHOCMO.update({
      where: { MaHKNH_MaMonHoc: { MaHKNH, MaMonHoc } },
      data: { SiSoHienTai: { increment: 1 } },
    });

    // 6. Tính lại tiền
    await tinhLaiTien(tx, phieu.MaPhieu);

    return tx.pHIEUDANGKY.findUnique({
      where: { MaPhieu: phieu.MaPhieu },
      include: { ctPhieuDKList: { include: { monHoc: true } } },
    });
  });
};

exports.huyMon = async ({ MaPhieu, MaMonHoc }, currentUser) => {
  const phieu = await prisma.pHIEUDANGKY.findUnique({ where: { MaPhieu } });
  if (!phieu) throw new ApiError(404, 'Không tìm thấy phiếu đăng ký.', 'NOT_FOUND');

  if (currentUser.VaiTro === 'SV' && phieu.MaSoSinhVien !== currentUser.MaSoSinhVien) {
    throw new ApiError(403, 'Bạn chỉ được hủy môn trong phiếu của mình.', 'FORBIDDEN');
  }

  const ct = await prisma.cT_PHIEUDK.findUnique({
    where: { MaPhieuDK_MaMonHoc: { MaPhieuDK: MaPhieu, MaMonHoc } },
  });
  if (!ct) throw new ApiError(404, 'Môn này không có trong phiếu.', 'NOT_IN_FORM');

  // Chặn hủy nếu phiếu đã phát sinh thanh toán (tránh phá vỡ số liệu tài chính)
  if (Number(phieu.SoTienDaDong) > 0) {
    throw new ApiError(409, 'Không thể hủy môn: phiếu đã phát sinh thanh toán.', 'HAS_PAYMENT');
  }

  return prisma.$transaction(async (tx) => {
    await tx.cT_PHIEUDK.delete({
      where: { MaPhieuDK_MaMonHoc: { MaPhieuDK: MaPhieu, MaMonHoc } },
    });
    await tx.mONHOCMO.update({
      where: { MaHKNH_MaMonHoc: { MaHKNH: phieu.MaHKNH, MaMonHoc } },
      data: { SiSoHienTai: { decrement: 1 } },
    });
    await tinhLaiTien(tx, MaPhieu);
    return tx.pHIEUDANGKY.findUnique({
      where: { MaPhieu },
      include: { ctPhieuDKList: { include: { monHoc: true } } },
    });
  });
};

exports.huyPhieu = async (maPhieu) => {
  const phieu = await prisma.pHIEUDANGKY.findUnique({
    where: { MaPhieu: maPhieu },
    include: { ctPhieuDKList: true },
  });
  if (!phieu) throw new ApiError(404, 'Không tìm thấy phiếu đăng ký.', 'NOT_FOUND');
  if (Number(phieu.SoTienDaDong) > 0) {
    throw new ApiError(409, 'Không thể hủy phiếu: đã phát sinh thanh toán.', 'HAS_PAYMENT');
  }

  await prisma.$transaction(async (tx) => {
    for (const ct of phieu.ctPhieuDKList) {
      // giảm sĩ số nếu môn mở còn tồn tại
      const monMo = await tx.mONHOCMO.findUnique({
        where: { MaHKNH_MaMonHoc: { MaHKNH: phieu.MaHKNH, MaMonHoc: ct.MaMonHoc } },
      });
      if (monMo) {
        await tx.mONHOCMO.update({
          where: { MaHKNH_MaMonHoc: { MaHKNH: phieu.MaHKNH, MaMonHoc: ct.MaMonHoc } },
          data: { SiSoHienTai: { decrement: 1 } },
        });
      }
    }
    await tx.cT_PHIEUDK.deleteMany({ where: { MaPhieuDK: maPhieu } });
    await tx.pHIEUDANGKY.delete({ where: { MaPhieu: maPhieu } });
  });

  return { message: 'Đã hủy toàn bộ phiếu đăng ký.' };
};
