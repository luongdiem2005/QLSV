/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC TÍNH TOÁN CÔNG NỢ & THANH TOÁN (Student Tuition)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH ĐƠN GIÁ HỌC PHÍ (Business Configuration)
    // Đọc đơn giá từ cấu hình PTC, fallback về giá mặc định nếu chưa cấu hình
    function getTuitionRates() {
    const stored = localStorage.getItem('edufee_global_tuition_rates');
    if (stored) {
        return JSON.parse(stored);
    }
    return { 'Lý thuyết': 27000, 'Thực hành': 37000 };
}
const TUITION_RATES = getTuitionRates();

    // 2. THÔNG TIN SINH VIÊN & CHÍNH SÁCH MIỄN GIẢM (Policy Configuration)
    // Giả lập: Sinh viên Nguyễn Văn An thuộc diện con thương binh, được giảm 30% học phí
    const studentProfile = {
        id: 'SV20260001',
        name: 'Nguyễn Văn An',
        policyGroup: 'Con thương binh/bệnh binh',
        discountRate: 0.30 // Giảm 30%
    };

    // 3. ĐỌC DỮ LIỆU ĐĂNG KÝ MÔN HỌC (State Management)
    // Lấy dữ liệu giỏ hàng sinh viên đã chốt từ trang student_register.html
    let registeredItems = JSON.parse(localStorage.getItem('edufee_registered_cart')) || [];

    // Khởi tạo các biến lưu trữ dòng tiền học kỳ hiện tại
    let financialState = {
        totalGross: 0,   // Thành tiền thô
        discount: 0,     // Số tiền được miễn giảm
        paid: 0,         // Số tiền đã đóng
        debt: 0          // Số tiền còn nợ đối chiếu
    };

    // 4. KHAI BÁO CÁC PHẦN TỬ DOM
    const tuitionDetailTableBody = document.getElementById('tuitionDetailTableBody');
    const sumTotal = document.getElementById('sumTotal');
    const sumDiscount = document.getElementById('sumDiscount');
    const sumPaid = document.getElementById('sumPaid');
    const sumDebt = document.getElementById('sumDebt');
    
    const paymentStatusBadge = document.getElementById('paymentStatusBadge');
    const lblPolicyName = document.getElementById('lblPolicyName');
    const lblPolicyRate = document.getElementById('lblPolicyRate');
    const paymentPanel = document.getElementById('paymentPanel');
    const btnExecutePayment = document.getElementById('btnExecutePayment');
    const selectTuitionTerm = document.getElementById('selectTuitionTerm');

    // Nút đăng xuất đồng bộ tên hiển thị sidebar
    const sidebarStudentName = document.getElementById('sidebar-student-name');
    if (sidebarStudentName) sidebarStudentName.textContent = studentProfile.name;

    // 5. THUẬT TOÁN TÍNH TOÁN VÀ KẾT XUẤT HÓA ĐƠN CHI TIẾT
    function calculateAndRenderInvoice() {
        tuitionDetailTableBody.innerHTML = '';
        
        // Cập nhật thông tin diện chính sách miễn giảm lên hộp Alert UI
        if (lblPolicyName) lblPolicyName.textContent = studentProfile.policyGroup;
        if (lblPolicyRate) lblPolicyRate.textContent = `${studentProfile.discountRate * 100}%`;

        // Học kỳ test mặc định là Học kỳ 1 năm học 2026-2027
        if (selectTuitionTerm && selectTuitionTerm.value !== "2026-2027_HK1") {
            // Trường hợp người dùng chọn học kỳ lịch sử cũ (Giả định đã đóng xong hết từ năm ngoái)
            renderPastSemester();
            return;
        }

        if (registeredItems.length === 0) {
            tuitionDetailTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="color: #a0aec0; padding: 30px; font-style: italic;">
                        <i class="ti ti-file-invoice" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Không tìm thấy dữ liệu học phần đã đăng ký của học kỳ này. Vui lòng vào trang Đăng ký học phần trước.
                    </td>
                </tr>`;
            resetFinancialMetrics();
            return;
        }

        // Khởi động lại biến đếm dòng tiền thô
        let grossSum = 0;

        registeredItems.forEach((item, index) => {
            const rate = TUITION_RATES[item.type] || 450000;
            const rowTotal = item.credits * rate;
            grossSum += rowTotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.classId}</strong></td>
                <td>${item.name} <span style="color:#718096; font-size:12px;">(${item.subjectId})</span></td>
                <td class="text-center">${item.credits}</td>
                <td>${item.type}</td>
                <td class="text-right" style="font-family: monospace;">${rate.toLocaleString('vi-VN')} đ</td>
                <td class="text-right" style="font-family: monospace; font-weight: 500;">${rowTotal.toLocaleString('vi-VN')} đ</td>
            `;
            tuitionDetailTableBody.appendChild(tr);
        });

        // ÁP DỤNG CÁC QUY TẮC RÀNG BUỘC KINH DOANH (Applying Financial Rules)
        financialState.totalGross = grossSum;
        financialState.discount = grossSum * studentProfile.discountRate; // Miễn giảm theo % chính sách
        
        // Kiểm tra xem sinh viên này trước đó đã bấm thanh toán chưa (Lưu trạng thái thanh toán vào localStorage)
        const isPaidHistory = localStorage.getItem(`edufee_payment_status_2026_hk1`) === 'PAID';
        if (isPaidHistory) {
            financialState.paid = financialState.totalGross - financialState.discount;
            financialState.debt = 0;
        } else {
            financialState.paid = 0;
            financialState.debt = financialState.totalGross - financialState.discount;
        }

        // Cập nhật số liệu hiển thị lên 4 Thẻ chỉ số KPI
        updateFinancialKPIWidgets();
    }

    // Hàm đổ số liệu thô sau tính toán ra các widget hiển thị
    function updateFinancialKPIWidgets() {
        sumTotal.textContent = `${financialState.totalGross.toLocaleString('vi-VN')} đ`;
        sumDiscount.textContent = `-${financialState.discount.toLocaleString('vi-VN')} đ`;
        sumPaid.textContent = `${financialState.paid.toLocaleString('vi-VN')} đ`;
        sumDebt.textContent = `${financialState.debt.toLocaleString('vi-VN')} đ`;

        // Tự động điều chỉnh huy hiệu trạng thái và ẩn hiện nút thanh toán (Smart State UI Guard)
        if (financialState.debt > 0) {
            paymentStatusBadge.innerHTML = '<span style="background-color: #fff5f5; color: #e53e3e; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; border: 1px solid #fed7d7;">Chưa hoàn thành học phí</span>';
            if (paymentPanel) paymentPanel.style.display = 'flex'; // Hiện khung thanh toán ngân hàng
        } else {
            paymentStatusBadge.innerHTML = '<span style="background-color: #f0fff4; color: #38a169; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; border: 1px solid #c6f6d5;">Đã hoàn thành nghĩa vụ học phí</span>';
            if (paymentPanel) paymentPanel.style.display = 'none'; // Ẩn khung thanh toán vì nợ bằng 0
        }
    }

    function resetFinancialMetrics() {
        sumTotal.textContent = '0 đ';
        sumDiscount.textContent = '-0 đ';
        sumPaid.textContent = '0 đ';
        sumDebt.textContent = '0 đ';
        paymentStatusBadge.innerHTML = '<span style="color: #718096;">-</span>';
        if (paymentPanel) paymentPanel.style.display = 'none';
    }

    // 6. GIẢ LẬP KẾT XUẤT HỌC KỲ LỊCH SỬ QUÁ KHỨ (Mock Past Data)
    function renderPastSemester() {
        // Giả lập dữ liệu cũ Học kỳ 2 năm học 2025-2026 đã đóng tiền xong xuôi
        tuitionDetailTableBody.innerHTML = `
            <tr>
                <td>1</td>
                <td><strong>IT001.O11</strong></td>
                <td>Nhập môn lập trình <span style="color:#718096; font-size:12px;">(IT001)</span></td>
                <td class="text-center">3</td>
                <td>Thực hành</td>
                <td class="text-right" style="font-family: monospace;">550.000 đ</td>
                <td class="text-right" style="font-family: monospace; font-weight: 500;">1.650.000 đ</td>
            </tr>
        `;
        sumTotal.textContent = '1.650.000 đ';
        sumDiscount.textContent = '-495.000 đ';
        sumPaid.textContent = '1.155.000 đ';
        sumDebt.textContent = '0 đ';
        paymentStatusBadge.innerHTML = '<span style="background-color: #f0fff4; color: #38a169; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; border: 1px solid #c6f6d5;">Đã tất toán lịch sử</span>';
        if (paymentPanel) paymentPanel.style.display = 'none';
    }

    // Lắng nghe sự kiện đổi Học kỳ trên thanh tìm kiếm
    if (selectTuitionTerm) {
        selectTuitionTerm.addEventListener('change', calculateAndRenderInvoice);
    }

    // 7. GIẢ LẬP QUY TRÌNH QUÉT CỔNG THANH TOÁN QUỐC TẾ (Transaction Handler)
    if (btnExecutePayment) {
        btnExecutePayment.addEventListener('click', () => {
            const amountToPay = financialState.debt;
            
            const confirmPay = confirm(
                `XÁC NHẬN KẾT NỐI CỔNG VNPAY / NGÂN HÀNG\n\n` +
                `Hệ thống sẽ tiến hành trừ số tiền công nợ học phí:\n` +
                `👉 Số tiền tất toán: ${amountToPay.toLocaleString('vi-VN')} VNĐ\n\n` +
                `Bạn có chắc chắn muốn thực hiện giao dịch này không?`
            );

            if (confirmPay) {
                // Giả lập thời gian chờ phản hồi từ API Ngân hàng ngân quy (Mô phỏng bất đồng bộ)
                btnExecutePayment.setAttribute('disabled', 'true');
                btnExecutePayment.innerHTML = '<i class="ti ti-refresh-dot" style="animation: spin 1s linear infinite;"></i> Đang xử lý giao dịch...';

                setTimeout(() => {
                    // Đổi trạng thái trong bộ lưu trữ
                    localStorage.setItem(`edufee_payment_status_2026_hk1`, 'PAID');
                    
                    // Ghi nhận hóa đơn này vào danh sách lịch sử giao dịch để phân hệ sinh viên và PTC cùng quét tra cứu
                    let currentHistory = JSON.parse(localStorage.getItem('edufee_payment_history')) || [];
                    currentHistory.unshift({
                        id: 'TXN' + Date.now().toString().substring(7),
                        date: new Date().toLocaleDateString('vi-VN'),
                        term: 'Học kỳ 1 (2026-2027)',
                        amount: amountToPay,
                        method: 'Chuyển khoản Ngân hàng (VNPAY)',
                        status: 'Thành công'
                    });
                    localStorage.setItem('edufee_payment_history', JSON.stringify(currentHistory));

                    alert(
                        ` THANH TOÁN HỌC PHÍ THÀNH CÔNG!\n\n` +
                        `Ngân hàng đã tất toán khoản nợ ${amountToPay.toLocaleString('vi-VN')} đ.\n` +
                        `Hệ thống EduFee đã cập nhật trạng thái hồ sơ: ĐÃ HOÀN THÀNH NGHĨA VỤ HỌC PHÍ.\n` +
                        `Bạn có thể qua trang "Lịch sử giao dịch" để tải biên lai điện tử.`
                    );

                    // Trả lại nguyên trạng nút bấm và vẽ lại hóa đơn đã tất toán nợ
                    btnExecutePayment.removeAttribute('disabled');
                    btnExecutePayment.innerHTML = '<i class="ti ti-credit-card"></i> <span>Tiến hành thanh toán ngay</span>';
                    
                    calculateAndRenderInvoice();
                }, 1200); // Trì hoãn 1.2 giây giả lập mạng internet ngân hàng
            }
        });
    }

    // 8. INITIAL BOOTSTRAP (Kích hoạt hệ thống)
    calculateAndRenderInvoice();
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