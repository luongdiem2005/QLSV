// Service module Offering: quản lý môn được mở trong học kỳ (MONHOCMO).
// Lưu ý: SiSoHienTai do module Enrollment thay đổi (khi SV đăng ký/hủy),
// module này KHÔNG tự sửa SiSoHienTai.
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

const includeQuanHe = {
  monhoc: {
    select: {
      MaMonHoc: true,
      TenMonHoc: true,
      SoTiet: true,
      loaimonhoc: { select: { MaLoaiMonHoc: true, TenLoaiMonHoc: true, SoTietMotTinChi: true, SoTienMotTinChi: true } },
    },
  },
  hockynamhoc: { select: { MaHKNH: true, HocKy: true } },
};

async function kiemTraKhoaNgoai({ MaHKNH, MaMonHoc }) {
  const hk = await prisma.hockynamhoc.findUnique({ where: { MaHKNH } });
  if (!hk) throw new ApiError(404, `Học kỳ "${MaHKNH}" không tồn tại.`, 'HKNH_NOT_FOUND');
  const mon = await prisma.monhoc.findUnique({ where: { MaMonHoc } });
  if (!mon) throw new ApiError(404, `Môn học "${MaMonHoc}" không tồn tại.`, 'MONHOC_NOT_FOUND');
}

exports.list = async ({ maHKNH, search }) => {
  const where = {};
  if (maHKNH) where.MaHKNH = maHKNH;
  if (search) {
    where.OR = [
      { MaMonHocMo: { contains: search } },
      { MaMonHoc: { contains: search } },
    ];
  }
  return prisma.monhocmo.findMany({ where, include: includeQuanHe, orderBy: { MaMonHocMo: 'asc' } });
};

exports.getOne = async (id) => {
  const o = await prisma.monhocmo.findUnique({ where: { MaMonHocMo: id }, include: includeQuanHe });
  if (!o) throw new ApiError(404, 'Không tìm thấy môn mở.', 'NOT_FOUND');
  return o;
};

exports.create = async (data) => {
  const daCo = await prisma.monhocmo.findUnique({ where: { MaMonHocMo: data.MaMonHocMo } });
  if (daCo) throw new ApiError(409, `Mã môn mở "${data.MaMonHocMo}" đã tồn tại.`, 'DUPLICATE');

  await kiemTraKhoaNgoai(data);

  // Chống mở TRÙNG một môn trong cùng học kỳ (unique [MaHKNH, MaMonHoc])
  const trung = await prisma.monhocmo.findUnique({
    where: { MaHKNH_MaMonHoc: { MaHKNH: data.MaHKNH, MaMonHoc: data.MaMonHoc } },
  });
  if (trung) throw new ApiError(409, 'Môn này đã được mở trong học kỳ đó.', 'ALREADY_OPENED');

  return prisma.monhocmo.create({
    data: {
      MaMonHocMo: data.MaMonHocMo,
      MaHKNH: data.MaHKNH,
      MaMonHoc: data.MaMonHoc,
      SiSoToiDa: data.SiSoToiDa ? Number(data.SiSoToiDa) : 50,
      SiSoHienTai: 0,
    },
    include: includeQuanHe,
  });
};

exports.update = async (id, data) => {
  const o = await prisma.monhocmo.findUnique({ where: { MaMonHocMo: id } });
  if (!o) throw new ApiError(404, 'Không tìm thấy môn mở.', 'NOT_FOUND');

  // Sau khi đã tạo, chỉ cho đổi SiSoToiDa (đổi môn/học kỳ sẽ phá dữ liệu đăng ký)
  const siSoMoi = Number(data.SiSoToiDa);
  if (!Number.isInteger(siSoMoi) || siSoMoi <= 0) {
    throw new ApiError(400, 'SiSoToiDa phải là số nguyên lớn hơn 0.', 'VALIDATION');
  }
  if (siSoMoi < o.SiSoHienTai) {
    throw new ApiError(409, `Không thể đặt sĩ số tối đa (${siSoMoi}) nhỏ hơn sĩ số hiện tại (${o.SiSoHienTai}).`, 'INVALID_CAPACITY');
  }

  return prisma.monhocmo.update({
    where: { MaMonHocMo: id },
    data: { SiSoToiDa: siSoMoi },
    include: includeQuanHe,
  });
};

exports.remove = async (id) => {
  const o = await prisma.monhocmo.findUnique({ where: { MaMonHocMo: id } });
  if (!o) throw new ApiError(404, 'Không tìm thấy môn mở.', 'NOT_FOUND');
  if (o.SiSoHienTai > 0) {
    throw new ApiError(409, 'Không thể xóa: đã có sinh viên đăng ký môn mở này.', 'HAS_ENROLLMENT');
  }
  await prisma.monhocmo.delete({ where: { MaMonHocMo: id } });
  return { message: 'Đã xóa môn mở.' };
};
