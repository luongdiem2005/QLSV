const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./payment.controller');

const router = express.Router();
router.use(authenticate);

// Thu tiền: Phòng Tài chính và Phòng Đào tạo (theo bảng phân quyền đề tài)
router.post('/', authorize('PTC', 'PDT'), ctrl.create);

// Xem: PTC/PDT tất cả, SV chỉ của mình
router.get('/', authorize('PTC', 'PDT', 'SV'), ctrl.list);
router.get('/:maPhieuThu', authorize('PTC', 'PDT', 'SV'), ctrl.getOne);

// Hủy/hoàn một lần thu: chỉ Phòng Tài chính
router.delete('/:maPhieuThu', authorize('PTC'), ctrl.remove);

module.exports = router;
