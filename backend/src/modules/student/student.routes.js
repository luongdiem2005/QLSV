// Route module Student. Tất cả đều yêu cầu đăng nhập + vai trò PDT.
const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./student.controller');

const router = express.Router();

router.use(authenticate, authorize('PDT')); // áp cho mọi route bên dưới

router.get('/', ctrl.list);
router.get('/:mssv', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:mssv', ctrl.update);
router.delete('/:mssv', ctrl.remove);

module.exports = router;
