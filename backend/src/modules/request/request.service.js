/* EduFee - Đơn yêu cầu của sinh viên: Xin MIỄN GIẢM học phí / GIA HẠN đóng học phí. */
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

const LOAI = ['MIENGIAM', 'GIAHAN'];
const include = { sinhvien: { select: { MaSoSinhVien: true, HoTen: true, MaNganh: true } } };

function genMaDon() {
  return 'DON' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
}

exports.create = async (mssv, body) => {
  if (!mssv) throw new ApiError(400, 'Tài khoản này không gắn với sinh viên.', 'NO_STUDENT');
  const loai = String(body.Loai || '').toUpperCase();
  if (!LOAI.includes(loai)) throw new ApiError(400, 'Loại đơn phải là MIENGIAM hoặc GIAHAN.', 'VALIDATION');
  if (!body.LyDo || !String(body.LyDo).trim()) throw new ApiError(400, 'Vui lòng nhập lý do.', 'VALIDATION');
  const sv = await prisma.sINHVIEN.findUnique({ where: { MaSoSinhVien: mssv } });
  if (!sv) throw new ApiError(404, 'Không tìm thấy hồ sơ sinh viên.', 'NOT_FOUND');
  return prisma.dONYEUCAU.create({
    data: { MaDon: genMaDon(), MaSoSinhVien: mssv, Loai: loai, LyDo: String(body.LyDo).trim(), TrangThai: 'CHO_DUYET' },
    include,
  });
};

exports.list = async (user) => {
  const where = {};
  if (user.VaiTro === 'SV') where.MaSoSinhVien = user.MaSoSinhVien;
  return prisma.dONYEUCAU.findMany({ where, include, orderBy: { NgayTao: 'desc' } });
};

exports.duyet = async (maDon, body) => {
  const don = await prisma.dONYEUCAU.findUnique({ where: { MaDon: maDon } });
  if (!don) throw new ApiError(404, 'Không tìm thấy đơn yêu cầu.', 'NOT_FOUND');
  const tt = String(body.TrangThai || '').toUpperCase();
  if (!['DA_DUYET', 'TU_CHOI'].includes(tt)) throw new ApiError(400, 'Trạng thái xử lý không hợp lệ.', 'VALIDATION');
  return prisma.dONYEUCAU.update({
    where: { MaDon: maDon },
    data: { TrangThai: tt, GhiChuXuLy: body.GhiChuXuLy || null, NgayXuLy: new Date() },
    include,
  });
};
