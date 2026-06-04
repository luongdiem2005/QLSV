const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');
const studentRoutes = require('./routes/studentRoutes.js');
const registrationRoutes = require('./routes/registrationRoutes');
const financeRoutes = require('./routes/financeRoutes');
// 1. Khởi tạo thực thể Server Express
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Kích hoạt các bộ lọc trung gian hệ thống (Global Middlewares)
app.use(cors()); // Cho phép Cross-Origin Resource Sharing từ Frontend
app.use(express.json()); // Bật tính năng phân tích dữ liệu dạng JSON gửi lên trong HTTP Body

// 3. Kết nối hạ tầng Cơ sở dữ liệu
// Kiểm tra kết nối nhanh bằng cách query thử
pool.query('SELECT 1')
    .then(() => console.log('[Database] Kết nối MySQL thành công!'))
    .catch(err => console.error('[Database] Lỗi kết nối MySQL:', err));

// 4. Định tuyến các nhánh API nghiệp vụ (API Routes Binding)
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/finance',       financeRoutes);
// Kịch bản kiểm tra sức khỏe hệ thống (Health Check Endpoint)

// Khai báo Global Error Middleware sau cùng
const errorHandler = require('./middlewares/errorMiddleware');
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(200).send(`<h2 style="color: #38a169; font-family: sans-serif; text-align: center; margin-top: 50px;">EduFee Backend Server v1.0.0 đang hoạt động ổn định!</h2>`);
});

// 5. Khởi động cổng mạng lắng nghe tín hiệu (Start Server)
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[EduFee Server] Khởi chạy thành công tại cổng: ${PORT}`);
    console.log(`[Môi trường] Chế độ phát triển: ${process.env.NODE_ENV}`);
    console.log(`=======================================================`);
});
