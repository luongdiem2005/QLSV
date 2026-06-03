const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            // Tách lấy token từ chuỗi "Bearer <token>"
            token = token.split(' ')[1];
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Gán thông tin user vào request
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
        }
    } else {
        return res.status(401).json({ message: "Không tìm thấy quyền truy cập (No Token)!" });
    }
};

module.exports = protect;