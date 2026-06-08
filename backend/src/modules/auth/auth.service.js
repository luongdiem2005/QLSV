// Service module Auth: chứa toàn bộ logic nghiệp vụ, không biết req/res.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

// Tạo token JWT từ thông tin người dùng
function kyToken(user) {
  return jwt.sign(
    {
      TenDangNhap: user.TenDangNhap,
      VaiTro: user.VaiTro,
      MaSoSinhVien: user.MaSoSinhVien,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// Bỏ trường MatKhau trước khi trả về client
function locBoMatKhau(user) {
  const { MatKhau, ...rest } = user;
  return rest;
}

exports.login = async (TenDangNhap, MatKhau) => {
  const user = await prisma.nguoidung.findUnique({ where: { TenDangNhap } });

  // Dùng CHUNG một thông báo cho cả "không có user" lẫn "sai mật khẩu"
  // để không lộ tài khoản nào tồn tại.
  if (!user) {
    throw new ApiError(401, 'Tài khoản hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
  }

  const khop = await bcrypt.compare(MatKhau, user.MatKhau);
  if (!khop) {
    throw new ApiError(401, 'Tài khoản hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
  }

  if (!user.TrangThai) {
    throw new ApiError(403, 'Tài khoản đã bị khóa.', 'ACCOUNT_LOCKED');
  }

  return { token: kyToken(user), user: locBoMatKhau(user) };
};

exports.getMe = async (TenDangNhap) => {
  const user = await prisma.nguoidung.findUnique({ where: { TenDangNhap } });
  if (!user) {
    throw new ApiError(401, 'Tài khoản không còn tồn tại.', 'USER_NOT_FOUND');
  }
  return locBoMatKhau(user);
};

exports.changePassword = async (TenDangNhap, MatKhauCu, MatKhauMoi) => {
  const user = await prisma.nguoidung.findUnique({ where: { TenDangNhap } });
  if (!user) {
    throw new ApiError(401, 'Tài khoản không tồn tại.', 'USER_NOT_FOUND');
  }

  const khop = await bcrypt.compare(MatKhauCu, user.MatKhau);
  if (!khop) {
    throw new ApiError(401, 'Mật khẩu cũ không đúng.', 'WRONG_OLD_PASSWORD');
  }

  const hashMoi = await bcrypt.hash(MatKhauMoi, 10);
  await prisma.nguoidung.update({
    where: { TenDangNhap },
    data: { MatKhau: hashMoi },
  });

  return { message: 'Đổi mật khẩu thành công.' };
};
