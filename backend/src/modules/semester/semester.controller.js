const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const { validateHocKy } = require('./semester.validation');
const service = require('./semester.service');

exports.list = catchAsync(async (req, res) => ok(res, await service.list(req.query)));
exports.getOne = catchAsync(async (req, res) => ok(res, await service.getOne(req.params.maHKNH)));

exports.create = catchAsync(async (req, res) => {
  validateHocKy(req.body, true);
  return created(res, await service.create(req.body));
});

exports.update = catchAsync(async (req, res) => {
  validateHocKy(req.body, false);
  return ok(res, await service.update(req.params.maHKNH, req.body));
});

exports.remove = catchAsync(async (req, res) => ok(res, await service.remove(req.params.maHKNH)));
