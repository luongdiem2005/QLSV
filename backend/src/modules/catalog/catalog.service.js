// ============================================================================
//  Service module Catalog: CRUD cho 6 bảng danh mục.
//  Dùng FACTORY "dinhNghiaCrud" để tránh lặp code; mỗi bảng truyền vào các
//  hook riêng: validate (kiểm dữ liệu), mapData (lọc đúng cột), kiemTraFK
//  (kiểm khóa ngoại), chanXoa (chặn xóa khi còn bị tham chiếu).
// ============================================================================
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const v = require('./catalog.validation');

/**
 * Tạo bộ CRUD chuẩn cho một bảng danh mục.
 * @param {object} cfg
 *   - delegate: prisma.<model>
 *   - idField: tên cột khóa chính
 *   - tenHienThi: tên hiển thị trong thông báo
 *   - searchFields: các cột cho phép tìm kiếm
 *   - include: quan hệ cần trả kèm (tùy chọn)
 *   - validate(body, taoMoi): kiểm dữ liệu (tùy chọn)
 *   - mapData(body): chuyển body -> đúng các cột của bảng
 *   - kiemTraFK(body): kiểm khóa ngoại tồn tại (tùy chọn)
 *   - chanXoa(id): ném lỗi nếu còn bị tham chiếu (tùy chọn)
 */
function dinhNghiaCrud(cfg) {
  const { delegate, idField, tenHienThi, searchFields, include, validate, mapData, kiemTraFK, chanXoa } = cfg;

  return {
    list: async ({ search } = {}) => {
      const where = {};
      if (search && searchFields) {
        where.OR = searchFields.map((f) => ({ [f]: { contains: search } }));
      }
      return delegate.findMany({ where, include, orderBy: { [idField]: 'asc' } });
    },

    getOne: async (id) => {
      const row = await delegate.findUnique({ where: { [idField]: id }, include });
      if (!row) throw new ApiError(404, `Không tìm thấy ${tenHienThi}.`, 'NOT_FOUND');
      return row;
    },

    create: async (body) => {
      if (validate) validate(body, true);
      const existed = await delegate.findUnique({ where: { [idField]: body[idField] } });
      if (existed) throw new ApiError(409, `Mã ${tenHienThi} "${body[idField]}" đã tồn tại.`, 'DUPLICATE');
      if (kiemTraFK) await kiemTraFK(body);
      return delegate.create({ data: mapData(body), include });
    },

    update: async (id, body) => {
      if (validate) validate(body, false);
      const existed = await delegate.findUnique({ where: { [idField]: id } });
      if (!existed) throw new ApiError(404, `Không tìm thấy ${tenHienThi}.`, 'NOT_FOUND');
      if (kiemTraFK) await kiemTraFK(body);
      const data = mapData(body);
      delete data[idField]; // không cho đổi khóa chính
      return delegate.update({ where: { [idField]: id }, data, include });
    },

    remove: async (id) => {
      const existed = await delegate.findUnique({ where: { [idField]: id } });
      if (!existed) throw new ApiError(404, `Không tìm thấy ${tenHienThi}.`, 'NOT_FOUND');
      if (chanXoa) await chanXoa(id);
      await delegate.delete({ where: { [idField]: id } });
      return { message: `Đã xóa ${tenHienThi}.` };
    },
  };
}

// --------------------------- KHOA ---------------------------
const khoa = dinhNghiaCrud({
  delegate: prisma.khoa, idField: 'MaKhoa', tenHienThi: 'khoa',
  searchFields: ['MaKhoa', 'TenKhoa'],
  validate: v.validateKhoa,
  mapData: (b) => ({ MaKhoa: b.MaKhoa, TenKhoa: b.TenKhoa, VanPhongKhoa: b.VanPhongKhoa || null, GhiChu: b.GhiChu || null }),
  chanXoa: async (id) => {
    const k = await prisma.khoa.findUnique({
      where: { MaKhoa: id },
      include: { nganhList: { select: { MaNganh: true } }, monhocList: { select: { MaMonHoc: true } } },
    });
    if (k.nganhList.length) throw new ApiError(409, 'Không thể xóa: khoa còn ngành học.', 'IN_USE');
    if (k.monhocList.length) throw new ApiError(409, 'Không thể xóa: khoa còn môn học.', 'IN_USE');
  },
});

