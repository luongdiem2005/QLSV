const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./report.controller');

const router = express.Router();
router.use(authenticate);

// BM11: tra cứu SV (SV xem được của mình)
router.get('/student/:mssv', authorize('PDT', 'PTC', 'SV'), ctrl.traCuuSinhVien);
// BM12: báo cáo nợ học phí (chỉ cán bộ)
router.get('/unpaid', authorize('PDT', 'PTC'), ctrl.svChuaHoanThanhHP);

module.exports = router;
