const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const { validateMonHocMo } = require('./offering.validation');
const service = require('./offering.service');

exports.list = catchAsync(async (req, res) => ok(res, await service.list(req.query)));
exports.getOne = catchAsync(async (req, res) => ok(res, await service.getOne(req.params.id)));

exports.create = catchAsync(async (req, res) => {
  validateMonHocMo(req.body);
  return created(res, await service.create(req.body));
});

exports.update = catchAsync(async (req, res) => ok(res, await service.update(req.params.id, req.body)));
exports.remove = catchAsync(async (req, res) => ok(res, await service.remove(req.params.id)));
