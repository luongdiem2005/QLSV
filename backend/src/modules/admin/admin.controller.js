const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const { validateTaoTaiKhoan } = require('./admin.validation');
const service = require('./admin.service');

// --- Tài khoản ---
exports.listAccounts = catchAsync(async (req, res) => ok(res, await service.accounts.list(req.query)));
exports.getAccount = catchAsync(async (req, res) => ok(res, await service.accounts.getOne(req.params.ten)));
exports.createAccount = catchAsync(async (req, res) => {
  validateTaoTaiKhoan(req.body);
  return created(res, await service.accounts.create(req.body));
});
exports.updateAccount = catchAsync(async (req, res) => ok(res, await service.accounts.update(req.params.ten, req.body)));
exports.removeAccount = catchAsync(async (req, res) => ok(res, await service.accounts.remove(req.params.ten, req.user)));

// --- Tham số ---
exports.listParams = catchAsync(async (req, res) => ok(res, await service.params.list()));
exports.setParam = catchAsync(async (req, res) => {
  if (!req.params.ten) throw new ApiError(400, 'Thiếu tên tham số.', 'VALIDATION');
  return ok(res, await service.params.set(req.params.ten, req.body.GiaTri));
});
exports.removeParam = catchAsync(async (req, res) => ok(res, await service.params.remove(req.params.ten)));
