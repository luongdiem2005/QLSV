const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const protect = require('../middlewares/authMiddleware');

// Hóa đơn học phí chi tiết
// GET /api/finance/invoice/:student_id?semester_id=2026-2027_HK1
router.get('/invoice/:student_id',  protect, financeController.getTuitionInvoice);

// Lập phiếu thu học phí
// POST /api/finance/payment
router.post('/payment',             protect, financeController.processPayment);

// Báo cáo sinh viên chưa hoàn thành học phí
// GET /api/finance/debt-report?semester_id=2026-2027_HK1
router.get('/debt-report',          protect, financeController.getDebtReport);

// Lịch sử phiếu thu của sinh viên
// GET /api/finance/payment-history/:student_id
router.get('/payment-history/:student_id', protect, financeController.getPaymentHistory);

module.exports = router;