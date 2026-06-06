const ApiError = require('../../utils/ApiError');

function validateHocKy(body, laTaoMoi) {
  const loi = [];
  if (laTaoMoi && (!body.MaHKNH || !String(body.MaHKNH).trim())) loi.push('MaHKNH là bắt buộc.');
  if (!body.HocKy || !String(body.HocKy).trim()) loi.push('HocKy là bắt buộc.');

  const bd = body.NgayBatDau ? new Date(body.NgayBatDau) : null;
  const kt = body.NgayKetThuc ? new Date(body.NgayKetThuc) : null;
  const han = body.HanDongHocPhi ? new Date(body.HanDongHocPhi) : null;

  if (!bd || isNaN(bd.getTime())) loi.push('NgayBatDau không hợp lệ.');
  if (!kt || isNaN(kt.getTime())) loi.push('NgayKetThuc không hợp lệ.');
  if (!han || isNaN(han.getTime())) loi.push('HanDongHocPhi không hợp lệ.');
  if (bd && kt && !isNaN(bd) && !isNaN(kt) && bd >= kt) loi.push('NgayBatDau phải trước NgayKetThuc.');
  if (bd && han && !isNaN(bd) && !isNaN(han) && han < bd) loi.push('HanDongHocPhi phải sau hoặc bằng NgayBatDau.');

  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

module.exports = { validateHocKy };
