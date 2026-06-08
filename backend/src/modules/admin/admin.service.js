// Service module Admin: quản lý tài khoản (NGUOIDUNG) và tham số hệ thống (THAMSO).
const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

function boMatKhau(u) {
  if (!u) return u;
  const { MatKhau, ...rest } = u;
  return rest;
}

// ---------------- TÀI KHOẢN ----------------
const accounts = {
  list: async ({ search, vaiTro }) => {
    const where = {};
    if (vaiTro) where.VaiTro = vaiTro;
    if (search) where.OR = [{ TenDangNhap: { contains: search } }, { HoTen: { contains: search } }];
    const rows = await prisma.nguoidung.findMany({ where, orderBy: { TenDangNhap: 'asc' } });
    return rows.map(boMatKhau);
  },

  getOne: async (ten) => {
    const u = await prisma.nguoidung.findUnique({ where: { TenDangNhap: ten } });
    if (!u) throw new ApiError(404, 'Không tìm thấy tài khoản.', 'NOT_FOUND');
    return boMatKhau(u);
  },

  create: async (data) => {
    const existed = await prisma.nguoidung.findUnique({ where: { TenDangNhap: data.TenDangNhap } });
    if (existed) throw new ApiError(409, `Tên đăng nhập "${data.TenDangNhap}" đã tồn tại.`, 'DUPLICATE');

    let maSV = null;
    if (data.VaiTro === 'SV') {
      if (!data.MaSoSinhVien) throw new ApiError(400, 'Tài khoản SV phải gắn MaSoSinhVien.', 'VALIDATION');
      const sv = await prisma.sinhvien.findUnique({ where: { MaSoSinhVien: data.MaSoSinhVien } });
      if (!sv) throw new ApiError(404, `Sinh viên "${data.MaSoSinhVien}" không tồn tại.`, 'SV_NOT_FOUND');
      const linked = await prisma.nguoidung.findUnique({ where: { MaSoSinhVien: data.MaSoSinhVien } });
      if (linked) throw new ApiError(409, 'Sinh viên này đã có tài khoản.', 'SV_LINKED');
      maSV = data.MaSoSinhVien;
    }

    const hash = await bcrypt.hash(data.MatKhau, 10);
    const created = await prisma.nguoidung.create({
      data: {
        TenDangNhap: data.TenDangNhap,
        MatKhau: hash,
        VaiTro: data.VaiTro,
        HoTen: data.HoTen || null,
        MaSoSinhVien: maSV,
        TrangThai: data.TrangThai === undefined ? true : !!data.TrangThai,
      },
    });
    return boMatKhau(created);
  },

  update: async (ten, data) => {
    const u = await prisma.nguoidung.findUnique({ where: { TenDangNhap: ten } });
    if (!u) throw new ApiError(404, 'Không tìm thấy tài khoản.', 'NOT_FOUND');

    const patch = {};
    if (data.HoTen !== undefined) patch.HoTen = data.HoTen || null;
    if (data.VaiTro !== undefined) patch.VaiTro = data.VaiTro;
    if (data.TrangThai !== undefined) patch.TrangThai = !!data.TrangThai;
    if (data.MatKhauMoi) {
      if (String(data.MatKhauMoi).length < 6) throw new ApiError(400, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'VALIDATION');
      patch.MatKhau = await bcrypt.hash(data.MatKhauMoi, 10);
    }

    const updated = await prisma.nguoidung.update({ where: { TenDangNhap: ten }, data: patch });
    return boMatKhau(updated);
  },

  remove: async (ten, currentUser) => {
    if (ten === currentUser.TenDangNhap) {
      throw new ApiError(409, 'Không thể xóa tài khoản đang đăng nhập.', 'SELF_DELETE');
    }
    const u = await prisma.nguoidung.findUnique({ where: { TenDangNhap: ten } });
    if (!u) throw new ApiError(404, 'Không tìm thấy tài khoản.', 'NOT_FOUND');
    await prisma.nguoidung.delete({ where: { TenDangNhap: ten } });
    return { message: 'Đã xóa tài khoản.' };
  },
};

// ---------------- THAM SỐ HỆ THỐNG ----------------
const params = {
  list: () => prisma.thamso.findMany({ orderBy: { TenThamSo: 'asc' } }),

  set: async (ten, giaTri) => {
    if (giaTri === undefined || giaTri === null) {
      throw new ApiError(400, 'Thiếu GiaTri.', 'VALIDATION');
    }
    return prisma.thamso.upsert({
      where: { TenThamSo: ten },
      update: { GiaTri: String(giaTri) },
      create: { TenThamSo: ten, GiaTri: String(giaTri) },
    });
  },

  remove: async (ten) => {
    const t = await prisma.thamso.findUnique({ where: { TenThamSo: ten } });
    if (!t) throw new ApiError(404, 'Không tìm thấy tham số.', 'NOT_FOUND');
    await prisma.thamso.delete({ where: { TenThamSo: ten } });
    return { message: 'Đã xóa tham số.' };
  },
};

module.exports = { accounts, params };
