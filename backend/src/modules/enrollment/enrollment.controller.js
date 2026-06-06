const catchAsync = require('../../utils/catchAsync');
const { ok, created } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const { validateDangKy } = require('./enrollment.validation');
const service = require('./enrollment.service');

// Xác định sinh viên mục tiêu: SV thì là chính mình; PDT thì lấy từ body.
function xacDinhMSSV(req) {
  if (req.user.VaiTro === 'SV') {
    if (!req.user.MaSoSinhVien) {
      throw new ApiError(400, 'Tài khoản sinh viên chưa được gắn hồ sơ.', 'NO_PROFILE');
    }
    return req.user.MaSoSinhVien;
  }
  // PDT đăng ký hộ -> bắt buộc truyền MaSoSinhVien
  if (!req.body.MaSoSinhVien) {
    throw new ApiError(400, 'MaSoSinhVien là bắt buộc khi đăng ký hộ.', 'VALIDATION');
  }
  return req.body.MaSoSinhVien;
}

exports.list = catchAsync(async (req, res) => ok(res, await service.list(req.query, req.user)));
exports.getOne = catchAsync(async (req, res) => ok(res, await service.getOne(req.params.maPhieu, req.user)));

exports.dangKyMon = catchAsync(async (req, res) => {
  validateDangKy(req.body);
  const MaSoSinhVien = xacDinhMSSV(req);
  const result = await service.dangKyMon({
    MaSoSinhVien,
    MaHKNH: req.body.MaHKNH,
    MaMonHoc: req.body.MaMonHoc,
  });
  return created(res, result);
});

exports.huyMon = catchAsync(async (req, res) => {
  const result = await service.huyMon(
    { MaPhieu: req.params.maPhieu, MaMonHoc: req.params.maMonHoc },
    req.user
  );
  return ok(res, result);
});

exports.huyPhieu = catchAsync(async (req, res) => ok(res, await service.huyPhieu(req.params.maPhieu)));
