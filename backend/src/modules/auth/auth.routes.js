// Định nghĩa route cho module Auth
const express = require('express');
const { authenticate } = require('../../middlewares/auth.middleware');
const ctrl = require('./auth.controller');

const router = express.Router();

router.post('/login', ctrl.login);                          // công khai
router.get('/me', authenticate, ctrl.getMe);                // cần đăng nhập
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
