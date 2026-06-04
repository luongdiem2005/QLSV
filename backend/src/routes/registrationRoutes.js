const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const protect = require('../middlewares/authMiddleware');

// Route đăng ký học phần (Yêu cầu sinh viên đã đăng nhập)
router.post('/',        protect, registrationController.registerClass);
router.delete('/',      protect, registrationController.cancelRegistration);

module.exports = router;