const db = require('../config/db');

// ============================================================
// 1. LẤY HÓA ĐƠN HỌC PHÍ CHI TIẾT CỦA SINH VIÊN
// GET /api/finance/invoice/:student_id?semester_id=2026-2027_HK1
// ============================================================
exports.getTuitionInvoice = async (req, res) => {
    const { student_id } = req.params;
    const { semester_id } = req.query;

    if (!semester_id) {
        return res.status(400).json({ message: "Thiếu tham số semester_id." });
    }

    try {
        // 1. Lấy danh sách lớp đã đăng ký trong học kỳ – SỬA alias c -> co
        const [registrations] = await db.query(
            `SELECT cl.class_id,
                    co.course_id,
                    co.name        AS course_name,
                    co.credits,
                    co.type        AS course_type
             FROM registrations r
             JOIN classes  cl ON r.class_id    = cl.class_id
             JOIN courses  co ON cl.course_id  = co.course_id
             WHERE r.student_id = ?
               AND cl.semester_id = ?`,
            [student_id, semester_id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({
                message: "Sinh viên chưa đăng ký môn học nào trong học kỳ này."
            });
        }

        // 2. Lấy biểu giá học phí hiện hành
        const [rates] = await db.query('SELECT class_type, unit_price FROM tuition_rates');
        const rateMap = Object.fromEntries(
            rates.map(r => [r.class_type, r.unit_price])
        );

        // 3. Tính tổng tiền từng môn và tổng thô
        let totalGross = 0;
        const lineItems = registrations.map(reg => {
            const unitPrice = rateMap[reg.course_type] || 0;
            const rowTotal  = reg.credits * unitPrice;
            totalGross     += rowTotal;
            return {
                class_id:    reg.class_id,
                course_id:   reg.course_id,
                course_name: reg.course_name,
                credits:     reg.credits,
                type:        reg.course_type,
                unit_price:  unitPrice,
                row_total:   rowTotal
            };
        });

        // 4. Kiểm tra miễn giảm đã được duyệt
        const [exemptions] = await db.query(
            `SELECT discount_rate
             FROM exemptions
             WHERE student_id = ? AND status = 'APPROVED'
             ORDER BY id DESC LIMIT 1`,
            [student_id]
        );

        const discountRate   = exemptions.length > 0
            ? parseFloat(exemptions[0].discount_rate) / 100
            : 0;
        const discountAmount = Math.round(totalGross * discountRate);
        const totalDue       = totalGross - discountAmount;

        // 5. Lấy tổng tiền đã đóng từ bảng payments
        const [paidRows] = await db.query(
            `SELECT COALESCE(SUM(p.amount), 0) AS total_paid
             FROM payments p
             JOIN registration_invoices ri ON p.invoice_id = ri.invoice_id
             WHERE ri.student_id  = ?
               AND ri.semester_id = ?
               AND p.status       = 'PAID'`,
            [student_id, semester_id]
        );
        const totalPaid  = parseInt(paidRows[0].total_paid, 10);
        const remaining  = Math.max(totalDue - totalPaid, 0);

        res.status(200).json({
            student_id,
            semester_id,
            line_items:       lineItems,
            total_gross:      totalGross,
            discount_rate:    discountRate * 100,
            discount_amount:  discountAmount,
            total_due:        totalDue,
            total_paid:       totalPaid,
            remaining:        remaining,
            currency:         "VND"
        });

    } catch (err) {
        res.status(500).json({ message: "Lỗi tính toán học phí", error: err.message });
    }
};

// ============================================================
// 2. LẬP PHIẾU THU HỌC PHÍ (PTC thực hiện)
// POST /api/finance/payment
// ============================================================
exports.processPayment = async (req, res) => {
    const { student_id, semester_id, amount } = req.body;

    if (!student_id || !semester_id || !amount) {
        return res.status(400).json({
            message: "Thiếu thông tin: student_id, semester_id, amount là bắt buộc."
        });
    }

    if (isNaN(amount) || parseInt(amount, 10) <= 0) {
        return res.status(400).json({ message: "Số tiền thu phải là số dương hợp lệ." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lấy hoặc tạo phiếu đăng ký học phần của sinh viên trong học kỳ
        let [invoices] = await connection.query(
            'SELECT * FROM registration_invoices WHERE student_id = ? AND semester_id = ?',
            [student_id, semester_id]
        );

        if (invoices.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phiếu đăng ký học phần của sinh viên trong học kỳ này."
            });
        }

        const invoice = invoices[0];

        // 2. Kiểm tra số tiền thu không vượt quá số tiền còn nợ
        const amountInt = parseInt(amount, 10);
        if (amountInt > invoice.remaining) {
            return res.status(400).json({
                message: `Số tiền thu (${amountInt.toLocaleString('vi-VN')}đ) vượt quá số tiền còn nợ (${invoice.remaining.toLocaleString('vi-VN')}đ).`
            });
        }

        // 3. Tạo mã phiếu thu
        const paymentId = 'TXN' + Date.now().toString().substring(4);

        // 4. Ghi phiếu thu vào bảng payments
        await connection.query(
            `INSERT INTO payments (payment_id, invoice_id, student_id, amount, method, status)
             VALUES (?, ?, ?, ?, 'Chuyển khoản', 'PAID')`,
            [paymentId, invoice.invoice_id, student_id, amountInt]
        );

        // 5. Cập nhật lại tổng tiền đã đóng và còn lại trong phiếu ĐKHP
        const newTotalPaid = invoice.total_paid + amountInt;
        const newRemaining = Math.max(invoice.total_due - newTotalPaid, 0);

        await connection.query(
            `UPDATE registration_invoices
             SET total_paid = ?, remaining = ?
             WHERE invoice_id = ?`,
            [newTotalPaid, newRemaining, invoice.invoice_id]
        );

        await connection.commit();

        res.status(200).json({
            message:     "Lập phiếu thu học phí thành công!",
            payment_id:  paymentId,
            invoice_id:  invoice.invoice_id,
            amount_paid: amountInt,
            remaining:   newRemaining
        });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: "Lỗi lập phiếu thu", error: err.message });
    } finally {
        connection.release();
    }
};

