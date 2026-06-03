const errorHandler = (err, req, res, next) => {
    // Ghi log lỗi ra console để Developer biết chuyện gì đang xảy ra
    console.error(`[Error Log]: ${err.message}`);

    // Thiết lập mã lỗi (mặc định 500 - Lỗi Server)
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || "Lỗi hệ thống nội bộ",
        // Chỉ hiện chi tiết stack trace nếu đang ở môi trường dev
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorHandler;