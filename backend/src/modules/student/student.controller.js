const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const { validateSinhVien } = require('./student.validation');
const studentService = require('./student.service');

exports.list = catchAsync(async (req, res) => {
  const result = await studentService.list(req.query);
  return ok(res, result);
});

exports.getOne = catchAsync(async (req, res) => {
  const sv = await studentService.getOne(req.params.mssv);
  return ok(res, sv);
});

exports.create = catchAsync(async (req, res) => {
  validateSinhVien(req.body, true);
  const sv = await studentService.create(req.body);
  return created(res, sv);
});

exports.update = catchAsync(async (req, res) => {
  validateSinhVien(req.body, false);
  const sv = await studentService.update(req.params.mssv, req.body);
  return ok(res, sv);
});

exports.remove = catchAsync(async (req, res) => {
  const result = await studentService.remove(req.params.mssv);
  return ok(res, result);
});
