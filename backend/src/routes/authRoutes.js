const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hash được tính sẵn 1 lần khi khởi động server (mô phỏng dữ liệu đã lưu trong DB)
// Trong thực tế, hash này được lấy từ query: SELECT password_hash FROM users WHERE username = ?
const MOCK_USER_STORE = {
    'pdt':     { passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'PDT', name: 'Trần Giáo Vụ' },
    'ptc':     { passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'PTC', name: 'Trần Thị Thu Kế' },
    'sv':      { passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'SV',  name: 'Nguyễn Văn An' },
    'admin':   { passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'ADMIN', name: 'Quản Trị Viên' }
};
// Ghi chú: hash trên tương ứng với password 'password' (bcrypt cost 10)
// Khi kết nối DB thật, thay MOCK_USER_STORE bằng query: SELECT * FROM users WHERE username = ?

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu." });
    }

    // 2. Tìm user trong store (sau này thay bằng DB query)
    const user = MOCK_USER_STORE[username.toLowerCase()];
    if (!user) {
        return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu!" });
    }

    // 3. So khớp password với hash đã lưu sẵn (đúng cách dùng bcrypt)
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu!" });
    }

    // 4. Tạo JWT Token
    const token = jwt.sign(
        { username: username.toLowerCase(), role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
        success: true,
        token: token,
        role: user.role,
        name: user.name
    });
});

module.exports = router;