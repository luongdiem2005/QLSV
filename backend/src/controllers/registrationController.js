const db = require('../config/db');
const Joi = require('joi');

// Schema validation đầu vào
const registerSchema = Joi.object({
    student_id: Joi.string().alphanum().min(8).max(15).required(),
    class_id:   Joi.string().min(3).max(15).required()
});

exports.registerClass = async (req, res) => {
    // 1. Validate dữ liệu đầu vào
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { student_id, class_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Kiểm tra lớp học có tồn tại và còn chỗ không (FOR UPDATE để lock row)
        const [classes] = await connection.query(
            `SELECT cl.class_id, cl.max_slots, cl.status,
                    co.course_id, co.credits, co.type, co.prerequisite_id
             FROM classes cl
             JOIN courses co ON cl.course_id = co.course_id
             WHERE cl.class_id = ? FOR UPDATE`,
            [class_id]
        );
        if (classes.length === 0) {
            throw new Error("Lớp học không tồn tại trong hệ thống.");
        }

        const targetClass = classes[0];

        // 3. Kiểm tra lớp có đang mở đăng ký không
        if (targetClass.status !== 'Đang mở') {
            throw new Error("Lớp học phần này đã đóng đăng ký.");
        }

        // 4. Kiểm tra số lượng sinh viên hiện tại so với sĩ số tối đa
        const [countRows] = await connection.query(
            'SELECT COUNT(*) AS current_count FROM registrations WHERE class_id = ?',
            [class_id]
        );
        const currentCount = countRows[0].current_count;
        if (currentCount >= targetClass.max_slots) {
            throw new Error("Lớp học phần đã đủ sĩ số, không thể đăng ký thêm.");
        }

        // 5. Kiểm tra sinh viên đã đăng ký lớp này chưa
        const [exists] = await connection.query(
            'SELECT id FROM registrations WHERE student_id = ? AND class_id = ?',
            [student_id, class_id]
        );
        if (exists.length > 0) {
            throw new Error("Sinh viên đã đăng ký lớp học phần này rồi.");
        }

        // 6. Kiểm tra sinh viên có đăng ký trùng môn học (khác lớp nhưng cùng môn) không
        const [sameSubject] = await connection.query(
            `SELECT r.id FROM registrations r
             JOIN classes cl ON r.class_id = cl.class_id
             WHERE r.student_id = ? AND cl.course_id = ?`,
            [student_id, targetClass.course_id]
        );
        if (sameSubject.length > 0) {
            throw new Error("Sinh viên đã đăng ký một lớp khác của môn học này rồi.");
        }

        // 7. Kiểm tra môn học tiên quyết (NGHIỆP VỤ CỐT LÕI)
        if (targetClass.prerequisite_id) {
            // Kiểm tra xem sinh viên đã từng đăng ký và hoàn thành môn tiên quyết chưa
            // Điều kiện: đã có bản ghi đăng ký môn tiên quyết trong học kỳ trước
            const [prereqCheck] = await connection.query(
                `SELECT r.id FROM registrations r
                 JOIN classes cl ON r.class_id = cl.class_id
                 WHERE r.student_id = ? AND cl.course_id = ?`,
                [student_id, targetClass.prerequisite_id]
            );
            if (prereqCheck.length === 0) {
                // Lấy tên môn tiên quyết để thông báo rõ ràng
                const [prereqInfo] = await connection.query(
                    'SELECT name FROM courses WHERE course_id = ?',
                    [targetClass.prerequisite_id]
                );
                const prereqName = prereqInfo.length > 0
                    ? prereqInfo[0].name
                    : targetClass.prerequisite_id;
                throw new Error(
                    `Không thể đăng ký: Sinh viên chưa hoàn thành môn học tiên quyết "${prereqName}" (${targetClass.prerequisite_id}).`
                );
            }
        }

        // 8. Tất cả điều kiện hợp lệ – Thực hiện đăng ký
        await connection.query(
            'INSERT INTO registrations (student_id, class_id) VALUES (?, ?)',
            [student_id, class_id]
        );

        await connection.commit();
        res.status(200).json({
            message: "Đăng ký học phần thành công!",
            data: {
                student_id,
                class_id,
                course_id:  targetClass.course_id,
                credits:    targetClass.credits,    // Đúng alias: co.credits
                type:       targetClass.type
            }
        });

    } catch (err) {
        await connection.rollback();
        res.status(400).json({ message: err.message });
    } finally {
        connection.release();
    }
};

// Hủy đăng ký học phần
exports.cancelRegistration = async (req, res) => {
    const { student_id, class_id } = req.body;

    if (!student_id || !class_id) {
        return res.status(400).json({ message: "Thiếu thông tin student_id hoặc class_id." });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM registrations WHERE student_id = ? AND class_id = ?',
            [student_id, class_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy bản ghi đăng ký để hủy." });
        }

        res.status(200).json({ message: "Hủy đăng ký học phần thành công." });
    } catch (err) {
        res.status(500).json({ message: "Lỗi hủy đăng ký", error: err.message });
    }
};