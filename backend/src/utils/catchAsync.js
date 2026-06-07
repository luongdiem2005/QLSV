// Bọc controller async để mọi lỗi (kể cả Promise reject) được chuyển
// về middleware xử lý lỗi, khỏi phải viết try/catch lặp đi lặp lại.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
