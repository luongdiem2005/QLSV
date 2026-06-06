const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./admin.controller');

const router = express.Router();
router.use(authenticate, authorize('ADMIN')); // toàn bộ module chỉ ADMIN

// Tài khoản
router.get('/accounts', ctrl.listAccounts);
router.get('/accounts/:ten', ctrl.getAccount);
router.post('/accounts', ctrl.createAccount);
router.put('/accounts/:ten', ctrl.updateAccount);
router.delete('/accounts/:ten', ctrl.removeAccount);

// Tham số hệ thống (QĐ13)
router.get('/params', ctrl.listParams);
router.put('/params/:ten', ctrl.setParam);
router.delete('/params/:ten', ctrl.removeParam);

module.exports = router;
