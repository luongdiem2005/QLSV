const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // GIẢ LẬP: Dữ liệu thực tế sau này sẽ query từ Database
    // Ở đây ta giả lập một user đã lưu trong DB với mật khẩu đã băm
    const mockUser = {
        username: 'pdt',
        passwordHash: await bcrypt.hash('123', 10), // Mật khẩu 123 đã được băm
        role: 'PDT'
    };

    // 1. Kiểm tra username
    if (username !== mockUser.username) return res.status(401).json({ message: "Sai tài khoản!" });

    // 2. So khớp mật khẩu đã băm
    const isMatch = await bcrypt.compare(password, mockUser.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu!" });

    // 3. Tạo JWT Token
    const token = jwt.sign(
        { username: mockUser.username, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
        success: true,
        token: token,
        role: mockUser.role
    });
});

module.exports = router;