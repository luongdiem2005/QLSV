// Controller module Auth: nhận req, gọi service, trả response. KHÔNG chứa logic DB.
const catchAsync = require('../../utils/catchAsync');
const { ok } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const authService = require('./auth.service');

exports.login = catchAsync(async (req, res) => {
  const { TenDangNhap, MatKhau } = req.body;
  if (!TenDangNhap || !MatKhau) {
    throw new ApiError(400, 'Vui lòng nhập tên đăng nhập và mật khẩu.', 'VALIDATION');
  }
  const result = await authService.login(TenDangNhap, MatKhau);
  return ok(res, result);
});

exports.getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.TenDangNhap);
  return ok(res, user);
});

exports.changePassword = catchAsync(async (req, res) => {
  const { MatKhauCu, MatKhauMoi } = req.body;
  if (!MatKhauCu || !MatKhauMoi) {
    throw new ApiError(400, 'Vui lòng nhập đủ mật khẩu cũ và mới.', 'VALIDATION');
  }
  if (MatKhauMoi.length < 6) {
    throw new ApiError(400, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 'VALIDATION');
  }
  if (MatKhauMoi === MatKhauCu) {
    throw new ApiError(400, 'Mật khẩu mới phải khác mật khẩu cũ.', 'VALIDATION');
  }
  const result = await authService.changePassword(req.user.TenDangNhap, MatKhauCu, MatKhauMoi);
  return ok(res, result);
});
