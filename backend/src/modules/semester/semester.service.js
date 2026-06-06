// Service module Semester: CRUD học kỳ năm học (HOCKYNAMHOC).
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

exports.list = async ({ search }) => {
  const where = {};
  if (search) {
    where.OR = [
      { MaHKNH: { contains: search } },
      { HocKy: { contains: search } },
    ];
  }
  return prisma.hOCKYNAMHOC.findMany({ where, orderBy: { NgayBatDau: 'desc' } });
};

exports.getOne = async (maHKNH) => {
  const hk = await prisma.hOCKYNAMHOC.findUnique({ where: { MaHKNH: maHKNH } });
  if (!hk) throw new ApiError(404, 'Không tìm thấy học kỳ năm học.', 'NOT_FOUND');
  return hk;
};

exports.create = async (data) => {
  const daCo = await prisma.hOCKYNAMHOC.findUnique({ where: { MaHKNH: data.MaHKNH } });
  if (daCo) throw new ApiError(409, `Mã học kỳ "${data.MaHKNH}" đã tồn tại.`, 'DUPLICATE');

  return prisma.hOCKYNAMHOC.create({
    data: {
      MaHKNH: data.MaHKNH,
      HocKy: data.HocKy,
      NgayBatDau: new Date(data.NgayBatDau),
      NgayKetThuc: new Date(data.NgayKetThuc),
      HanDongHocPhi: new Date(data.HanDongHocPhi),
    },
  });
};

exports.update = async (maHKNH, data) => {
  const hk = await prisma.hOCKYNAMHOC.findUnique({ where: { MaHKNH: maHKNH } });
  if (!hk) throw new ApiError(404, 'Không tìm thấy học kỳ năm học.', 'NOT_FOUND');

  return prisma.hOCKYNAMHOC.update({
    where: { MaHKNH: maHKNH },
    data: {
      HocKy: data.HocKy,
      NgayBatDau: new Date(data.NgayBatDau),
      NgayKetThuc: new Date(data.NgayKetThuc),
      HanDongHocPhi: new Date(data.HanDongHocPhi),
    },
  });
};

exports.remove = async (maHKNH) => {
  const hk = await prisma.hOCKYNAMHOC.findUnique({
    where: { MaHKNH: maHKNH },
    include: {
      monHocMoList: { select: { MaMonHocMo: true } },
      phieuDangKyList: { select: { MaPhieu: true } },
    },
  });
  if (!hk) throw new ApiError(404, 'Không tìm thấy học kỳ năm học.', 'NOT_FOUND');
  if (hk.monHocMoList.length) throw new ApiError(409, 'Không thể xóa: học kỳ đã mở môn.', 'IN_USE');
  if (hk.phieuDangKyList.length) throw new ApiError(409, 'Không thể xóa: học kỳ đã có phiếu đăng ký.', 'IN_USE');

  await prisma.hOCKYNAMHOC.delete({ where: { MaHKNH: maHKNH } });
  return { message: 'Đã xóa học kỳ năm học.' };
};
