// Route Catalog: đăng ký 5 route CRUD chuẩn cho từng danh mục.
const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./catalog.controller');

const router = express.Router();

const READ = ['ADMIN', 'PDT', 'PTC', 'SV']; // ai cũng đọc được (đổ dropdown)
const WRITE = ['ADMIN', 'PDT'];             // chỉ admin & phòng đào tạo sửa

// Gắn authenticate vào TỪNG route (không dùng router.use) để các path /api/* lạ
// còn rơi xuống được middleware 404, thay vì bị chặn 401 tại đây.
function dangKy(path, c) {
  router.get(`/${path}`, authenticate, authorize(...READ), c.list);
  router.get(`/${path}/:id`, authenticate, authorize(...READ), c.getOne);
  router.post(`/${path}`, authenticate, authorize(...WRITE), c.create);
  router.put(`/${path}/:id`, authenticate, authorize(...WRITE), c.update);
  router.delete(`/${path}/:id`, authenticate, authorize(...WRITE), c.remove);
}

dangKy('khoa', ctrl.khoa);
dangKy('nganh', ctrl.nganh);
dangKy('loai-mon-hoc', ctrl.loaiMonHoc);
dangKy('tinh', ctrl.tinh);
dangKy('xa', ctrl.xa);
dangKy('doi-tuong-uu-tien', ctrl.doiTuong);

module.exports = router;
