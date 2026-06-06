const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const { validateThu } = require('./payment.validation');
const service = require('./payment.service');

exports.create = catchAsync(async (req, res) => {
  validateThu(req.body);
  const result = await service.create({ MaPhieuDK: req.body.MaPhieuDK, SoTienThu: req.body.SoTienThu });
  return created(res, result);
});

exports.list = catchAsync(async (req, res) => ok(res, await service.list(req.query, req.user)));
exports.getOne = catchAsync(async (req, res) => ok(res, await service.getOne(req.params.maPhieuThu, req.user)));
exports.remove = catchAsync(async (req, res) => ok(res, await service.remove(req.params.maPhieuThu)));
