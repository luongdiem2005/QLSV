const ApiError = require('../../utils/ApiError');
const VAI_TRO_HOP_LE = ['ADMIN', 'PDT', 'PTC', 'SV'];

function validateTaoTaiKhoan(body) {
  const loi = [];
  if (!body.TenDangNhap || !String(body.TenDangNhap).trim()) loi.push('TenDangNhap là bắt buộc.');
  if (!body.MatKhau || String(body.MatKhau).length < 6) loi.push('MatKhau phải có ít nhất 6 ký tự.');
  if (!body.VaiTro || !VAI_TRO_HOP_LE.includes(body.VaiTro)) loi.push('VaiTro không hợp lệ (ADMIN/PDT/PTC/SV).');
  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

module.exports = { validateTaoTaiKhoan, VAI_TRO_HOP_LE };
