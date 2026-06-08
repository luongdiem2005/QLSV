// Tạo dữ liệu mẫu để test ngay sau khi migrate.
// Chạy:  npm run prisma:seed   (hoặc tự động khi prisma migrate dev)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // 1. Tài khoản cho 3 vai trò cán bộ
  await prisma.nguoidung.upsert({
    where: { TenDangNhap: 'admin' },
    update: {},
    create: { TenDangNhap: 'admin', MatKhau: hash, VaiTro: 'ADMIN', HoTen: 'Quản trị viên' },
  });
  await prisma.nguoidung.upsert({
    where: { TenDangNhap: 'pdt' },
    update: {},
    create: { TenDangNhap: 'pdt', MatKhau: hash, VaiTro: 'PDT', HoTen: 'Phòng Đào tạo' },
  });
  await prisma.nguoidung.upsert({
    where: { TenDangNhap: 'ptc' },
    update: {},
    create: { TenDangNhap: 'ptc', MatKhau: hash, VaiTro: 'PTC', HoTen: 'Phòng Tài chính' },
  });

  // 2. Danh mục nền
  await prisma.tinh.upsert({ where: { MaTinh: 'HCM' }, update: {}, create: { MaTinh: 'HCM', TenTinh: 'TP. Hồ Chí Minh' } });
  await prisma.xa.upsert({ where: { MaXa: 'X001' }, update: {}, create: { MaXa: 'X001', MaTinh: 'HCM', TenXa: 'Phường Linh Trung' } });
  await prisma.doituonguutien.upsert({ where: { MaDoiTuong: 'KHONG' }, update: {}, create: { MaDoiTuong: 'KHONG', TenDoiTuong: 'Không ưu tiên', TyLeMienGiam: 0 } });
  const dsDoiTuong = [
    { MaDoiTuong: 'CONLIETSI',  TenDoiTuong: 'Con liệt sĩ',                 TyLeMienGiam: 100 },
    { MaDoiTuong: 'CONTHUONGBINH', TenDoiTuong: 'Con thương binh',          TyLeMienGiam: 70 },
    { MaDoiTuong: 'DANTOCTHIEUSO', TenDoiTuong: 'Dân tộc thiểu số',         TyLeMienGiam: 50 },
    { MaDoiTuong: 'VUNGSAU',    TenDoiTuong: 'Vùng sâu, vùng xa',           TyLeMienGiam: 30 },
    { MaDoiTuong: 'HONGHEO',    TenDoiTuong: 'Hộ nghèo',                    TyLeMienGiam: 50 },
    { MaDoiTuong: 'HOCANNGHEO', TenDoiTuong: 'Hộ cận nghèo',                TyLeMienGiam: 30 },
    { MaDoiTuong: 'MOCOI',      TenDoiTuong: 'Mồ côi cả cha lẫn mẹ',        TyLeMienGiam: 100 },
    { MaDoiTuong: 'KHUYETTAT',  TenDoiTuong: 'Khuyết tật',                  TyLeMienGiam: 50 },
  ];
  for (const dt of dsDoiTuong) {
    await prisma.doituonguutien.upsert({ where: { MaDoiTuong: dt.MaDoiTuong }, update: {}, create: dt });
  }
  await prisma.khoa.upsert({ where: { MaKhoa: 'CNPM' }, update: {}, create: { MaKhoa: 'CNPM', TenKhoa: 'Công nghệ Phần mềm' } });
  await prisma.nganh.upsert({ where: { MaNganh: 'KTPM' }, update: {}, create: { MaNganh: 'KTPM', TenNganh: 'Kỹ thuật Phần mềm', MaKhoa: 'CNPM' } });

  // 3. Loại môn (quy tắc tín chỉ + đơn giá)
  await prisma.loaimonhoc.upsert({ where: { MaLoaiMonHoc: 'LT' }, update: {}, create: { MaLoaiMonHoc: 'LT', TenLoaiMonHoc: 'Lý thuyết', SoTietMotTinChi: 15, SoTienMotTinChi: 400000 } });
  await prisma.loaimonhoc.upsert({ where: { MaLoaiMonHoc: 'TH' }, update: {}, create: { MaLoaiMonHoc: 'TH', TenLoaiMonHoc: 'Thực hành', SoTietMotTinChi: 30, SoTienMotTinChi: 600000 } });

  // 4. Học kỳ năm học mẫu (để test mở môn)
  await prisma.hockynamhoc.upsert({
    where: { MaHKNH: '2026-HK1' },
    update: {},
    create: {
      MaHKNH: '2026-HK1',
      HocKy: 'HK1',
      NgayBatDau: new Date('2026-09-01'),
      NgayKetThuc: new Date('2027-01-15'),
      HanDongHocPhi: new Date('2026-10-31'),
    },
  });

  // 5. Môn học mẫu: SE104 (Lý thuyết, 45 tiết -> 3 tín chỉ × 400.000 = 1.200.000đ)
  await prisma.monhoc.upsert({
    where: { MaMonHoc: 'SE104' },
    update: {},
    create: { MaMonHoc: 'SE104', TenMonHoc: 'Nhập môn Công nghệ phần mềm', MaKhoa: 'CNPM', MaLoaiMonHoc: 'LT', SoTiet: 45 },
  });

  // 6. Mở môn SE104 trong học kỳ 2026-HK1
  await prisma.monhocmo.upsert({
    where: { MaMonHocMo: 'SE104.O11' },
    update: {},
    create: { MaMonHocMo: 'SE104.O11', MaHKNH: '2026-HK1', MaMonHoc: 'SE104', SiSoToiDa: 50, SiSoHienTai: 0 },
  });

  // 7. Một sinh viên mẫu + tài khoản đăng nhập (để test SV tự đăng ký)
  await prisma.sinhvien.upsert({
    where: { MaSoSinhVien: '23520001' },
    update: {},
    create: { MaSoSinhVien: '23520001', HoTen: 'Nguyễn Văn A', GioiTinh: 'Nam', MaNganh: 'KTPM', MaDoiTuong: 'KHONG', TinhTrang: 'Đang học' },
  });
  await prisma.nguoidung.upsert({
    where: { TenDangNhap: '23520001' },
    update: {},
    create: { TenDangNhap: '23520001', MatKhau: hash, VaiTro: 'SV', HoTen: 'Nguyễn Văn A', MaSoSinhVien: '23520001' },
  });

  // 8. Tham số hệ thống (QĐ13)
  await prisma.thamso.upsert({ where: { TenThamSo: 'KIEM_TRA_MON_TRUOC' }, update: {}, create: { TenThamSo: 'KIEM_TRA_MON_TRUOC', GiaTri: 'false' } });
  await prisma.thamso.upsert({ where: { TenThamSo: 'TY_LE_MIEN_GIAM_MIN' }, update: {}, create: { TenThamSo: 'TY_LE_MIEN_GIAM_MIN', GiaTri: '0' } });
  await prisma.thamso.upsert({ where: { TenThamSo: 'TY_LE_MIEN_GIAM_MAX' }, update: {}, create: { TenThamSo: 'TY_LE_MIEN_GIAM_MAX', GiaTri: '100' } });

  console.log('✅ Seed dữ liệu mẫu xong. Tài khoản cán bộ: admin / pdt / ptc — mật khẩu: 123456');
  console.log('   Tài khoản sinh viên test: 23520001 — mật khẩu: 123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
