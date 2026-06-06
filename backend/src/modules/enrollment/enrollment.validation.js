const ApiError = require('../../utils/ApiError');

// Kiểm tra dữ liệu đăng ký một môn
function validateDangKy(body) {
  const loi = [];
  if (!body.MaHKNH || !String(body.MaHKNH).trim()) loi.push('MaHKNH (học kỳ) là bắt buộc.');
  if (!body.MaMonHoc || !String(body.MaMonHoc).trim()) loi.push('MaMonHoc là bắt buộc.');
  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

module.exports = { validateDangKy };
