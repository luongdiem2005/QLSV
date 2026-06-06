// Route module Course. CRUD chỉ dành cho PDT; GET có thể mở rộng sau nếu cần.
const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./course.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('PDT', 'PTC', 'SV'), ctrl.list);     // nhiều vai trò xem được
router.get('/:maMon', authorize('PDT', 'PTC', 'SV'), ctrl.getOne);
router.post('/', authorize('PDT'), ctrl.create);
router.put('/:maMon', authorize('PDT'), ctrl.update);
router.delete('/:maMon', authorize('PDT'), ctrl.remove);

module.exports = router;
