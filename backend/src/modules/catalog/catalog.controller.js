// Controller Catalog: dùng factory "taoController" tạo 5 handler chuẩn từ 1 service.
const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const service = require('./catalog.service');

function taoController(svc) {
  return {
    list: catchAsync(async (req, res) => ok(res, await svc.list(req.query))),
    getOne: catchAsync(async (req, res) => ok(res, await svc.getOne(req.params.id))),
    create: catchAsync(async (req, res) => created(res, await svc.create(req.body))),
    update: catchAsync(async (req, res) => ok(res, await svc.update(req.params.id, req.body))),
    remove: catchAsync(async (req, res) => ok(res, await svc.remove(req.params.id))),
  };
}

module.exports = {
  khoa: taoController(service.khoa),
  nganh: taoController(service.nganh),
  loaimonhoc: taoController(service.loaimonhoc),
  tinh: taoController(service.tinh),
  xa: taoController(service.xa),
  doituonguutien: taoController(service.doituonguutien),
};
