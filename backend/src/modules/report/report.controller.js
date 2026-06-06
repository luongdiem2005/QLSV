const catchAsync = require('../../utils/catchAsync');
const { ok } = require('../../utils/response');
const service = require('./report.service');

exports.traCuuSinhVien = catchAsync(async (req, res) =>
  ok(res, await service.traCuuSinhVien(req.params.mssv, req.user)));

exports.svChuaHoanThanhHP = catchAsync(async (req, res) =>
  ok(res, await service.svChuaHoanThanhHP(req.query.maHKNH)));
