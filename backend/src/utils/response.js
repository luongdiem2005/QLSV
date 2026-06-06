// Hai helper trả response theo định dạng thống nhất toàn API.
exports.ok = (res, data, statusCode = 200) =>
    res.status(statusCode).json({ success: true, data });
  
  exports.created = (res, data) =>
    res.status(201).json({ success: true, data });
  