// ============================================================
// 3. BÁO CÁO SINH VIÊN CHƯA HOÀN THÀNH HỌC PHÍ
// GET /api/finance/debt-report?semester_id=2026-2027_HK1
// ============================================================
exports.getDebtReport = async (req, res) => {
    const { semester_id } = req.query;

    if (!semester_id) {
        return res.status(400).json({ message: "Thiếu tham số semester_id." });
    }

    try {
        const [rows] = await db.query(
            `SELECT
                ri.invoice_id,
                ri.student_id,
                s.full_name,
                s.class_group,
                ri.total_gross,
                ri.total_due,
                ri.total_paid,
                ri.remaining
             FROM registration_invoices ri
             JOIN students s ON ri.student_id = s.student_id
             WHERE ri.semester_id = ?
               AND ri.remaining   > 0
             ORDER BY ri.remaining DESC`,
            [semester_id]
        );

        res.status(200).json({
            semester_id,
            total_students_in_debt: rows.length,
            data: rows
        });

    } catch (err) {
        res.status(500).json({
            message: "Lỗi tải báo cáo công nợ",
            error: err.message
        });
    }
};

// ============================================================
// 4. LẤY LỊCH SỬ PHIẾU THU CỦA SINH VIÊN
// GET /api/finance/payment-history/:student_id
// ============================================================
exports.getPaymentHistory = async (req, res) => {
    const { student_id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT
                p.payment_id,
                p.invoice_id,
                p.amount,
                p.method,
                p.status,
                p.paid_at,
                ri.semester_id
             FROM payments p
             JOIN registration_invoices ri ON p.invoice_id = ri.invoice_id
             WHERE p.student_id = ?
             ORDER BY p.paid_at DESC`,
            [student_id]
        );

        res.status(200).json({ student_id, data: rows });

    } catch (err) {
        res.status(500).json({
            message: "Lỗi tải lịch sử thanh toán",
            error: err.message
        });
    }
};