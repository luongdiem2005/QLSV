const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./offering.controller');

const router = express.Router();
router.use(authenticate);

// SV cần xem danh sách môn mở để đăng ký -> cho cả 3 vai trò GET
router.get('/', authorize('PDT', 'PTC', 'SV'), ctrl.list);
router.get('/:id', authorize('PDT', 'PTC', 'SV'), ctrl.getOne);
router.post('/', authorize('PDT'), ctrl.create);
router.put('/:id', authorize('PDT'), ctrl.update);
router.delete('/:id', authorize('PDT'), ctrl.remove);

module.exports = router;
