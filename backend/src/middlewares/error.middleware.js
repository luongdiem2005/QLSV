// ============================================================================
//  Middleware xử lý lỗi tập trung. Đặt CUỐI CÙNG trong app.js.
//  Chuyển mọi lỗi (ApiError, lỗi Prisma, lỗi không lường trước) thành
//  response JSON theo định dạng thống nhất.
// ============================================================================
const ApiError = require('../utils/ApiError');

// Ánh xạ mã lỗi của Prisma sang HTTP status + thông báo thân thiện
function mapPrismaError(err) {
  switch (err.code) {
    case 'P2002': // vi phạm ràng buộc unique
      return new ApiError(409, 'Dữ liệu đã tồn tại (trùng khóa duy nhất).', 'DUPLICATE');
    case 'P2003': // vi phạm khóa ngoại
      return new ApiError(409, 'Dữ liệu đang được tham chiếu hoặc khóa ngoại không hợp lệ.', 'FK_CONSTRAINT');
    case 'P2025': // bản ghi không tồn tại
      return new ApiError(404, 'Không tìm thấy dữ liệu.', 'NOT_FOUND');
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 1. Lỗi nghiệp vụ chủ động ném ra
  if (err.isApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // 2. Lỗi từ Prisma (mã bắt đầu bằng P)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      return res.status(mapped.statusCode).json({
        success: false,
        message: mapped.message,
        code: mapped.code,
      });
    }
  }

  // 3. Lỗi không lường trước -> 500, log ra console để debug
  console.error('[UNEXPECTED ERROR]', err);
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ.',
    code: 'INTERNAL_ERROR',
  });
}

module.exports = errorHandler;
