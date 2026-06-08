// ============================================================================
//  Middleware xác thực (authenticate) & phân quyền (authorize)
//  Dùng lại ở TẤT CẢ các module cần đăng nhập.
// ============================================================================
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * authenticate: đọc token từ header Authorization, verify, gắn req.user.
 * Header dạng: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Bạn chưa đăng nhập.', 'NO_TOKEN'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload chứa: TenDangNhap, VaiTro, MaSoSinhVien
    req.user = payload;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'INVALID_TOKEN'));
  }
}

function authorize(...vaiTroChoPhep) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Bạn chưa đăng nhập.', 'NO_TOKEN'));
    }
    if (!vaiTroChoPhep.includes(req.user.VaiTro)) {
      return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
