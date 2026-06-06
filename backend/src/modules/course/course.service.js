// Service module Course: CRUD môn học, tín chỉ suy diễn, môn tiên quyết.
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

// Tính số tín chỉ = SoTiet / SoTietMotTinChi (làm tròn xuống theo quy ước)
function tinhTinChi(soTiet, soTietMotTinChi) {
  if (!soTietMotTinChi) return 0;
  return Math.floor(soTiet / soTietMotTinChi);
}

// Đính thêm trường SoTinChi (tính được) vào object môn học
function ganTinChi(mon) {
  return { ...mon, SoTinChi: tinhTinChi(mon.SoTiet, mon.loaiMonHoc?.SoTietMotTinChi) };
}

const includeQuanHe = {
  khoa: { select: { MaKhoa: true, TenKhoa: true } },
  loaiMonHoc: true,
};

// Kiểm tra khoa & loại môn tồn tại
async function kiemTraKhoaNgoai({ MaKhoa, MaLoaiMonHoc }) {
  const khoa = await prisma.kHOA.findUnique({ where: { MaKhoa } });
  if (!khoa) throw new ApiError(404, `Khoa "${MaKhoa}" không tồn tại.`, 'KHOA_NOT_FOUND');
  const loai = await prisma.lOAIMONHOC.findUnique({ where: { MaLoaiMonHoc } });
  if (!loai) throw new ApiError(404, `Loại môn "${MaLoaiMonHoc}" không tồn tại.`, 'LOAI_NOT_FOUND');
}

// Kiểm tra danh sách môn tiên quyết: tồn tại + khác chính nó
async function kiemTraMonTruoc(maMonHoc, danhSachTruoc) {
  for (const maTruoc of danhSachTruoc) {
    if (maTruoc === maMonHoc) {
      throw new ApiError(400, 'Một môn không thể là môn tiên quyết của chính nó.', 'SELF_PREREQ');
    }
    const ton = await prisma.mONHOC.findUnique({ where: { MaMonHoc: maTruoc } });
    if (!ton) throw new ApiError(404, `Môn tiên quyết "${maTruoc}" không tồn tại.`, 'PREREQ_NOT_FOUND');
  }
}

// Chống tạo VÒNG tiên quyết: nếu maTruoc (hoặc chuỗi tiên quyết của nó)
// lại cần maMonHoc làm tiên quyết -> sẽ thành vòng -> chặn.
async function kiemTraVongTienQuyet(maMonHoc, danhSachTruoc) {
  // DFS đi ngược theo các môn tiên quyết, xem có quay về maMonHoc không
  for (const batDau of danhSachTruoc) {
    const daTham = new Set();
    const stack = [batDau];
    while (stack.length) {
      const hienTai = stack.pop();
      if (hienTai === maMonHoc) {
        throw new ApiError(400, 'Khai báo này tạo ra vòng tiên quyết (A cần B, B cần A).', 'PREREQ_CYCLE');
      }
      if (daTham.has(hienTai)) continue;
      daTham.add(hienTai);
      const cha = await prisma.cT_MONHOCTRUOC.findMany({
        where: { MaMonHoc: hienTai },
        select: { MaMonHocTruoc: true },
      });
      cha.forEach((c) => stack.push(c.MaMonHocTruoc));
    }
  }
}

