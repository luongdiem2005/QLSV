-- 1. Bảng Môn học (Courses)
CREATE TABLE courses (
    course_id VARCHAR(10) PRIMARY KEY, -- Ví dụ: INT101
    name VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    type ENUM('Lý thuyết', 'Thực hành', 'Đồ án') DEFAULT 'Lý thuyết',
    prerequisite_id VARCHAR(10),
    FOREIGN KEY (prerequisite_id) REFERENCES courses(course_id)
);

-- 2. Bảng Sinh viên (Students)
CREATE TABLE students (
    student_id VARCHAR(15) PRIMARY KEY, -- MSSV
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    class_group VARCHAR(20), -- Lớp sinh hoạt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Lớp học phần (Classes)
CREATE TABLE classes (
    class_id VARCHAR(10) PRIMARY KEY, -- Mã lớp học phần
    course_id VARCHAR(10),
    room VARCHAR(20),
    schedule VARCHAR(50),
    max_slots INT DEFAULT 50,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- 4. Bảng Đăng ký (Registrations) - Bảng trung gian
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(15),
    class_id VARCHAR(10),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- ============================================================
-- BỔ SUNG: Các bảng còn thiếu theo yêu cầu đề tài
-- ============================================================

-- 5. Bảng Khoa (Departments)
CREATE TABLE departments (
    dept_id     VARCHAR(10)  PRIMARY KEY,         -- Mã khoa, ví dụ: CNTT
    dept_name   VARCHAR(100) NOT NULL,             -- Tên khoa
    office      VARCHAR(100),                      -- Văn phòng khoa
    note        TEXT                               -- Ghi chú
);

-- 6. Bảng Ngành học (Majors)
CREATE TABLE majors (
    major_id    VARCHAR(10)  PRIMARY KEY,          -- Mã ngành, ví dụ: KTPM
    major_name  VARCHAR(100) NOT NULL,             -- Tên ngành
    dept_id     VARCHAR(10)  NOT NULL,             -- Khoa quản lý
    note        TEXT,                              -- Ghi chú
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- 7. Bảng Tỉnh/Thành (Provinces)
CREATE TABLE provinces (
    province_id   VARCHAR(10)  PRIMARY KEY,        -- Mã tỉnh
    province_name VARCHAR(100) NOT NULL,           -- Tên tỉnh
    note          TEXT                             -- Ghi chú
);

-- 8. Bảng Xã/Phường (Districts)
CREATE TABLE districts (
    district_id   VARCHAR(10)  PRIMARY KEY,        -- Mã xã/phường
    district_name VARCHAR(100) NOT NULL,           -- Tên xã/phường
    province_id   VARCHAR(10)  NOT NULL,           -- Thuộc tỉnh nào
    is_remote     TINYINT(1)   DEFAULT 0,          -- Có thuộc vùng sâu/xa không (0: Không, 1: Có)
    note          TEXT,
    FOREIGN KEY (province_id) REFERENCES provinces(province_id)
);

-- 9. Bảng Đối tượng ưu tiên (Priority Groups)
CREATE TABLE priority_groups (
    priority_id    VARCHAR(10)   PRIMARY KEY,      -- Mã đối tượng
    priority_name  VARCHAR(100)  NOT NULL,         -- Tên đối tượng, ví dụ: Con liệt sĩ
    discount_rate  DECIMAL(5,2)  NOT NULL          -- Tỷ lệ miễn giảm (0.00 - 100.00%)
        CHECK (discount_rate >= 0 AND discount_rate <= 100),
    note           TEXT                            -- Ghi chú
);

-- 10. Bảng Sinh viên (Students) - Thay thế bảng cũ với đầy đủ cột
-- Xóa bảng cũ trước khi tạo lại (chú ý thứ tự do FK)
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    student_id    VARCHAR(15)  PRIMARY KEY,        -- MSSV
    full_name     VARCHAR(100) NOT NULL,           -- Họ và tên
    dob           DATE         NOT NULL,           -- Ngày sinh
    gender        ENUM('Nam','Nữ') NOT NULL,       -- Giới tính
    phone         VARCHAR(15),                     -- Số điện thoại
    email         VARCHAR(100) UNIQUE,             -- Email
    class_group   VARCHAR(20),                     -- Lớp sinh hoạt
    province_id   VARCHAR(10),                     -- Quê quán - tỉnh
    district_id   VARCHAR(10),                     -- Quê quán - xã
    priority_id   VARCHAR(10),                     -- Đối tượng ưu tiên
    major_id      VARCHAR(10),                     -- Ngành học
    status        ENUM('Đang học','Bảo lưu','Thôi học') DEFAULT 'Đang học',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id)  REFERENCES provinces(province_id),
    FOREIGN KEY (district_id)  REFERENCES districts(district_id),
    FOREIGN KEY (priority_id)  REFERENCES priority_groups(priority_id),
    FOREIGN KEY (major_id)     REFERENCES majors(major_id)
);

-- 11. Bảng Đăng ký (Registrations) - Tạo lại sau khi students được tạo lại
CREATE TABLE registrations (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    student_id    VARCHAR(15)  NOT NULL,
    class_id      VARCHAR(10)  NOT NULL,
    registered_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id)   REFERENCES classes(class_id),
    UNIQUE KEY uq_student_class (student_id, class_id)  -- Không cho đăng ký trùng
);

