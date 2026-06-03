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