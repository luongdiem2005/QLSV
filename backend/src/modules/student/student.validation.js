// Tách phần kiểm tra dữ liệu đầu vào ra riêng cho gọn controller.
const ApiError = require('../../utils/ApiError');

const GIOI_TINH_HOP_LE = ['Nam', 'Nữ'];
const TINH_TRANG_HOP_LE = ['Đang học', 'Bảo lưu', 'Thôi học'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kiểm tra payload tạo/sửa sinh viên.
 * @param {object} body - dữ liệu từ req.body
 * @param {boolean} laTaoMoi - true: tạo mới (bắt buộc MaSoSinhVien); false: cập nhật
 */
function validateSinhVien(body, laTaoMoi) {
  const loi = [];

  if (laTaoMoi) {
    if (!body.MaSoSinhVien || !String(body.MaSoSinhVien).trim()) {
      loi.push('MaSoSinhVien là bắt buộc.');
    }
  }

  if (!body.HoTen || !String(body.HoTen).trim()) {
    loi.push('HoTen là bắt buộc.');
  }
  if (!body.MaNganh || !String(body.MaNganh).trim()) {
    loi.push('MaNganh (ngành học) là bắt buộc.');
  }
  if (body.GioiTinh && !GIOI_TINH_HOP_LE.includes(body.GioiTinh)) {
    loi.push('GioiTinh chỉ nhận "Nam" hoặc "Nữ".');
  }
  if (body.TinhTrang && !TINH_TRANG_HOP_LE.includes(body.TinhTrang)) {
    loi.push('TinhTrang không hợp lệ.');
  }
  if (body.Email && !EMAIL_REGEX.test(body.Email)) {
    loi.push('Email không đúng định dạng.');
  }

  if (loi.length > 0) {
    throw new ApiError(400, loi.join(' '), 'VALIDATION');
  }
}

module.exports = { validateSinhVien };