-- 12. Bảng Học kỳ - Năm học (Semesters)
CREATE TABLE semesters (
    semester_id   VARCHAR(20)  PRIMARY KEY,        -- Ví dụ: 2026-2027_HK1
    academic_year VARCHAR(10)  NOT NULL,           -- Năm học: 2026-2027
    semester_name VARCHAR(10)  NOT NULL,           -- HK1, HK2, HKHe
    is_summer     TINYINT(1)   DEFAULT 0,          -- Học kỳ hè không
    deadline      DATE,                            -- Hạn đóng học phí
    note          TEXT
);

-- 13. Bảng Môn học mở trong học kỳ (Open Classes - cập nhật bảng classes)
ALTER TABLE classes
    ADD COLUMN semester_id VARCHAR(20) AFTER course_id,
    ADD COLUMN status ENUM('Đang mở','Đã đóng') DEFAULT 'Đang mở' AFTER max_slots,
    ADD FOREIGN KEY (semester_id) REFERENCES semesters(semester_id);

-- 14. Bảng Chương trình đào tạo (Curriculum)
CREATE TABLE curriculum (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    major_id      VARCHAR(10)  NOT NULL,           -- Ngành học
    cohort        VARCHAR(10)  NOT NULL,           -- Khóa áp dụng, ví dụ: 2023
    semester_no   INT          NOT NULL,           -- Học kỳ thứ mấy trong chương trình
    course_id     VARCHAR(10)  NOT NULL,           -- Môn học
    note          TEXT,
    FOREIGN KEY (major_id)  REFERENCES majors(major_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- 15. Bảng Đơn giá học phí (Tuition Rates)
CREATE TABLE tuition_rates (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    class_type    VARCHAR(30)  NOT NULL UNIQUE,    -- Lý thuyết / Thực hành / Đồ án
    unit_price    INT          NOT NULL,           -- Đơn giá VNĐ / 1 tín chỉ
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dữ liệu mặc định đơn giá theo đặc tả đề tài
INSERT INTO tuition_rates (class_type, unit_price) VALUES
    ('Lý thuyết', 27000),
    ('Thực hành', 37000),
    ('Đồ án tốt nghiệp', 50000);

-- 16. Bảng Phiếu đăng ký học phần (Registration Invoices)
CREATE TABLE registration_invoices (
    invoice_id      VARCHAR(20)  PRIMARY KEY,      -- Mã phiếu ĐKHP
    student_id      VARCHAR(15)  NOT NULL,
    semester_id     VARCHAR(20)  NOT NULL,
    created_date    DATE         NOT NULL,
    total_gross     DECIMAL(12,0) DEFAULT 0,       -- Tổng tiền thô
    discount_amount DECIMAL(12,0) DEFAULT 0,       -- Tiền miễn giảm
    total_due       DECIMAL(12,0) DEFAULT 0,       -- Tổng tiền phải đóng
    total_paid      DECIMAL(12,0) DEFAULT 0,       -- Số tiền đã đóng
    remaining       DECIMAL(12,0) DEFAULT 0,       -- Số tiền còn lại
    FOREIGN KEY (student_id)  REFERENCES students(student_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

-- 17. Bảng Phiếu thu học phí (Payment Receipts)
CREATE TABLE payments (
    payment_id    VARCHAR(20)  PRIMARY KEY,        -- Mã phiếu thu, ví dụ: TXN1234567
    invoice_id    VARCHAR(20)  NOT NULL,           -- Thuộc phiếu ĐKHP nào
    student_id    VARCHAR(15)  NOT NULL,
    amount        DECIMAL(12,0) NOT NULL,          -- Số tiền thu lần này
    paid_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    method        VARCHAR(50)  DEFAULT 'Tiền mặt', -- Hình thức thanh toán
    status        ENUM('PAID','PENDING','FAILED') DEFAULT 'PAID',
    FOREIGN KEY (invoice_id)  REFERENCES registration_invoices(invoice_id),
    FOREIGN KEY (student_id)  REFERENCES students(student_id)
);

-- 18. Bảng Miễn giảm học phí (Exemptions)
CREATE TABLE exemptions (
    id              INT          AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(15)  NOT NULL,
    priority_id     VARCHAR(10)  NOT NULL,
    discount_rate   DECIMAL(5,2) NOT NULL,         -- Tỷ lệ miễn giảm thực tế được duyệt
    evidence_file   VARCHAR(255),                  -- Tên file minh chứng
    status          ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    reviewed_at     TIMESTAMP    NULL,
    note            TEXT,
    FOREIGN KEY (student_id)  REFERENCES students(student_id),
    FOREIGN KEY (priority_id) REFERENCES priority_groups(priority_id)
);

-- 19. Bảng Tài khoản người dùng (Users)
CREATE TABLE users (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,           -- Lưu bcrypt hash
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('PDT','PTC','SV','ADMIN') NOT NULL,
    student_id    VARCHAR(15)  NULL,               -- Liên kết với sinh viên nếu role = SV
    status        ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Thêm cột lessons vào bảng courses (bổ sung từ lỗi 6)
ALTER TABLE courses
    ADD COLUMN lessons INT NOT NULL DEFAULT 0 AFTER credits
        COMMENT 'Số tiết học. Tín chỉ = lessons/15 (LT) hoặc lessons/30 (TH)';