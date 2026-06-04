/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC ĐĂNG KÝ HỌC PHẦN & TẠM TÍNH HỌC PHÍ (Student Module)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. ĐỊNH MỨC HỌC PHÍ QUY ĐỊNH (Business Rules Configuration)
    // Đọc đơn giá từ cấu hình PTC, fallback về giá mặc định nếu chưa cấu hình
    function getTuitionRates() {
    const stored = localStorage.getItem('edufee_global_tuition_rates');
    if (stored) {
        return JSON.parse(stored);
    }
    return { 'Lý thuyết': 27000, 'Thực hành': 37000 };
}
const TUITION_RATES = getTuitionRates();

    // 2. KHO DỮ LIỆU GIẢ LẬP DANH MỤC MÔN HỌC (Đồng bộ từ phân hệ PDT)
    const subjectsRepository = [
        { id: 'IT001', name: 'Nhập môn lập trình', credits: 3, type: 'Thực hành', prerequisite: 'none' },
        { id: 'IT007', name: 'Hệ điều hành', credits: 4, type: 'Lý thuyết', prerequisite: 'none' },
        { id: 'SE104', name: 'Nhập môn Công nghệ phần mềm', credits: 3, type: 'Lý thuyết', prerequisite: 'IT001' },
        { id: 'IE105', name: 'An toàn thông tin', credits: 3, type: 'Lý thuyết', prerequisite: 'IT007' }
    ];

    // 3. KHO DỮ LIỆU LỚP HỌC PHẦN ĐANG MỞ TRONG HỌC KỲ (State)
    let availableClasses = [
        { classId: 'SE104.O11', subjectId: 'SE104', maxStudents: 50, currentStudents: 25 },
        { classId: 'IT007.O12', subjectId: 'IT007', maxStudents: 50, currentStudents: 49 }, // Sắp đầy để test case hết chỗ
        { classId: 'IT001.O11', subjectId: 'IT001', maxStudents: 40, currentStudents: 12 },
        { classId: 'IE105.O11', subjectId: 'IE105', maxStudents: 60, currentStudents: 30 }
    ];

    // 4. HỒ SƠ SINH VIÊN ĐANG ĐĂNG NHẬP & DANH SÁCH MÔN ĐÃ TÍCH LŨY (Lịch sử học tập)
    let currentStudent = {
        id: 'SV20260001',
        name: 'Nguyễn Văn An',
        className: 'KHMT2023',
        major: 'Khoa học máy tính',
        // Giả lập: Sinh viên này ĐÃ HỌC ĐẠT môn IT001, nhưng CHƯA HỌC môn IT007
        passedSubjects: ['IT001'] 
    };

    // Giỏ hàng lưu trữ các lớp học phần sinh viên chọn đăng ký trong phiên này
    let registeredClasses = [];

    // 5. KHAI BÁO CÁC THÀNH PHẦN DOM
    const availableClassTableBody = document.getElementById('availableClassTableBody');
    const selectedClassTableBody = document.getElementById('selectedClassTableBody');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const totalCreditsOut = document.getElementById('totalCreditsOut');
    const totalTuitionOut = document.getElementById('totalTuitionOut');
    const searchClassInput = document.getElementById('searchClass');
    const btnSubmitRegistration = document.getElementById('btnSubmitRegistration');

    // 6. KHỞI CHẠY THÔNG TIN SINH VIÊN (Profile Binding)
    function initStudentProfile() {
        // Đồng bộ tên hiển thị ở Sidebar và thanh Profile Bar
        const sidebarName = document.getElementById('sidebar-student-name');
        if (sidebarName) sidebarName.textContent = currentStudent.name;

        document.getElementById('profName').textContent = currentStudent.name;
        document.getElementById('profId').textContent = currentStudent.id;
        document.getElementById('profClass').textContent = currentStudent.className;
        document.getElementById('profMajor').textContent = currentStudent.major;

        // Cập nhật hiển thị đơn giá theo cấu hình PTC
        const rateDisplay = document.getElementById('tuitionRateDisplay');
        if (rateDisplay) {
            const lt = (TUITION_RATES['Lý thuyết'] || 0).toLocaleString('vi-VN');
            const th = (TUITION_RATES['Thực hành'] || 0).toLocaleString('vi-VN');
            rateDisplay.textContent = `Lý thuyết: ${lt}đ/TC | Thực hành: ${th}đ/TC`;
        }
    }

    // 7. HIỂN THỊ DANH SÁCH LỚP HỌC PHẦN ĐANG MỞ (Render Available Classes)
    function renderAvailableClasses(dataToRender) {
        availableClassTableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            availableClassTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="color: #718096; padding: 20px;">
                        Không có lớp học phần nào mở trùng với từ khóa tìm kiếm.
                    </td>
                </tr>`;
            return;
        }

        dataToRender.forEach(item => {
            // Lấy chi tiết thông tin môn học từ Repository mẹ
            const sub = subjectsRepository.find(s => s.id === item.subjectId);
            if (!sub) return;

            // Định dạng hiển thị chuỗi thông tin môn học trước (Prerequisite)
            let prereqBadge = '<span style="color: #a0aec0; font-style: italic;">Không yêu cầu</span>';
            if (sub.prerequisite !== 'none') {
                const preSub = subjectsRepository.find(s => s.id === sub.prerequisite);
                prereqBadge = preSub ? `<span class="badge-prereq" title="Bắt buộc học trước môn này">Môn trước: ${preSub.name} (${sub.prerequisite})</span>` : sub.prerequisite;
            }

            // Kiểm tra xem lớp này sinh viên đã chọn vào giỏ chưa
            const isAdded = registeredClasses.some(c => c.classId === item.classId);
            let actionButton = '';

            if (isAdded) {
                actionButton = `<button class="btn" style="background:#cbd5e0; color:#4a5568; cursor:not-allowed;" disabled>Đã chọn</button>`;
            } else if (item.currentStudents >= item.maxStudents) {
                actionButton = `<button class="btn" style="background:#fed7d7; color:#e53e3e; cursor:not-allowed;" disabled>Hết chỗ</button>`;
            } else {
                actionButton = `<button class="btn btn-primary btn-select-class" data-id="${item.classId}">Chọn lớp</button>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.classId}</strong></td>
                <td>${sub.name} <span style="color:#718096; font-size:12px;">(${item.subjectId})</span></td>
                <td class="text-center">${sub.credits}</td>
                <td>${sub.type}</td>
                <td>${prereqBadge}</td>
                <td class="text-center">
                    <span style="font-family: monospace;">${item.currentStudents} / ${item.maxStudents}</span>
                </td>
                <td class="text-center">${actionButton}</td>
            `;
            availableClassTableBody.appendChild(tr);
        });

        bindSelectButtons(); // Kích hoạt sự kiện bấm chọn lớp
    }

    // 8. THUẬT TOÁN KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT & THÊM VÀO GIỎ HÀNG
    function bindSelectButtons() {
        document.querySelectorAll('.btn-select-class').forEach(button => {
            button.addEventListener('click', function() {
                const targetClassId = this.getAttribute('data-id');
                const classObj = availableClasses.find(c => c.classId === targetClassId);
                if (!classObj) return;

                const subObj = subjectsRepository.find(s => s.id === classObj.subjectId);
                if (!subObj) return;

                // --- BIÊN SÀN KIỂM TRA RÀNG BUỘC (Business Rule Evaluation) ---
                
                // Quy tắc 1: Kiểm tra trùng môn (Sinh viên không được đăng ký 2 lớp của cùng 1 môn học)
                const isSubjectRegistered = registeredClasses.some(c => c.subjectId === classObj.subjectId);
                if (isSubjectRegistered) {
                    alert(`Lỗi đăng ký: Bạn đã chọn một lớp học phần khác của môn [${subObj.name}] trong giỏ hàng rồi!`);
                    return;
                }

                // Quy tắc 2: Thuật toán kiểm tra Môn học trước / Môn tiên quyết (Core Requirement)
                if (subObj.prerequisite !== 'none') {
                    const hasPassedPrereq = currentStudent.passedSubjects.includes(subObj.prerequisite);
                    if (!hasPassedPrereq) {
                        const prereqSubInfo = subjectsRepository.find(s => s.id === subObj.prerequisite);
                        const prereqName = prereqSubInfo ? prereqSubInfo.name : subObj.prerequisite;
                        
                        alert(` CHẶN NGHIỆP VỤ ĐÀO TẠO:\nKhông thể đăng ký môn: ${subObj.name}.\nMôn này yêu cầu môn học trước là [${prereqName} (${subObj.prerequisite})], hiện tại hệ thống ghi nhận bạn chưa hoàn thành hoặc chưa đạt môn điều kiện này!`);
                        return;
                    }
                }

                // Kiểm tra an toàn: Lớp đầy (Mặc dù giao diện đã đổi nút nhưng check lại cho chắc chắn)
                if (classObj.currentStudents >= classObj.maxStudents) {
                    alert('Lỗi: Lớp học phần này vừa mới đầy chỗ, vui lòng chọn lớp khác!');
                    return;
                }

                // --- THỰC HIỆN THÊM VÀO GIỎ & CẬP NHẬT TRẠNG THÁI ---
                // Tăng sĩ số ảo tại client phục vụ UX
                classObj.currentStudents++; 
                
                // Đẩy vào giỏ hàng cấu trúc liên kết đầy đủ thông tin để tính tiền
                registeredClasses.push({
                    classId: classObj.classId,
                    subjectId: classObj.subjectId,
                    name: subObj.name,
                    credits: subObj.credits,
                    type: subObj.type
                });

                alert(`Đã thêm thành công lớp học phần ${classObj.classId} vào danh sách đăng ký.`);
                
                // Làm tươi giao diện hai phân vùng
                filterAndRenderAvailableClasses();
                renderSelectedCart();
            });
        });
    }

    // 9. HIỂN THỊ GIỎ MÔN HỌC & TẠM TÍNH HỌC PHÍ THỜI GIAN THỰC (Live Cart Rendering)
    function renderSelectedCart() {
        selectedClassTableBody.innerHTML = '';
        cartCountBadge.textContent = `Đã chọn: ${registeredClasses.length} môn`;

        if (registeredClasses.length === 0) {
            selectedClassTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="color: #a0aec0; padding: 24px; font-style: italic;">
                        Chưa có môn học nào được đăng ký trong học kỳ này.
                    </td>
                </tr>`;
            totalCreditsOut.textContent = '0';
            totalTuitionOut.textContent = '0 VNĐ';
            return;
        }

        let summaryCredits = 0;
        let summaryTuition = 0;

        registeredClasses.forEach((item, index) => {
            // Tính toán đơn giá học phí dựa trên Loại môn học (Lý thuyết / Thực hành)
            const ratePerCredit = TUITION_RATES[item.type] || 450000;
            const itemTuition = item.credits * ratePerCredit;

            summaryCredits += item.credits;
            summaryTuition += itemTuition;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.classId}</strong></td>
                <td>${item.name}</td>
                <td class="text-center">${item.credits}</td>
                <td>${item.type}</td>
                <td class="text-right" style="font-family: monospace; font-weight: 500;">
                    ${itemTuition.toLocaleString('vi-VN')} đ
                </td>
                <td class="text-center">
                    <button class="btn-action btn-delete btn-remove-cart" data-id="${item.classId}" title="Xóa khỏi giỏ" style="color: #e53e3e;">
                        <i class="ti ti-trash"></i>
                    </button>
                </td>
            `;
            selectedClassTableBody.appendChild(tr);
        });

        // Đổ thông số tổng hợp ra giao diện Live Billing Card
        totalCreditsOut.textContent = summaryCredits;
        totalTuitionOut.textContent = `${summaryTuition.toLocaleString('vi-VN')} VNĐ`;

        bindRemoveButtons(); // Kích hoạt sự kiện gỡ môn khỏi giỏ
    }

    // 10. SỰ KIỆN GỠ MÔN HỌC KHỎI GIỎ (Remove from Cart)
    function bindRemoveButtons() {
        document.querySelectorAll('.btn-remove-cart').forEach(button => {
            button.addEventListener('click', function() {
                const targetClassId = this.getAttribute('data-id');
                
                // Trả lại sĩ số lớp mở
                const classObj = availableClasses.find(c => c.classId === targetClassId);
                if (classObj) classObj.currentStudents--;

                // Lọc bỏ khỏi mảng giỏ hàng
                registeredClasses = registeredClasses.filter(c => c.classId !== targetClassId);

                // Đồng bộ làm tươi lại giao diện
                filterAndRenderAvailableClasses();
                renderSelectedCart();
            });
        });
    }

    // 11. BỘ LỌC TÌM KIẾM LỚP HỌC PHẦN THỜI GIAN THỰC
    function filterAndRenderAvailableClasses() {
        const searchText = searchClassInput.value.toLowerCase().trim();

        const filtered = availableClasses.filter(item => {
            const sub = subjectsRepository.find(s => s.id === item.subjectId);
            const subName = sub ? sub.name.toLowerCase() : '';
            
            return item.classId.toLowerCase().includes(searchText) || 
                   item.subjectId.toLowerCase().includes(searchText) ||
                   subName.includes(searchText);
        });

        renderAvailableClasses(filtered);
    }

    if (searchClassInput) searchClassInput.addEventListener('input', filterAndRenderAvailableClasses);

    // 12. GHI NHẬN ĐĂNG KÝ XUỐNG CƠ SỞ DỮ LIỆU GIẢ LẬP
    if (btnSubmitRegistration) {
        btnSubmitRegistration.addEventListener('click', () => {
            if (registeredClasses.length === 0) {
                alert('Giỏ hàng đăng ký trống! Vui lòng chọn ít nhất một lớp học phần trước khi lưu.');
                return;
            }

            // Đóng băng và lưu kết quả vào localStorage để bàn giao dữ liệu cho phân hệ Phòng Tài chính tính hóa đơn thu tiền
            localStorage.setItem('edufee_registered_cart', JSON.stringify(registeredClasses));
            
            alert(` Chúc mừng sinh viên ${currentStudent.name}!\nHệ thống EduFee đã ghi nhận thành công đơn đăng ký gồm ${registeredClasses.length} môn học phần.\nDữ liệu học phí đã được chuyển tiếp sang phân hệ Phòng Tài chính để kiểm tra thu tiền.`);
            
            // Chuyển hướng sinh viên sang trang Tra cứu Công nợ học phí để kiểm tra kết quả hóa đơn
            window.location.href = 'sv_hocphi.html';
        });
    }

    // 13. BOOTSTRAP INITIALIZATION (Khởi chạy hệ thống)
    initStudentProfile();
    renderAvailableClasses(availableClasses);
    renderSelectedCart();
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