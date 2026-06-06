const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./enrollment.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('PDT', 'PTC', 'SV'), ctrl.list);
router.get('/:maPhieu', authorize('PDT', 'PTC', 'SV'), ctrl.getOne);

// Đăng ký / hủy môn: SV (cho chính mình) hoặc PDT (đăng ký hộ)
router.post('/courses', authorize('PDT', 'SV'), ctrl.dangKyMon);
router.delete('/:maPhieu/courses/:maMonHoc', authorize('PDT', 'SV'), ctrl.huyMon);

// Hủy toàn bộ phiếu: chỉ PDT
router.delete('/:maPhieu', authorize('PDT'), ctrl.huyPhieu);

module.exports = router;
