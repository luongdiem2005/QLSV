const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const { validateMonHoc } = require('./course.validation');
const courseService = require('./course.service');

exports.list = catchAsync(async (req, res) => {
  const result = await courseService.list(req.query);
  return ok(res, result);
});

exports.getOne = catchAsync(async (req, res) => {
  const mon = await courseService.getOne(req.params.maMon);
  return ok(res, mon);
});

exports.create = catchAsync(async (req, res) => {
  validateMonHoc(req.body, true);
  const mon = await courseService.create(req.body);
  return created(res, mon);
});

exports.update = catchAsync(async (req, res) => {
  validateMonHoc(req.body, false);
  const mon = await courseService.update(req.params.maMon, req.body);
  return ok(res, mon);
});

exports.remove = catchAsync(async (req, res) => {
  const result = await courseService.remove(req.params.maMon);
  return ok(res, result);
});
