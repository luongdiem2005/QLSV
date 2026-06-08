// Service module Report: tra cứu sinh viên (BM11) & báo cáo nợ học phí (BM12).
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

function tinhTinChi(soTiet, soTietMotTinChi) {
  if (!soTietMotTinChi) return 0;
  return Math.floor(soTiet / soTietMotTinChi);
}

// BM11: Tra cứu hồ sơ + lịch sử đăng ký + lịch sử thanh toán của 1 SV
exports.traCuuSinhVien = async (mssv, currentUser) => {
  if (currentUser.VaiTro === 'SV' && currentUser.MaSoSinhVien !== mssv) {
    throw new ApiError(403, 'Bạn chỉ được tra cứu hồ sơ của mình.', 'FORBIDDEN');
  }

  const sv = await prisma.sinhvien.findUnique({
    where: { MaSoSinhVien: mssv },
    include: {
      nganh: { include: { khoa: true } },
      xa: { include: { tinh: true } },
      doituonguutien: true,
      phieuDangKyList: {
        orderBy: { NgayLapPhieu: 'desc' },
        include: {
          hockynamhoc: true,
          ctPhieuDKList: { include: { monhoc: { include: { loaimonhoc: true } } } },
          phieuThuList: { orderBy: { NgayLapPhieu: 'asc' } },
        },
      },
    },
  });
  if (!sv) throw new ApiError(404, 'Không tìm thấy sinh viên.', 'NOT_FOUND');

  // Định dạng lại cho gọn, kèm số tín chỉ từng môn
  const phieuList = sv.phieuDangKyList.map((p) => ({
    MaPhieu: p.MaPhieu,
    HocKy: p.hockynamhoc.HocKy,
    MaHKNH: p.MaHKNH,
    TongTienDK: p.TongTienDK,
    TienMienGiam: p.TienMienGiam,
    TongTienPhaiDong: p.TongTienPhaiDong,
    SoTienDaDong: p.SoTienDaDong,
    SoTienConLai: p.SoTienConLai,
    monhocList: p.ctPhieuDKList.map((ct) => ({
      MaMonHoc: ct.monhoc.MaMonHoc,
      TenMonHoc: ct.monhoc.TenMonHoc,
      LoaiMon: ct.monhoc.loaimonhoc.TenLoaiMonHoc,
      SoTiet: ct.monhoc.SoTiet,
      SoTinChi: tinhTinChi(ct.monhoc.SoTiet, ct.monhoc.loaimonhoc.SoTietMotTinChi),
    })),
    lichSuThanhToan: p.phieuThuList.map((t) => ({
      MaPhieuThu: t.MaPhieuThu,
      NgayLapPhieu: t.NgayLapPhieu,
      SoTienThu: t.SoTienThu,
    })),
  }));

  return {
    thongTin: {
      MaSoSinhVien: sv.MaSoSinhVien,
      HoTen: sv.HoTen,
      NgaySinh: sv.NgaySinh,
      GioiTinh: sv.GioiTinh,
      SoDienThoai: sv.SoDienThoai,
      Email: sv.Email,
      TinhTrang: sv.TinhTrang,
      Nganh: sv.nganh ? sv.nganh.TenNganh : null,
      Khoa: sv.nganh && sv.nganh.khoa ? sv.nganh.khoa.TenKhoa : null,
      Xa: sv.xa ? sv.xa.TenXa : null,
      Tinh: sv.xa && sv.xa.tinh ? sv.xa.tinh.TenTinh : null,
      DoiTuongUuTien: sv.doituonguutien ? sv.doituonguutien.TenDoiTuong : null,
      TyLeMienGiam: sv.doituonguutien ? sv.doituonguutien.TyLeMienGiam : 0,
    },
    lichSuDangKy: phieuList,
  };
};

// BM12: Danh sách SV chưa hoàn thành học phí trong 1 học kỳ
exports.svChuaHoanThanhHP = async (maHKNH) => {
  if (!maHKNH) throw new ApiError(400, 'Thiếu tham số maHKNH (học kỳ năm học).', 'VALIDATION');

  const rows = await prisma.phieudangky.findMany({
    where: { MaHKNH: maHKNH, SoTienConLai: { gt: 0 } },
    include: { sinhvien: { select: { MaSoSinhVien: true, HoTen: true } } },
    orderBy: { SoTienConLai: 'desc' },
  });

  const danhSach = rows.map((r) => ({
    MaSoSinhVien: r.MaSoSinhVien,
    HoTen: r.sinhvien.HoTen,
    TongTienPhaiDong: r.TongTienPhaiDong,
    SoTienDaDong: r.SoTienDaDong,
    SoTienConLai: r.SoTienConLai,
  }));

  const tongNo = danhSach.reduce((s, x) => s + Number(x.SoTienConLai), 0);
  return { maHKNH, soLuong: danhSach.length, tongTienConNo: tongNo, danhSach };
};
