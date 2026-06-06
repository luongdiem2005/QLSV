-- CreateTable
CREATE TABLE `TINH` (
    `MaTinh` VARCHAR(10) NOT NULL,
    `TenTinh` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `TINH_TenTinh_key`(`TenTinh`),
    PRIMARY KEY (`MaTinh`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `XA` (
    `MaXa` VARCHAR(10) NOT NULL,
    `MaTinh` VARCHAR(10) NOT NULL,
    `TenXa` VARCHAR(100) NOT NULL,
    `VungSauVungXa` BOOLEAN NOT NULL DEFAULT false,
    `GhiChu` VARCHAR(255) NULL,

    UNIQUE INDEX `XA_MaTinh_TenXa_key`(`MaTinh`, `TenXa`),
    PRIMARY KEY (`MaXa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DOITUONGUUTIEN` (
    `MaDoiTuong` VARCHAR(10) NOT NULL,
    `TenDoiTuong` VARCHAR(100) NOT NULL,
    `TyLeMienGiam` DECIMAL(5, 2) NOT NULL,
    `GhiChu` VARCHAR(255) NULL,

    UNIQUE INDEX `DOITUONGUUTIEN_TenDoiTuong_key`(`TenDoiTuong`),
    PRIMARY KEY (`MaDoiTuong`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KHOA` (
    `MaKhoa` VARCHAR(10) NOT NULL,
    `TenKhoa` VARCHAR(150) NOT NULL,
    `VanPhongKhoa` VARCHAR(150) NULL,
    `GhiChu` VARCHAR(255) NULL,

    UNIQUE INDEX `KHOA_TenKhoa_key`(`TenKhoa`),
    PRIMARY KEY (`MaKhoa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NGANH` (
    `MaNganh` VARCHAR(10) NOT NULL,
    `TenNganh` VARCHAR(150) NOT NULL,
    `MaKhoa` VARCHAR(10) NOT NULL,
    `GhiChu` VARCHAR(255) NULL,

    UNIQUE INDEX `NGANH_TenNganh_key`(`TenNganh`),
    PRIMARY KEY (`MaNganh`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `XA` ADD CONSTRAINT `XA_MaTinh_fkey` FOREIGN KEY (`MaTinh`) REFERENCES `TINH`(`MaTinh`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NGANH` ADD CONSTRAINT `NGANH_MaKhoa_fkey` FOREIGN KEY (`MaKhoa`) REFERENCES `KHOA`(`MaKhoa`) ON DELETE RESTRICT ON UPDATE CASCADE;
