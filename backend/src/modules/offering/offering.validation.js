const ApiError = require('../../utils/ApiError');

// Kiểm tra payload tạo môn mở (MONHOCMO)
function validateMonHocMo(body) {
  const loi = [];
  if (!body.MaMonHocMo || !String(body.MaMonHocMo).trim()) loi.push('MaMonHocMo (mã lớp/môn mở) là bắt buộc.');
  if (!body.MaHKNH || !String(body.MaHKNH).trim()) loi.push('MaHKNH (học kỳ) là bắt buộc.');
  if (!body.MaMonHoc || !String(body.MaMonHoc).trim()) loi.push('MaMonHoc là bắt buộc.');
  if (body.SiSoToiDa !== undefined && (!Number.isInteger(Number(body.SiSoToiDa)) || Number(body.SiSoToiDa) <= 0)) {
    loi.push('SiSoToiDa phải là số nguyên lớn hơn 0.');
  }
  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

module.exports = { validateMonHocMo };
