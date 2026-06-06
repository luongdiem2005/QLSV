const ApiError = require('../../utils/ApiError');

function validateThu(body) {
  const loi = [];
  if (!body.MaPhieuDK || !String(body.MaPhieuDK).trim()) loi.push('MaPhieuDK (mã phiếu đăng ký) là bắt buộc.');
  const soTien = Number(body.SoTienThu);
  if (body.SoTienThu === undefined || body.SoTienThu === null || !Number.isFinite(soTien) || soTien <= 0) {
    loi.push('SoTienThu phải là số lớn hơn 0.');
  }
  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

module.exports = { validateThu };
