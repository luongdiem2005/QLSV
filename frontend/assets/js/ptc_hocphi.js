/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC ĐỊNH MỨC ĐƠN GIÁ HỌC PHÍ (Finance Rates)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Định danh thông tin cán bộ tài chính hiển thị lên sidebar
    const financeStaff = { name: 'Trần Thị Thu Kế' };
    const sidebarUserName = document.getElementById('sidebar-username');
    if (sidebarUserName) sidebarUserName.textContent = financeStaff.name;

    // 1. KHỞI TẠO BIỂU GIÁ MẶC ĐỊNH HỆ THỐNG (Idempotent Configuration Seeding)
    // Nếu trong hệ thống chưa từng cấu hình giá, nạp giá gốc làm mồi theo đặc tả
    function initSystemTuitionRates() {
        const existingRates = localStorage.getItem('edufee_global_tuition_rates');
        if (!existingRates) {
            const defaultRates = {
                'Lý thuyết': 450000,
                'Thực hành': 550000,
                'Đồ án tốt nghiệp': 600000
            };
            localStorage.setItem('edufee_global_tuition_rates', JSON.stringify(defaultRates));
        }
    }

    // 2. KHAI BÁO THÀNH PHẦN DOM INTERACTION
    const ratesTableBody = document.getElementById('ratesTableBody');
    const formRateConfig = document.getElementById('formRateConfig');
    const formPanelTitle = document.getElementById('formPanelTitle');
    
    // Các trường dữ liệu đầu vào của Form
    const txtRateId = document.getElementById('txtRateId'); // Lưu key loại hình môn học
    const selectClassType = document.getElementById('selectClassType');
    const numUnitPrice = document.getElementById('numUnitPrice');
    const btnResetForm = document.getElementById('btnResetForm');

    // 3. HÀM KẾT XUẤT DANH MỤC ĐƠN GIÁ LÊN LƯỚI (Data Grid Renderer)
    function renderRatesTable() {
        if (!ratesTableBody) return;
        ratesTableBody.innerHTML = '';

        // Đọc bảng cấu hình giá từ bộ nhớ dùng chung
        const currentRates = JSON.parse(localStorage.getItem('edufee_global_tuition_rates')) || {};
        
        // Chuyển đối tượng Object thành mảng để duyệt render bằng cấu trúc vòng lặp
        const ratesArray = Object.keys(currentRates);
        const fixedUpdateDate = '04/06/2026'; // Giả lập mốc thời gian cập nhật hệ thống thực tế

        ratesArray.forEach((classType, index) => {
            const price = currentRates[classType];
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${classType}</strong></td>
                <td class="text-right" style="font-family: monospace; font-weight: 600; color: #2b6cb0;">
                    ${price.toLocaleString('vi-VN')} đ
                </td>
                <td style="color: #718096; font-size: 13px;">
                    <i class="ti ti-calendar-time" style="font-size:14px; vertical-align:middle;"></i> ${fixedUpdateDate}
                </td>
                <td class="text-center">
                    <button class="btn btn-secondary btn-edit-rate" data-type="${classType}" data-price="${price}" style="padding: 4px 8px; font-size: 12px; height: 28px;">
                        <i class="ti ti-edit"></i> Sửa giá
                    </button>
                </td>
            `;
            ratesTableBody.appendChild(tr);
        });

        bindEditActions(); // Kích hoạt lắng nghe sự kiện nút bấm sửa
    }

    // 4. LUỒNG ĐỔ DỮ LIỆU TỪ BẢNG NGƯỢC LÊN FORM (Data Binding Event Link)
    function bindEditActions() {
        document.querySelectorAll('.btn-edit-rate').forEach(button => {
            button.addEventListener('click', function() {
                const classType = this.getAttribute('data-type');
                const price = this.getAttribute('data-price');

                // Chuyển đổi trạng thái Form sang chế độ Biên tập viên
                if (txtRateId) txtRateId.value = classType;
                if (selectClassType) {
                    selectClassType.value = classType;
                    selectClassType.removeAttribute('disabled'); // Mở khóa để hiển thị chuẩn xác dữ liệu chọn
                }
                if (numUnitPrice) {
                    numUnitPrice.value = price;
                    numUnitPrice.focus(); // Đẩy con trỏ chuột vào ô nhập số tiền hỏa tốc
                }

                if (formPanelTitle) {
                    formPanelTitle.innerHTML = `<i class="ti ti-edit" style="color:#38a169;"></i> Đang chỉnh sửa: ${classType}`;
                }
            });
        });
    }

    // 5. XỬ LÝ SỰ KIỆN SUBMIT FORM - CẬP NHẬT BIỂU GIÁ MỚI (State Mutation Handler)
    if (formRateConfig) {
        formRateConfig.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn hành vi tải lại trang mặc định của HTML Form

            const targetClassType = selectClassType.value;
            const newPrice = parseInt(numUnitPrice.value, 10);

            // Ràng buộc bảo vệ dữ liệu đầu vào (Business Validation Guard)
            if (isNaN(newPrice) || newPrice < 0) {
                alert('Đơn giá nhập vào phải là số nguyên dương hợp lệ!');
                return;
            }

            // Đọc bảng giá hiện hành, cập nhật đè giá trị mới vào Key tương ứng
            const currentRates = JSON.parse(localStorage.getItem('edufee_global_tuition_rates')) || {};
            currentRates[targetClassType] = newPrice;

            // Đồng bộ ghi đè vào LocalStorage
            localStorage.setItem('edufee_global_tuition_rates', JSON.stringify(currentRates));

            alert(` CẬP NHẬT ĐỊNH MỨC THÀNH CÔNG!\n\nLoại lớp: ${targetClassType}\nĐơn giá mới: ${newPrice.toLocaleString('vi-VN')} đ/Tín chỉ.\n\nBiểu giá mới đã áp dụng trực tiếp cho toàn hệ thống EduFee.`);
            
            resetConfigurationForm(); // Trả Form về trạng thái sạch sẽ ban đầu
            renderRatesTable();       // Vẽ lại bảng dữ liệu với con số mới tinh
        });
    }

    // 6. KHÔI PHỤC TRẠNG THÁI FORM TRỐNG (Form State Reset)
    function resetConfigurationForm() {
        if (txtRateId) txtRateId.value = '';
        if (numUnitPrice) numUnitPrice.value = '';
        if (selectClassType) {
            selectClassType.selectedIndex = 0;
            selectClassType.setAttribute('disabled', 'true'); // Khóa lại chế độ bảo vệ mặc định
        }
        if (formPanelTitle) {
            formPanelTitle.innerHTML = '<i class="ti ti-edit"></i> Cập nhật định mức giá';
        }
    }

    if (btnResetForm) {
        btnResetForm.addEventListener('click', resetConfigurationForm);
    }

    // 7. BOOTSTRAP INITIALIZATION (Kích hoạt luồng chạy)
    initSystemTuitionRates();
    renderRatesTable();
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