exports.list = async ({ search, maKhoa, maLoai, page = 1, limit = 20 }) => {
  const where = {};
  if (maKhoa) where.MaKhoa = maKhoa;
  if (maLoai) where.MaLoaiMonHoc = maLoai;
  if (search) {
    where.OR = [
      { MaMonHoc: { contains: search } },
      { TenMonHoc: { contains: search } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    prisma.mONHOC.findMany({
      where, include: includeQuanHe, skip, take: Number(limit), orderBy: { MaMonHoc: 'asc' },
    }),
    prisma.mONHOC.count({ where }),
  ]);

  return { items: rows.map(ganTinChi), total, page: Number(page), limit: Number(limit) };
};

exports.getOne = async (maMon) => {
  const mon = await prisma.mONHOC.findUnique({
    where: { MaMonHoc: maMon },
    include: {
      ...includeQuanHe,
      monHocTruocList: { select: { MaMonHocTruoc: true } },
    },
  });
  if (!mon) throw new ApiError(404, 'Không tìm thấy môn học.', 'NOT_FOUND');
  return ganTinChi(mon);
};

exports.create = async (data) => {
  const daCo = await prisma.mONHOC.findUnique({ where: { MaMonHoc: data.MaMonHoc } });
  if (daCo) throw new ApiError(409, `Mã môn "${data.MaMonHoc}" đã tồn tại.`, 'DUPLICATE_MA');

  await kiemTraKhoaNgoai(data);
  const danhSachTruoc = data.monHocTruoc || [];
  await kiemTraMonTruoc(data.MaMonHoc, danhSachTruoc);

  // Tạo môn + chèn các bản ghi môn tiên quyết trong CÙNG transaction
  const mon = await prisma.$transaction(async (tx) => {
    await tx.mONHOC.create({
      data: {
        MaMonHoc: data.MaMonHoc,
        TenMonHoc: data.TenMonHoc,
        MaKhoa: data.MaKhoa,
        MaLoaiMonHoc: data.MaLoaiMonHoc,
        SoTiet: Number(data.SoTiet),
      },
    });
    if (danhSachTruoc.length) {
      await tx.cT_MONHOCTRUOC.createMany({
        data: danhSachTruoc.map((maTruoc) => ({ MaMonHoc: data.MaMonHoc, MaMonHocTruoc: maTruoc })),
      });
    }
    return tx.mONHOC.findUnique({ where: { MaMonHoc: data.MaMonHoc }, include: includeQuanHe });
  });

  return ganTinChi(mon);
};

exports.update = async (maMon, data) => {
  const mon = await prisma.mONHOC.findUnique({ where: { MaMonHoc: maMon } });
  if (!mon) throw new ApiError(404, 'Không tìm thấy môn học.', 'NOT_FOUND');

  await kiemTraKhoaNgoai(data);
  const danhSachTruoc = data.monHocTruoc || [];
  await kiemTraMonTruoc(maMon, danhSachTruoc);
  await kiemTraVongTienQuyet(maMon, danhSachTruoc);

  // Cập nhật thông tin + thay TOÀN BỘ danh sách môn tiên quyết (xóa cũ, chèn mới)
  const ketQua = await prisma.$transaction(async (tx) => {
    await tx.mONHOC.update({
      where: { MaMonHoc: maMon },
      data: {
        TenMonHoc: data.TenMonHoc,
        MaKhoa: data.MaKhoa,
        MaLoaiMonHoc: data.MaLoaiMonHoc,
        SoTiet: Number(data.SoTiet),
      },
    });
    await tx.cT_MONHOCTRUOC.deleteMany({ where: { MaMonHoc: maMon } });
    if (danhSachTruoc.length) {
      await tx.cT_MONHOCTRUOC.createMany({
        data: danhSachTruoc.map((maTruoc) => ({ MaMonHoc: maMon, MaMonHocTruoc: maTruoc })),
      });
    }
    return tx.mONHOC.findUnique({ where: { MaMonHoc: maMon }, include: includeQuanHe });
  });

  return ganTinChi(ketQua);
};

exports.remove = async (maMon) => {
  const mon = await prisma.mONHOC.findUnique({
    where: { MaMonHoc: maMon },
    include: {
      monHocMoList: { select: { MaMonHocMo: true } },
      ctPhieuDKList: { select: { MaPhieuDK: true } },
      laMonTruocCuaList: { select: { MaMonHoc: true } },
      chuongTrinhList: { select: { MaNganh: true } },
    },
  });
  if (!mon) throw new ApiError(404, 'Không tìm thấy môn học.', 'NOT_FOUND');

  if (mon.monHocMoList.length) throw new ApiError(409, 'Không thể xóa: môn đã được mở trong học kỳ.', 'IN_USE');
  if (mon.ctPhieuDKList.length) throw new ApiError(409, 'Không thể xóa: môn đã có trong phiếu đăng ký.', 'IN_USE');
  if (mon.laMonTruocCuaList.length) throw new ApiError(409, 'Không thể xóa: môn đang là tiên quyết của môn khác.', 'IN_USE');
  if (mon.chuongTrinhList.length) throw new ApiError(409, 'Không thể xóa: môn thuộc chương trình học của ngành.', 'IN_USE');

  // Xóa các bản ghi tiên quyết của chính môn này rồi xóa môn (transaction)
  await prisma.$transaction(async (tx) => {
    await tx.cT_MONHOCTRUOC.deleteMany({ where: { MaMonHoc: maMon } });
    await tx.mONHOC.delete({ where: { MaMonHoc: maMon } });
  });

  return { message: 'Đã xóa môn học.' };
};
