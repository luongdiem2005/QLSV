const ApiError = require('../../utils/ApiError');

/**
 * Kiểm tra payload tạo/sửa môn học.
 * @param {object} body
 * @param {boolean} laTaoMoi - true: bắt buộc MaMonHoc
 */
function validateMonHoc(body, laTaoMoi) {
  const loi = [];

  if (laTaoMoi) {
    if (!body.MaMonHoc || !String(body.MaMonHoc).trim()) {
      loi.push('MaMonHoc là bắt buộc.');
    }
  }
  if (!body.TenMonHoc || !String(body.TenMonHoc).trim()) {
    loi.push('TenMonHoc là bắt buộc.');
  }
  if (!body.MaKhoa || !String(body.MaKhoa).trim()) {
    loi.push('MaKhoa (khoa phụ trách) là bắt buộc.');
  }
  if (!body.MaLoaiMonHoc || !String(body.MaLoaiMonHoc).trim()) {
    loi.push('MaLoaiMonHoc (loại môn) là bắt buộc.');
  }
  if (body.SoTiet === undefined || body.SoTiet === null || !Number.isInteger(Number(body.SoTiet)) || Number(body.SoTiet) <= 0) {
    loi.push('SoTiet phải là số nguyên lớn hơn 0.');
  }
  if (body.monHocTruoc && !Array.isArray(body.monHocTruoc)) {
    loi.push('monHocTruoc phải là một mảng mã môn học.');
  }

  if (loi.length > 0) {
    throw new ApiError(400, loi.join(' '), 'VALIDATION');
  }
}

module.exports = { validateMonHoc };
