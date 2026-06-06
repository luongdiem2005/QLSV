// Lớp lỗi nghiệp vụ chuẩn hóa: có statusCode HTTP + mã lỗi nội bộ.
// Service ném (throw) lỗi này, middleware xử lý lỗi sẽ format trả về client.
class ApiError extends Error {
    constructor(statusCode, message, code = undefined) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.isApiError = true;
    }
  }
  
  module.exports = ApiError;
  