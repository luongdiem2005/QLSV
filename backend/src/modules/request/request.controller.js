const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const service = require('./request.service');

exports.create = catchAsync(async (req, res) => created(res, await service.create(req.user.MaSoSinhVien, req.body)));
exports.list = catchAsync(async (req, res) => ok(res, await service.list(req.user)));
exports.duyet = catchAsync(async (req, res) => ok(res, await service.duyet(req.params.maDon, req.body)));
