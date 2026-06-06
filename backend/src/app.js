// Khởi tạo Express app: middleware chung + đăng ký router + xử lý lỗi.
const express = require('express');
const cors = require('cors');

const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const studentRoutes = require('./modules/student/student.routes');
const courseRoutes = require('./modules/course/course.routes');
const semesterRoutes = require('./modules/semester/semester.routes');
const offeringRoutes = require('./modules/offering/offering.routes');
const enrollmentRoutes = require('./modules/enrollment/enrollment.routes');
const catalogRoutes = require('./modules/catalog/catalog.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const reportRoutes = require('./modules/report/report.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

app.use(cors());            // cho phép frontend gọi từ origin khác
app.use(express.json());    // đọc body JSON

// Endpoint kiểm tra server sống
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

// Đăng ký các module
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/offerings', offeringRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
// Catalog mount tại /api -> tạo /api/khoa, /api/nganh, /api/loai-mon-hoc, /api/tinh, /api/xa, /api/doi-tuong-uu-tien
app.use('/api', catalogRoutes);

// Route không tồn tại -> 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Không tìm thấy endpoint.', code: 'NOT_FOUND' });
});

// Middleware xử lý lỗi (đặt CUỐI CÙNG)
app.use(errorHandler);

module.exports = app;
