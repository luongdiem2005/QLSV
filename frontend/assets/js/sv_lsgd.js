/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC NHẬT KÝ GIAO DỊCH & BIÊN LAI (Student History)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH ĐƠN GIÁ & DIỆN CHÍNH SÁCH ĐỂ TÍNH TOÁN NGƯỢC (Audit Configuration)
    const TUITION_RATES = { 'Lý thuyết': 450000, 'Thực hành': 550000 };
    const studentProfile = {
        id: 'SV20260001',
        name: 'Nguyễn Văn An',
        className: 'KHMT2023',
        discountOriginalRate: 0.30 // Giảm 30% diện con thương binh
    };

    // Đẩy tên sinh viên lên Sidebar thanh điều hướng
    const sidebarStudentName = document.getElementById('sidebar-student-name');
    if (sidebarStudentName) sidebarStudentName.textContent = studentProfile.name;

    // 2. KHAI BÁO CÁC PHẦN TỬ DOM
    const historyTableBody = document.getElementById('historyTableBody');
    const receiptModal = document.getElementById('receiptModal');
    
    // Nút điều khiển Modal đóng/mở
    const btnCloseReceiptModal = document.getElementById('btnCloseReceiptModal');
    const btnCancelReceiptModal = document.getElementById('btnCancelReceiptModal');

    // Các trường dữ liệu nhúng thông tin trên phôi Biên lai điện tử
    const rcpStudentId = document.getElementById('rcpStudentId');
    const rcpStudentName = document.getElementById('rcpStudentName');
    const rcpClassName = document.getElementById('rcpClassName');
    const rcpTxnId = document.getElementById('rcpTxnId');
    const rcpDate = document.getElementById('rcpDate');
    const rcpTerm = document.getElementById('rcpTerm');
    const rcpAmountGross = document.getElementById('rcpAmountGross');
    const rcpAmountDiscount = document.getElementById('rcpAmountDiscount');
    const rcpAmountNet = document.getElementById('rcpAmountNet');
    const rcpMethodWord = document.getElementById('rcpMethodWord');

    // 3. TỰ ĐỘNG KHỞI TẠO DỮ LIỆU MẪU ĐỂ TRÁNH TRỐNG BẢNG (Idempotent Mock Seeding)
    function seedInitialHistoryData() {
        let currentHistory = JSON.parse(localStorage.getItem('edufee_payment_history'));
        
        // Nếu bộ nhớ trống (Sinh viên chưa từng bấm nút thanh toán ảo), nạp sẵn 1 giao dịch lịch sử cũ để demo
        if (!currentHistory || currentHistory.length === 0) {
            const mockPastTransaction = [
                {
                    id: 'TXN8839201',
                    date: '15/01/2026',
                    term: 'Học kỳ 2 (2025-2026)',
                    amount: 1155000, // Số tiền sau khi đã giảm 30% của môn IT001 (1.650.000đ)
                    method: 'Chuyển khoản Ngân hàng (VNPAY)',
                    status: 'Thành công'
                }
            ];
            localStorage.setItem('edufee_payment_history', JSON.stringify(mockPastTransaction));
        }
    }

    // 4. HÀM HIỂN THỊ LỊCH SỬ GIAO DỊCH LÊN LƯỚI (Render Transaction Ledger)
    function renderHistoryTable() {
        if (!historyTableBody) return;
        historyTableBody.innerHTML = '';

        // Đọc danh sách mảng giao dịch mới nhất từ LocalStorage
        const historyData = JSON.parse(localStorage.getItem('edufee_payment_history')) || [];

        if (historyData.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="color: #a0aec0; padding: 30px;">
                        <i class="ti ti-history-toggle" style="font-size: 26px; display: block; margin-bottom: 8px;"></i>
                        Hệ thống chưa ghi nhận bất kỳ giao dịch nộp học phí trực tuyến nào của bạn.
                    </td>
                </tr>`;
            return;
        }

        historyData.forEach((txn, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong style="font-family: monospace; color: #2b6cb0;">${txn.id}</strong></td>
                <td>${txn.date}</td>
                <td>${txn.term}</td>
                <td class="text-right" style="font-family: monospace; font-weight: 600; color: #2d3748;">
                    ${txn.amount.toLocaleString('vi-VN')} đ
                </td>
                <td><span style="font-size: 13px; color: #4a5568;"><i class="ti ti-device-laptop" style="font-size:14px; vertical-align:middle;"></i> ${txn.method}</span></td>
                <td class="text-center">
                    <span class="badge-status" style="background-color: #e6fffa; color: #234e52; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid #b2f5ea;">
                        <i class="ti ti-circle-check" style="font-size:12px; vertical-align:middle;"></i> ${txn.status}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-primary btn-view-receipt" data-id="${txn.id}" style="padding: 4px 10px; font-size: 12px; height: 28px;">
                        <i class="ti ti-file-text"></i> Xem biên lai
                    </button>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });

        bindActiveReceiptButtons(); // Gắn sự kiện click mở modal cho các nút bấm vừa tạo
    }

    // 5. THUẬT TOÁN TRA CỨU NGƯỢC VÀ ĐỔ DỮ LIỆU LÊN PHÔI BIÊN LAI (Audit Reverse Mapping)
    function bindActiveReceiptButtons() {
        document.querySelectorAll('.btn-view-receipt').forEach(button => {
            button.addEventListener('click', function() {
                const txnId = this.getAttribute('data-id');
                const historyData = JSON.parse(localStorage.getItem('edufee_payment_history')) || [];
                
                // Khớp mã tìm bản ghi giao dịch đích
                const targetTxn = historyData.find(t => t.id === txnId);
                if (!targetTxn) return;

                // --- LOGIC TÍNH TOÁN NGƯỢC DÒNG TIỀN (Reverse Financial Estimation) ---
                let grossAmount = 0;
                let discountAmount = 0;
                let netAmount = targetTxn.amount;

                if (targetTxn.term.includes('2026-2027')) {
                    // Nếu là học kỳ hiện tại, đọc giỏ hàng thực tế để lấy giá trị thô gốc
                    const registeredItems = JSON.parse(localStorage.getItem('edufee_registered_cart')) || [];
                    registeredItems.forEach(item => {
                        const rate = TUITION_RATES[item.type] || 450000;
                        grossAmount += item.credits * rate;
                    });
                    discountAmount = grossAmount * studentProfile.discountOriginalRate;
                } else {
                    // Nếu là học kỳ quá khứ (Dữ liệu mẫu seed), tính ngược biểu thức: Net = Gross * (1 - 0.3) -> Gross = Net / 0.7
                    grossAmount = netAmount / (1 - studentProfile.discountOriginalRate);
                    discountAmount = grossAmount * studentProfile.discountOriginalRate;
                }

                // --- BINDING DỮ LIỆU LÊN GIÁO DIỆN MODAL BIÊN LAI ---
                rcpStudentId.textContent = studentProfile.id;
                rcpStudentName.textContent = studentProfile.name;
                rcpClassName.textContent = studentProfile.className;
                rcpTxnId.textContent = targetTxn.id;
                rcpDate.textContent = targetTxn.date;
                rcpTerm.textContent = `Nộp học phí ${targetTxn.term}`;
                
                rcpAmountGross.textContent = `${grossAmount.toLocaleString('vi-VN')} đ`;
                rcpAmountDiscount.textContent = `-${discountAmount.toLocaleString('vi-VN')} đ`;
                rcpAmountNet.textContent = `${netAmount.toLocaleString('vi-VN')} đ`;
                rcpMethodWord.textContent = `Hình thức: Thanh toán điện tử qua kênh ${targetTxn.method}`;

                // Hiện Modal hỏa tốc
                receiptModal.classList.remove('hidden');
            });
        });
    }

    // 6. QUẢN LÝ VÒNG ĐỜI ĐÓNG MODAL DIALOG
    function closeReceiptModal() {
        receiptModal.classList.add('hidden');
    }

    if (btnCloseReceiptModal) btnCloseReceiptModal.addEventListener('click', closeReceiptModal);
    if (btnCancelReceiptModal) btnCancelReceiptModal.addEventListener('click', closeReceiptModal);

    // 7. KHỞI CHẠY LẦN ĐẦU (Bootstrap Execution Loop)
    seedInitialHistoryData(); // Bơm dữ liệu mồi nếu có
    renderHistoryTable();     // Vẽ bảng dữ liệu nhật ký hành trình tài chính
});