/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC NGHIỆP VỤ QUẢN LÝ NGÀNH HỌC (Presentation Logic)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHO DỮ LIỆU GIẢ LẬP BAN ĐẦU (Mock Database State cho Ngành Học)
    let majors = [
        { id: 'CNTT', name: 'Công nghệ thông tin', department: 'Khoa Máy tính', credits: 135 },
        { id: 'KTPM', name: 'Kỹ thuật phần mềm', department: 'Khoa Công nghệ Phần mềm', credits: 140 },
        { id: 'KHMT', name: 'Khoa học máy tính', department: 'Khoa Khoa học Máy tính', credits: 138 }
    ];

    // Trạng thái Form: 'add' (Thêm mới) hoặc 'edit' (Chỉnh sửa)
    let formMode = 'add'; 
    // Lưu lại Mã ngành đang được chọn để chỉnh sửa
    let editingMajorId = null; 

    // 2. KHAI BÁO CÁC PHẦN TỬ DOM
    const majorTableBody = document.getElementById('majorTableBody');
    const majorModal = document.getElementById('majorModal');
    const majorForm = document.getElementById('majorForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Các nút bấm điều khiển Modal
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    
    // Các trường dữ liệu trong Form Modal
    const inputMajorId = document.getElementById('majorId');
    const inputMajorName = document.getElementById('majorName');
    const inputMajorDepartment = document.getElementById('majorDepartment');
    const inputMajorCredits = document.getElementById('majorCredits');

    // Thành phần thanh bộ lọc (Filter)
    const searchMajorInput = document.getElementById('searchMajor');

    // 3. HÀM HIỂN THỊ DỮ LIỆU LÊN BẢNG (Render Table Function)
    function renderTable(dataToRender) {
        majorTableBody.innerHTML = ''; // Xóa dữ liệu cũ trước khi nạp mới

        if (dataToRender.length === 0) {
            majorTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="color: #718096; padding: 30px;">
                        <i class="ti ti-folder-off" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Không tìm thấy ngành học nào phù hợp.
                    </td>
                </tr>`;
            updatePaginationInfo(0, 0);
            return;
        }

        dataToRender.forEach((major, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${major.id}</strong></td>
                <td>${major.name}</td>
                <td>${major.department}</td>
                <td class="text-center">${major.credits}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${major.id}" title="Sửa thông tin">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${major.id}" title="Xóa ngành học">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            majorTableBody.appendChild(tr);
        });

        updatePaginationInfo(dataToRender.length, majors.length);
        bindActionButtons(); // Tái kích hoạt sự kiện cho nút Sửa/Xóa động
    }

    // Cập nhật thông số thống kê số lượng ở cuối bảng
    function updatePaginationInfo(currentCount, totalCount) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${currentCount} trên tổng số ${totalCount} danh mục ngành học`;
        }
    }

    // 4. QUẢN LÝ VÒNG ĐỜI ĐÓNG MỞ MODAL DIALOG
    function openModal(mode, majorId = null) {
        formMode = mode;
        majorModal.classList.remove('hidden');
        
        if (mode === 'add') {
            modalTitle.textContent = 'Thêm ngành học mới';
            majorForm.reset();
            inputMajorId.removeAttribute('disabled'); // Cho phép gõ mã ngành mới
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Cập nhật thông tin ngành học';
            inputMajorId.setAttribute('disabled', 'true'); // Khóa mã ngành (Khóa chính)
            
            // Tìm ngành cần sửa và điền dữ liệu (Data Binding)
            const target = majors.find(m => m.id === majorId);
            if (target) {
                editingMajorId = majorId;
                inputMajorId.value = target.id;
                inputMajorName.value = target.name;
                inputMajorDepartment.value = target.department;
                inputMajorCredits.value = target.credits;
            }
        }
    }

    function closeModal() {
        majorModal.classList.add('hidden');
        majorForm.reset();
        editingMajorId = null;
    }

    if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openModal('add'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // 5. GẮN SỰ KIỆN NÚT SỬA/XÓA ĐỘNG (Dynamic Event Binding)
    function bindActionButtons() {
        // Sự kiện nút Sửa
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openModal('edit', id);
            });
        });

        // Sự kiện nút Xóa
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const target = majors.find(m => m.id === id);
                
                if (target) {
                    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ngành học:\n[Mã ngành: ${target.id}] - ${target.name}?\nHành động này có thể ảnh hưởng đến dữ liệu lớp và sinh viên thuộc ngành này!`);
                    
                    if (confirmDelete) {
                        majors = majors.filter(m => m.id !== id);
                        filterAndRenderData();
                    }
                }
            });
        });
    }

    // 6. SỰ KIỆN SUBMIT FORM (Xử lý Thêm mới / Cập nhật)
    if (majorForm) {
        majorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Thu thập dữ liệu và xử lý khoảng trắng
            const id = inputMajorId.value.trim().toUpperCase();
            const name = inputMajorName.value.trim();
            const department = inputMajorDepartment.value.trim();
            const credits = parseInt(inputMajorCredits.value, 10);

            // --- VALIDATION RULES (Kiểm tra nghiệp vụ tại Client) ---
            if (!id || !name || !department || isNaN(credits)) {
                alert('Vui lòng điền đầy đủ tất cả thông tin có dấu sao bắt buộc (*).');
                return;
            }

            if (credits <= 0 || credits > 250) {
                alert('Số tín chỉ tối thiểu hợp lệ phải nằm trong khoảng từ 1 đến 250 tín chỉ.');
                inputMajorCredits.focus();
                return;
            }

            if (formMode === 'add') {
                // Kiểm tra trùng khóa chính (Mã ngành)
                const isDuplicate = majors.some(m => m.id === id);
                if (isDuplicate) {
                    alert(`Lỗi: Mã ngành "${id}" đã tồn tại trong danh mục hệ thống!`);
                    inputMajorId.focus();
                    return;
                }

                // Thêm phần tử mới
                majors.push({ id, name, department, credits });
                alert('Thêm mới ngành học thành công!');
            } else if (formMode === 'edit') {
                // Cập nhật giá trị đè lên phần tử cũ
                const index = majors.findIndex(m => m.id === editingMajorId);
                if (index !== -1) {
                    majors[index] = { id: editingMajorId, name, department, credits };
                    alert('Cập nhật thông tin ngành học thành công!');
                }
            }

            closeModal();
            filterAndRenderData(); // Làm tươi (refresh) giao diện bảng
        });
    }

    // 7. REAL-TIME FILTER (Tìm kiếm thời gian thực theo Mã hoặc Tên ngành)
    function filterAndRenderData() {
        const searchText = searchMajorInput.value.toLowerCase().trim();

        const filteredData = majors.filter(major => {
            return major.id.toLowerCase().includes(searchText) || 
                   major.name.toLowerCase().includes(searchText) ||
                   major.department.toLowerCase().includes(searchText);
        });

        renderTable(filteredData);
    }

    if (searchMajorInput) searchMajorInput.addEventListener('input', filterAndRenderData);

    // 8. KHỞI CHẠY LẦN ĐẦU (Initial Boot)
    renderTable(majors);
});
// Thêm đoạn này vào hàm khởi chạy DOMContentLoaded của các trang để nạp Footer tự động
const footerContainer = document.getElementById('shared-footer-container');
if (footerContainer) {
    fetch('../../components/footer.html')
        .then(response => response.text())
        .then(data => {
            footerContainer.innerHTML = data;
            // Thực thi lại đoạn script tính năm bên trong file footer vừa nạp
            const script = footerContainer.querySelector('script');
            if (script) eval(script.innerHTML);
        });
}