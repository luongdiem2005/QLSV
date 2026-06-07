# EduFee - Hệ Thống Quản Lý Đăng Ký Môn Học Và Thu Học Phí

## Giới thiệu

Hệ thống hỗ trợ quản lý quá trình đăng ký môn học và thu học phí trong trường đại học.

Các chức năng chính:

- Quản lý sinh viên
- Quản lý chương trình học (Khoa, Ngành học, Môn học) 
- Quản lý việc đăng ký học phần
- Theo dõi trạng thái thanh toán học phí
- Thống kê và báo cáo

---
## Thành viên nhóm

| MSSV | Họ và tên | 
|--------|------------|
| 23520079 | Trần Thị Kim Anh | 
| 23520285 | Lương Kiều Diễm | 
| 23520430 | Lê Thị Ngọc Hân | 
| 23520415 | Trần Thanh Hà |
| 23520585 | Lại Thị Thu Hương |
---

## Công nghệ sử dụng

### Frontend

- HTML
- CSS
- JavaScript 

### Backend

- Node.js
- Express.js

### Database

- MySQL
- Prisma ORM 5.22.0

### Công cụ phát triển

- Visual Studio Code
- Git
- GitHub

---

## Kiến trúc hệ thống

```
Frontend
    │
    ▼
Express API Server
    │
    ▼
Prisma ORM
    │
    ▼
MySQL Database
```
## Cấu trúc thư mục dự án
```text
QLSV/
├── backend/
│   ├── node_modules/          # Thư viện Node.js
│   ├── prisma/                # Schema và migration Prisma
│   ├── src/                   # Source code Backend
│   ├── .env                   # Biến môi trường
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   └── prisma.config.ts
│
└── frontend/
    ├── assets/                
    ├── components/            
    ├── js/                    
    ├── pages/
    │   ├── academic/          # Trang đào tạo
    │   ├── admin/             # Trang quản trị
    │   ├── finance/           # Trang tài chính
    │   └── student/           # Trang sinh viên
    ├── forgot-password.html   
    └── index.html             # Trang đăng nhập
```
---

## Chức năng theo vai trò

### Sinh viên

- Xem danh sách môn học
- Đăng ký môn học
- Hủy đăng ký môn học
- Xem học phí
- Theo dõi trạng thái thanh toán 

### Phòng đào tạo

- Quản lý sinh viên
- Quản lý khoa
- Quản lý môn học
- Mở lớp học phần
- Xem báo cáo thống kê tổng quan

### Phòng tài chính

- Quản lý học phí
- Xác nhận thanh toán
- Theo dõi công nợ
- Xuất báo cáo học phí

---


## Cài đặt dự án

### 1. Clone project

```bash
git clone https://github.com/luongdiem2005/QLSV.git
cd QLSV
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env`

```env
DATABASE_URL="mysql://root:password@localhost:3306/qlsv"
PORT=3000
JWT_SECRET=nhapmoncongnghephanmem
```

### 4. Khởi tạo Prisma

```bash
npx prisma generate
```

```bash
npx prisma migrate dev
```

### 5. Chạy server

```bash
npm run dev
```

---
## Bảng tài khoản người dùng
Mật khẩu chung cho các tài khoản: 123456
| Tên truy cập | Vai trò |
|--------|------------|
| 23520001 | Sinh viên | 
| pdt | Phòng đào tạo | 
| ptc | Phòng tài chính | 
| admin | Quản trị viên |
---

## Kết quả đạt được

- Xây dựng hệ thống quản lý đăng ký môn học.
- Tự động tính học phí dựa trên số tín chỉ.
- Quản lý thanh toán học phí.
- Quản lý dữ liệu bằng Prisma và MySQL.

---

## Giấy phép

Dự án được phát triển phục vụ mục đích học tập và nghiên cứu.
