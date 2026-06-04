/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC THỐNG KÊ DOANH THU & CÔNG NỢ (Finance Dashboard)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH ĐƠN GIÁ BIỂU GIÁ QUY ĐỊNH (Đồng bộ cấu hình tài chính)
    const TUITION_RATES = {
        'Lý thuyết': 450000,
        'Thực hành': 550000
    };

    // Định danh thông tin cán bộ tài chính đang vận hành hệ thống
    const financeStaff = { name: 'Trần Thị Thu Kế' };
    const sidebarUserName = document.getElementById('sidebar-username');
    if (sidebarUserName) sidebarUserName.textContent = financeStaff.name;

    // 2. KHO DỮ LIỆU GIẢ LẬP DANH SÁCH SINH VIÊN TOÀN TRƯỜNG ĐỂ LẬP SỔ CÁI
    // Hệ thống sẽ lấy dữ liệu thực tế của Sinh viên An từ localStorage nếu có, ngược lại dùng dữ liệu mồi
    let masterStudentsDebtList = [
        { id: '20260001', name: 'Nguyễn Văn An', className: 'KHMT2023', discountRate: 0.30, dynamicLoad: true },
        { id: '20260002', name: 'Trần Minh Tâm', className: 'ANNT2024', discountRate: 0.50, fixedGross: 5500000, fixedPaid: 2750000 }, // Giảm 50%, đã nộp đủ
        { id: '20260003', name: 'Lê Hoàng Yến', className: 'CNPM2023', discountRate: 0.00, fixedGross: 4800000, fixedPaid: 0 },       // Không giảm, còn nợ 100%
        { id: '20260004', name: 'Phạm Đức Long', className: 'HTTT2025', discountRate: 1.00, fixedGross: 3900000, fixedPaid: 0 }        // Miễn giảm 100% chính sách
    ];

    // 3. KHAI BÁO THÀNH PHẦN DOM
    const masterDebtTableBody = document.getElementById('masterDebtTableBody');
    const searchStudentDebt = document.getElementById('searchStudentDebt');
    
    // Khối các thẻ KPI tài chính
    const kpiTotalGross = document.getElementById('kpiTotalGross');
    const kpiTotalDiscount = document.getElementById('kpiTotalDiscount');
    const kpiTotalPaid = document.getElementById('kpiTotalPaid');
    const kpiTotalDebt = document.getElementById('kpiTotalDebt');

    // Khối thanh tiến độ đồ họa
    const lblPercentageOutput = document.getElementById('lblPercentageOutput');
    const barPaid = document.getElementById('barPaid');
    const barDebt = document.getElementById('barDebt');

    // Biến trạng thái tổng hợp vĩ mô dòng tiền (Global Financial Metrics State)
    let globalMetrics = {
        gross: 0,
        discount: 0,
        paid: 0,
        debt: 0
    };

    // 4. THUẬT TOÁN ĐỒNG BỘ DỮ LIỆU & TÍNH TOÁN CÔNG NỢ TOÀN DIỆN (Core Aggregator Engine)
    function compileFinancialMasterLedger() {
        // Khởi động lại các thông số đếm tiền quỹ
        globalMetrics = { gross: 0, discount: 0, paid: 0, debt: 0 };

        // Đọc dữ liệu động của Sinh viên Nguyễn Văn An từ LocalStorage xem em ấy đăng ký mấy môn và đóng tiền chưa
        const studentCart = JSON.parse(localStorage.getItem('edufee_registered_cart')) || [];
        const isStudentPaid = localStorage.getItem('edufee_payment_status_2026_hk1') === 'PAID';

        // Tính toán học phí thực tế thời gian thực của sinh viên động SV20260001
        let anGross = 0;
        studentCart.forEach(item => {
            const rate = TUITION_RATES[item.type] || 450000;
            anGross += item.credits * rate;
        });
        let anDiscount = anGross * 0.30; // Nguyễn Văn An giảm 30%
        let anPaid = isStudentPaid ? (anGross - anDiscount) : 0;
        let anDebt = anGross - anDiscount - anPaid;

        // Cập nhật ma trận số liệu tính được vào mảng danh sách Sổ cái
        masterStudentsDebtList = masterStudentsDebtList.map(student => {
            if (student.dynamicLoad) {
                return {
                    ...student,
                    gross: anGross,
                    discount: anDiscount,
                    paid: anPaid,
                    debt: anDebt
                };
            } else {
                // Các sinh viên giả lập tĩnh, map số liệu thô có sẵn
                return {
                    ...student,
                    gross: student.fixedGross,
                    discount: student.fixedGross * student.discountRate,
                    paid: student.fixedPaid,
                    debt: student.fixedGross - (student.fixedGross * student.discountRate) - student.fixedPaid
                };
            }
        });

        // Vòng lặp cộng dồn tạo số liệu vĩ mô toàn trường cho 4 thẻ KPI
        masterStudentsDebtList.forEach(s => {
            globalMetrics.gross += s.gross;
            globalMetrics.discount += s.discount;
            globalMetrics.paid += s.paid;
            globalMetrics.debt += s.debt;
        });

        // Đẩy số liệu ra giao diện Dashboard
        renderKPICards();
        renderProgressAnalytics();
        filterAndRenderDebtTable();
    }

    // 5. HIỂN THỊ CÁC THẺ CHỈ SỐ KPI TÀI CHÍNH
    function renderKPICards() {
        if (kpiTotalGross) kpiTotalGross.textContent = `${globalMetrics.gross.toLocaleString('vi-VN')} đ`;
        if (kpiTotalDiscount) kpiTotalDiscount.textContent = `-${globalMetrics.discount.toLocaleString('vi-VN')} đ`;
        if (kpiTotalPaid) kpiTotalPaid.textContent = `${globalMetrics.paid.toLocaleString('vi-VN')} đ`;
        if (kpiTotalDebt) kpiTotalDebt.textContent = `${globalMetrics.debt.toLocaleString('vi-VN')} đ`;
    }

    // 6. THUẬT TOÁN PHÂN CHIA TỶ LỆ THANH TIẾN ĐỘ ĐỒ HỌA ĐỘNG (Dynamic Progress Bar Renderer)
    function renderProgressAnalytics() {
        const netExpectancy = globalMetrics.gross - globalMetrics.discount; // Số tiền thực tế cần thu sau giảm trừ
        if (netExpectancy === 0) {
            if (lblPercentageOutput) lblPercentageOutput.textContent = "Chỉ tiêu: 0%";
            if (barPaid) barPaid.style.width = "0%";
            if (barDebt) barDebt.style.width = "0%";
            return;
        }

        // Tính toán tỷ lệ phần trăm hoàn thành nộp quỹ
        const paidPercentage = (globalMetrics.paid / netExpectancy) * 100;
        const debtPercentage = (globalMetrics.debt / netExpectancy) * 100;

        if (lblPercentageOutput) {
            lblPercentageOutput.textContent = `Tỷ lệ hoàn thành thu hồi: ${paidPercentage.toFixed(1)}%`;
        }

        // Ép độ rộng thanh CSS rải màu đồ họa trực quan
        if (barPaid) barPaid.style.width = `${paidPercentage}%`;
        if (barDebt) barDebt.style.width = `${debtPercentage}%`;
    }

    // 7. BỘ LỌC TÌM KIẾM & HIỂN THỊ SỔ CÁI CÔNG NỢ CHI TIẾT (Data Grid Binder)
    function filterAndRenderDebtTable() {
        if (!masterDebtTableBody) return;
        masterDebtTableBody.innerHTML = '';

        const searchText = searchStudentDebt ? searchStudentDebt.value.toLowerCase().trim() : '';

        // Thực hiện lọc dữ liệu theo từ khóa tìm kiếm
        const filteredList = masterStudentsDebtList.filter(s => {
            return s.id.toLowerCase().includes(searchText) || 
                   s.name.toLowerCase().includes(searchText) ||
                   s.className.toLowerCase().includes(searchText);
        });

        if (filteredList.length === 0) {
            masterDebtTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="color: #718096; padding: 20px;">
                        Không tìm thấy sinh viên nào khớp với điều kiện tìm kiếm công nợ.
                    </td>
                </tr>`;
            return;
        }

        // Vẽ từng dòng dữ liệu kế toán lên lưới
        filteredList.forEach(s => {
            let statusBadge = '';
            
            if (s.gross === 0) {
                statusBadge = '<span style="background:#edf2f7; color:#4a5568; padding:3px 6px; border-radius:4px; font-size:12px;">Kế hoạch trống</span>';
            } else if (s.debt === 0) {
                statusBadge = '<span style="background:#e6fffa; color:#234e52; padding:3px 6px; border-radius:4px; font-size:12px; font-weight:500; border:1px solid #b2f5ea;">Đã hoàn thành</span>';
            } else if (s.paid > 0 && s.debt > 0) {
                statusBadge = '<span style="background:#fffaf0; color:#7b341e; padding:3px 6px; border-radius:4px; font-size:12px; font-weight:500; border:1px solid #feebc8;">Nộp một phần</span>';
            } else {
                statusBadge = '<span style="background:#fff5f5; color:#9b2c2c; padding:3px 6px; border-radius:4px; font-size:12px; font-weight:500; border:1px solid #fed7d7;">Còn nợ 100%</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="font-family: monospace; color:#2b6cb0;">${s.id}</strong></td>
                <td><strong>${s.name}</strong></td>
                <td>${s.className}</td>
                <td class="text-right" style="font-family: monospace;">${s.gross.toLocaleString('vi-VN')} đ</td>
                <td class="text-right" style="font-family: monospace; color:#dd6b20;">-${s.discount.toLocaleString('vi-VN')} đ</td>
                <td class="text-right" style="font-family: monospace; color:#38a169;">${s.paid.toLocaleString('vi-VN')} đ</td>
                <td class="text-right" style="font-family: monospace; color:#e53e3e; font-weight:600;">${s.debt.toLocaleString('vi-VN')} đ</td>
                <td class="text-center">${statusBadge}</td>
            `;
            masterDebtTableBody.appendChild(tr);
        });
    }

    // Lắng nghe hành vi nhập liệu ô tìm kiếm sinh viên công nợ
    if (searchStudentDebt) {
        searchStudentDebt.addEventListener('input', filterAndRenderDebtTable);
    }

    // 8. INITIAL INITIALIZATION LOOP (Kích hoạt hệ thống hạch toán)
    compileFinancialMasterLedger();
});
// Thêm đoạn này vào hàm khởi chạy DOMContentLoaded của các trang để nạp Footer tự động
// const footerContainer = document.getElementById('shared-footer-container');
// if (footerContainer) {
//     fetch('../../components/footer.html')
//         .then(response => response.text())
//         .then(data => {
//             footerContainer.innerHTML = data;
//             // Thực thi lại đoạn script tính năm bên trong file footer vừa nạp
//             const script = footerContainer.querySelector('script');
//             if (script) eval(script.innerHTML);
//         });
// }