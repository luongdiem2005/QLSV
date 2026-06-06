// Điểm khởi chạy: nạp biến môi trường rồi mở cổng lắng nghe.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ EduFee backend đang chạy tại http://localhost:${PORT}`);
});