// --------------------------- NGANH ---------------------------
const nganh = dinhNghiaCrud({
  delegate: prisma.nganh, idField: 'MaNganh', tenHienThi: 'ngành học',
  searchFields: ['MaNganh', 'TenNganh'],
  include: { khoa: { select: { MaKhoa: true, TenKhoa: true } } },
  validate: v.validateNganh,
  kiemTraFK: async (b) => {
    const k = await prisma.khoa.findUnique({ where: { MaKhoa: b.MaKhoa } });
    if (!k) throw new ApiError(404, `Khoa "${b.MaKhoa}" không tồn tại.`, 'KHOA_NOT_FOUND');
  },
  mapData: (b) => ({ MaNganh: b.MaNganh, TenNganh: b.TenNganh, MaKhoa: b.MaKhoa, GhiChu: b.GhiChu || null }),
  chanXoa: async (id) => {
    const n = await prisma.nganh.findUnique({
      where: { MaNganh: id },
      include: { sinhvienList: { select: { MaSoSinhVien: true } }, chuongTrinhList: { select: { MaMonHoc: true } } },
    });
    if (n.sinhvienList.length) throw new ApiError(409, 'Không thể xóa: ngành còn sinh viên.', 'IN_USE');
    if (n.chuongTrinhList.length) throw new ApiError(409, 'Không thể xóa: ngành còn chương trình học.', 'IN_USE');
  },
});

// --------------------------- LOAIMONHOC ---------------------------
const loaimonhoc = dinhNghiaCrud({
  delegate: prisma.loaimonhoc, idField: 'MaLoaiMonHoc', tenHienThi: 'loại môn học',
  searchFields: ['MaLoaiMonHoc', 'TenLoaiMonHoc'],
  validate: v.validateLoaiMonHoc,
  mapData: (b) => ({
    MaLoaiMonHoc: b.MaLoaiMonHoc,
    TenLoaiMonHoc: b.TenLoaiMonHoc,
    SoTietMotTinChi: Number(b.SoTietMotTinChi),
    SoTienMotTinChi: Number(b.SoTienMotTinChi),
  }),
  chanXoa: async (id) => {
    const l = await prisma.loaimonhoc.findUnique({ where: { MaLoaiMonHoc: id }, include: { monhocList: { select: { MaMonHoc: true } } } });
    if (l.monhocList.length) throw new ApiError(409, 'Không thể xóa: còn môn học dùng loại này.', 'IN_USE');
  },
});

// --------------------------- TINH ---------------------------
const tinh = dinhNghiaCrud({
  delegate: prisma.tinh, idField: 'MaTinh', tenHienThi: 'tỉnh',
  searchFields: ['MaTinh', 'TenTinh'],
  validate: v.validateTinh,
  mapData: (b) => ({ MaTinh: b.MaTinh, TenTinh: b.TenTinh }),
  chanXoa: async (id) => {
    const t = await prisma.tinh.findUnique({ where: { MaTinh: id }, include: { xaList: { select: { MaXa: true } } } });
    if (t.xaList.length) throw new ApiError(409, 'Không thể xóa: tỉnh còn xã/phường.', 'IN_USE');
  },
});

// --------------------------- XA ---------------------------
const xa = dinhNghiaCrud({
  delegate: prisma.xa, idField: 'MaXa', tenHienThi: 'xã/phường',
  searchFields: ['MaXa', 'TenXa'],
  include: { tinh: { select: { MaTinh: true, TenTinh: true } } },
  validate: v.validateXa,
  kiemTraFK: async (b) => {
    const t = await prisma.tinh.findUnique({ where: { MaTinh: b.MaTinh } });
    if (!t) throw new ApiError(404, `Tỉnh "${b.MaTinh}" không tồn tại.`, 'TINH_NOT_FOUND');
  },
  mapData: (b) => ({
    MaXa: b.MaXa,
    MaTinh: b.MaTinh,
    TenXa: b.TenXa,
    VungSauVungXa: b.VungSauVungXa === true || b.VungSauVungXa === 'true',
    GhiChu: b.GhiChu || null,
  }),
  chanXoa: async (id) => {
    const x = await prisma.xa.findUnique({ where: { MaXa: id }, include: { sinhvienList: { select: { MaSoSinhVien: true } } } });
    if (x.sinhvienList.length) throw new ApiError(409, 'Không thể xóa: xã còn sinh viên.', 'IN_USE');
  },
});

// --------------------------- DOITUONGUUTIEN ---------------------------
const doituonguutien = dinhNghiaCrud({
  delegate: prisma.doituonguutien, idField: 'MaDoiTuong', tenHienThi: 'đối tượng ưu tiên',
  searchFields: ['MaDoiTuong', 'TenDoiTuong'],
  validate: v.validateDoiTuong,
  mapData: (b) => ({
    MaDoiTuong: b.MaDoiTuong,
    TenDoiTuong: b.TenDoiTuong,
    TyLeMienGiam: Number(b.TyLeMienGiam),
    GhiChu: b.GhiChu || null,
  }),
  chanXoa: async (id) => {
    const d = await prisma.doituonguutien.findUnique({ where: { MaDoiTuong: id }, include: { sinhvienList: { select: { MaSoSinhVien: true } } } });
    if (d.sinhvienList.length) throw new ApiError(409, 'Không thể xóa: còn sinh viên thuộc đối tượng này.', 'IN_USE');
  },
});

module.exports = { khoa, nganh, loaimonhoc, tinh, xa, doituonguutien };
