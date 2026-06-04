const db  = require('../config/db');
const Joi = require('joi');

// Schema validation dùng chung cho tạo mới và cập nhật
const studentSchema = Joi.object({
    student_id:   Joi.string().alphanum().min(6).max(15).required(),
    full_name:    Joi.string().min(2).max(100).required(),
    dob:          Joi.date().iso().required(),
    gender:       Joi.string().valid('Nam', 'Nữ').required(),
    phone:        Joi.string().pattern(/^[0-9]{9,11}$/).allow('', null),
    email:        Joi.string().email({ tlds: { allow: false } }).allow('', null),
    class_group:  Joi.string().max(20).allow('', null),
    province_id:  Joi.string().max(10).allow('', null),
    district_id:  Joi.string().max(10).allow('', null),
    priority_id:  Joi.string().max(10).allow('', null),
    major_id:     Joi.string().max(10).allow('', null),
    status:       Joi.string().valid('Đang học', 'Bảo lưu', 'Thôi học').default('Đang học')
});

// ============================================================
// 1. LẤY DANH SÁCH SINH VIÊN (có tìm kiếm + lọc)
// GET /api/students?search=nguyen&major_id=CNTT&status=Đang học
// ============================================================
exports.getAllStudents = async (req, res) => {
    const { search, major_id, status } = req.query;

    try {
        let sql = `
            SELECT
                s.student_id,
                s.full_name,
                s.dob,
                s.gender,
                s.phone,
                s.email,
                s.class_group,
                s.status,
                m.major_name,
                p.province_name,
                d.district_name,
                d.is_remote,
                pg.priority_name,
                pg.discount_rate
            FROM students s
            LEFT JOIN majors          m  ON s.major_id    = m.major_id
            LEFT JOIN provinces       p  ON s.province_id = p.province_id
            LEFT JOIN districts       d  ON s.district_id = d.district_id
            LEFT JOIN priority_groups pg ON s.priority_id = pg.priority_id
            WHERE 1 = 1
        `;
        const params = [];

        // Lọc tìm kiếm theo MSSV hoặc họ tên
        if (search) {
            sql += ' AND (s.student_id LIKE ? OR s.full_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Lọc theo ngành học
        if (major_id) {
            sql += ' AND s.major_id = ?';
            params.push(major_id);
        }

        // Lọc theo tình trạng
        if (status) {
            sql += ' AND s.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY s.student_id ASC';

        const [rows] = await db.query(sql, params);
        res.json({ total: rows.length, data: rows });

    } catch (err) {
        res.status(500).json({ message: "Lỗi truy vấn danh sách sinh viên", error: err.message });
    }
};

// ============================================================
// 2. TRA CỨU SINH VIÊN ĐẦY ĐỦ (kèm lịch sử ĐKHP + thanh toán)
// GET /api/students/:student_id/profile
// ============================================================
exports.getStudentProfile = async (req, res) => {
    const { student_id } = req.params;

    try {
        // 2a. Thông tin cá nhân
        const [students] = await db.query(
            `SELECT
                s.*,
                m.major_name,
                p.province_name,
                d.district_name,
                d.is_remote,
                pg.priority_name,
                pg.discount_rate
             FROM students s
             LEFT JOIN majors          m  ON s.major_id    = m.major_id
             LEFT JOIN provinces       p  ON s.province_id = p.province_id
             LEFT JOIN districts       d  ON s.district_id = d.district_id
             LEFT JOIN priority_groups pg ON s.priority_id = pg.priority_id
             WHERE s.student_id = ?`,
            [student_id]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sinh viên." });
        }

        // 2b. Lịch sử đăng ký học phần
        const [registrationHistory] = await db.query(
            `SELECT
                sem.academic_year,
                sem.semester_name,
                cl.class_id,
                co.course_id,
                co.name        AS course_name,
                co.type        AS course_type,
                co.lessons,
                co.credits,
                r.registered_at
             FROM registrations r
             JOIN classes   cl  ON r.class_id   = cl.class_id
             JOIN courses   co  ON cl.course_id  = co.course_id
             JOIN semesters sem ON cl.semester_id = sem.semester_id
             WHERE r.student_id = ?
             ORDER BY sem.academic_year DESC, sem.semester_name ASC`,
            [student_id]
        );

        // 2c. Lịch sử thanh toán học phí
        const [paymentHistory] = await db.query(
            `SELECT
                sem.academic_year,
                sem.semester_name,
                p.payment_id,
                p.paid_at,
                ri.total_gross,
                ri.total_due,
                ri.total_paid,
                ri.remaining,
                p.amount       AS paid_this_transaction,
                p.method,
                p.status
             FROM payments p
             JOIN registration_invoices ri  ON p.invoice_id  = ri.invoice_id
             JOIN semesters             sem ON ri.semester_id = sem.semester_id
             WHERE p.student_id = ?
             ORDER BY p.paid_at DESC`,
            [student_id]
        );

        res.json({
            profile:              students[0],
            registration_history: registrationHistory,
            payment_history:      paymentHistory
        });

    } catch (err) {
        res.status(500).json({ message: "Lỗi tra cứu hồ sơ sinh viên", error: err.message });
    }
};

// ============================================================
// 3. THÊM SINH VIÊN MỚI
// POST /api/students
// ============================================================
exports.createStudent = async (req, res) => {
    // Validate đầu vào
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const {
        student_id, full_name, dob, gender,
        phone, email, class_group,
        province_id, district_id, priority_id,
        major_id, status
    } = value;

    try {
        // Kiểm tra MSSV trùng
        const [existing] = await db.query(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({
                message: `Mã số sinh viên ${student_id} đã tồn tại trong hệ thống.`
            });
        }

        // Kiểm tra email trùng (nếu có nhập)
        if (email) {
            const [emailCheck] = await db.query(
                'SELECT student_id FROM students WHERE email = ?',
                [email]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    message: `Email ${email} đã được sử dụng bởi sinh viên khác.`
                });
            }
        }

        await db.query(
            `INSERT INTO students
                (student_id, full_name, dob, gender, phone, email,
                 class_group, province_id, district_id, priority_id, major_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id, full_name, dob, gender,
                phone || null, email || null, class_group || null,
                province_id || null, district_id || null,
                priority_id || null, major_id || null,
                status || 'Đang học'
            ]
        );

        res.status(201).json({ message: "Thêm sinh viên thành công!", student_id });

    } catch (err) {
        res.status(500).json({ message: "Lỗi thêm sinh viên", error: err.message });
    }
};

// ============================================================
// 4. CẬP NHẬT THÔNG TIN SINH VIÊN
// PUT /api/students/:student_id
// ============================================================
exports.updateStudent = async (req, res) => {
    const { student_id } = req.params;

    // Dùng schema không bắt buộc student_id trong body khi update
    const updateSchema = studentSchema.fork(
        ['student_id', 'full_name', 'dob', 'gender'],
        field => field.optional()
    );
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        // Kiểm tra sinh viên tồn tại
        const [existing] = await db.query(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sinh viên cần cập nhật." });
        }

        const {
            full_name, dob, gender, phone, email,
            class_group, province_id, district_id,
            priority_id, major_id, status
        } = value;

        await db.query(
            `UPDATE students SET
                full_name    = COALESCE(?, full_name),
                dob          = COALESCE(?, dob),
                gender       = COALESCE(?, gender),
                phone        = COALESCE(?, phone),
                email        = COALESCE(?, email),
                class_group  = COALESCE(?, class_group),
                province_id  = COALESCE(?, province_id),
                district_id  = COALESCE(?, district_id),
                priority_id  = COALESCE(?, priority_id),
                major_id     = COALESCE(?, major_id),
                status       = COALESCE(?, status)
             WHERE student_id = ?`,
            [
                full_name    || null,
                dob          || null,
                gender       || null,
                phone        || null,
                email        || null,
                class_group  || null,
                province_id  || null,
                district_id  || null,
                priority_id  || null,
                major_id     || null,
                status       || null,
                student_id
            ]
        );

        res.json({ message: "Cập nhật thông tin sinh viên thành công!", student_id });

    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật sinh viên", error: err.message });
    }
};

// ============================================================
// 5. XÓA SINH VIÊN
// DELETE /api/students/:student_id
// ============================================================
exports.deleteStudent = async (req, res) => {
    const { student_id } = req.params;

    try {
        // Kiểm tra sinh viên có đăng ký học phần chưa
        const [regCheck] = await db.query(
            'SELECT id FROM registrations WHERE student_id = ? LIMIT 1',
            [student_id]
        );
        if (regCheck.length > 0) {
            return res.status(400).json({
                message: "Không thể xóa sinh viên đã có lịch sử đăng ký học phần."
            });
        }

        const [result] = await db.query(
            'DELETE FROM students WHERE student_id = ?',
            [student_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy sinh viên cần xóa." });
        }

        res.json({ message: "Xóa hồ sơ sinh viên thành công.", student_id });

    } catch (err) {
        res.status(500).json({ message: "Lỗi xóa sinh viên", error: err.message });
    }
};