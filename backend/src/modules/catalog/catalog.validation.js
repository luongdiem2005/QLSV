const ApiError = require('../../utils/ApiError');

// Kiểm tra các trường bắt buộc không rỗng, trả về mảng lỗi
function batBuoc(body, fields) {
  const loi = [];
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || String(body[f]).trim() === '') {
      loi.push(`${f} là bắt buộc.`);
    }
  }
  return loi;
}

function nemNeuLoi(loi) {
  if (loi.length) throw new ApiError(400, loi.join(' '), 'VALIDATION');
}

exports.validateKhoa = (body, taoMoi) => {
  nemNeuLoi(batBuoc(body, taoMoi ? ['MaKhoa', 'TenKhoa'] : ['TenKhoa']));
};

exports.validateNganh = (body, taoMoi) => {
  nemNeuLoi(batBuoc(body, taoMoi ? ['MaNganh', 'TenNganh', 'MaKhoa'] : ['TenNganh', 'MaKhoa']));
};

exports.validateLoaiMonHoc = (body, taoMoi) => {
  const loi = batBuoc(body, taoMoi
    ? ['MaLoaiMonHoc', 'TenLoaiMonHoc', 'SoTietMotTinChi', 'SoTienMotTinChi']
    : ['TenLoaiMonHoc', 'SoTietMotTinChi', 'SoTienMotTinChi']);
  if (body.SoTietMotTinChi !== undefined && (!Number.isInteger(Number(body.SoTietMotTinChi)) || Number(body.SoTietMotTinChi) <= 0)) {
    loi.push('SoTietMotTinChi phải là số nguyên lớn hơn 0.');
  }
  if (body.SoTienMotTinChi !== undefined && (isNaN(Number(body.SoTienMotTinChi)) || Number(body.SoTienMotTinChi) < 0)) {
    loi.push('SoTienMotTinChi phải là số lớn hơn hoặc bằng 0.');
  }
  nemNeuLoi(loi);
};

exports.validateTinh = (body, taoMoi) => {
  nemNeuLoi(batBuoc(body, taoMoi ? ['MaTinh', 'TenTinh'] : ['TenTinh']));
};

exports.validateXa = (body, taoMoi) => {
  nemNeuLoi(batBuoc(body, taoMoi ? ['MaXa', 'MaTinh', 'TenXa'] : ['MaTinh', 'TenXa']));
};

exports.validateDoiTuong = (body, taoMoi) => {
  const loi = batBuoc(body, taoMoi ? ['MaDoiTuong', 'TenDoiTuong', 'TyLeMienGiam'] : ['TenDoiTuong', 'TyLeMienGiam']);
  const tyle = Number(body.TyLeMienGiam);
  if (body.TyLeMienGiam !== undefined && (isNaN(tyle) || tyle < 0 || tyle > 100)) {
    loi.push('TyLeMienGiam phải nằm trong khoảng 0–100.');
  }
  nemNeuLoi(loi);
};
