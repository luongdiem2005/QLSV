/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC NGHIỆP VỤ QUẢN LÝ MÔN HỌC (Presentation Logic)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHO DỮ LIỆU GIẢ LẬP BAN ĐẦU (Mock Database State cho Môn Học)
    let subjects = [
        { id: 'IT001', name: 'Nhập môn lập trình', credits: 3, type: 'Thực hành', prerequisite: 'none' },
        { id: 'IT007', name: 'Hệ điều hành', credits: 4, type: 'Lý thuyết', prerequisite: 'none' },
        { id: 'SE104', name: 'Nhập môn Công nghệ phần mềm', credits: 3, type: 'Lý thuyết', prerequisite: 'IT001' }
    ];

    // Trạng thái Form: 'add' (Thêm mới) hoặc 'edit' (Chỉnh sửa)
    let formMode = 'add'; 
    // Lưu lại Mã môn đang được chọn để chỉnh sửa
    let editingSubjectId = null; 

    // 2. KHAI BÁO CÁC PHẦN TỬ DOM
    const subjectTableBody = document.getElementById('subjectTableBody');
    const subjectModal = document.getElementById('subjectModal');
    const subjectForm = document.getElementById('subjectForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Các nút bấm điều khiển Modal
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    
    // Các trường dữ liệu trong Form Modal
    const inputSubjectId = document.getElementById('subjectId');
    const inputSubjectName = document.getElementById('subjectName');
    const inputSubjectCredits = document.getElementById('subjectCredits');
    const inputSubjectType = document.getElementById('subjectType');
    const selectSubjectPrerequisite = document.getElementById('subjectPrerequisite');

    // Các thành phần bộ lọc trên thanh công cụ
    const searchSubjectInput = document.getElementById('searchSubject');
    const filterTypeSelect = document.getElementById('filterType');

    const inputSubjectLessons = document.getElementById('subjectLessons');

    // Hàm tự động tính số tín chỉ
    function autoCalculateCredits() {
        const lessons = parseInt(inputSubjectLessons.value, 10);
        const type = inputSubjectType.value;

        if (!lessons || !type) {
            inputSubjectCredits.value = '';
            return;
        }

        let credits = 0;
        if (type === 'Lý thuyết') {
            credits = Math.floor(lessons / 15);
        } else if (type === 'Thực hành') {
            credits = Math.floor(lessons / 30);
        }

        inputSubjectCredits.value = credits > 0 ? credits : '';
    }

    // Gắn sự kiện tự động tính khi người dùng thay đổi số tiết hoặc loại môn
    if (inputSubjectLessons) inputSubjectLessons.addEventListener('input', autoCalculateCredits);
    if (inputSubjectType) inputSubjectType.addEventListener('change', autoCalculateCredits);

    // 3. HÀM ĐỔ DỮ LIỆU ĐỘNG VÀO DROPDOWN MÔN HỌC TRƯỚC (Dynamic Prerequisite Dropdown)
    function populatePrerequisiteDropdown(excludeSubjectId = null) {
        // Giữ lại option mặc định đầu tiên
        selectSubjectPrerequisite.innerHTML = '<option value="none">-- Không có môn học trước --</option>';
        
        subjects.forEach(subject => {
            // Quy tắc chặn đệ quy: Không cho phép môn học chọn chính nó làm môn học trước
            if (subject.id !== excludeSubjectId) {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = `[${subject.id}] - ${subject.name}`;
                selectSubjectPrerequisite.appendChild(option);
            }
        });
    }

    // 4. HÀM HIỂN THỊ DỮ LIỆU LÊN BẢNG (Render Table Function)
    function renderTable(dataToRender) {
        subjectTableBody.innerHTML = ''; // Xóa sạch bảng cũ trước khi nạp mới

        if (dataToRender.length === 0) {
            subjectTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="color: #718096; padding: 30px;">
                        <i class="ti ti-book-off" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Không tìm thấy môn học nào phù hợp.
                    </td>
                </tr>`;
            updatePaginationInfo(0, 0);
            return;
        }

        dataToRender.forEach((subject, index) => {
            // Tìm tên môn học trước để hiển thị thay vì chỉ hiển thị mỗi mã code thô
            let prerequisiteText = '<span style="color: #a0aec0; font-style: italic;">Không có</span>';
            if (subject.prerequisite !== 'none') {
                const prereqSub = subjects.find(s => s.id === subject.prerequisite);
                prerequisiteText = prereqSub ? `<strong>${prereqSub.name}</strong> (${subject.prerequisite})` : subject.prerequisite;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${subject.id}</strong></td>
                <td>${subject.name}</td>
                <td class="text-center">${subject.credits}</td>
                <td>${subject.type}</td>
                <td>${prerequisiteText}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${subject.id}" title="Sửa môn học">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${subject.id}" title="Xóa môn học">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            subjectTableBody.appendChild(tr);
        });

        updatePaginationInfo(dataToRender.length, subjects.length);
        bindActionButtons(); // Gắn lại sự kiện cho nút Sửa/Xóa động vừa tạo
    }

    // Hàm cập nhật chuỗi thông tin số lượng dưới đáy bảng
    function updatePaginationInfo(currentCount, totalCount) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${currentCount} trên tổng số ${totalCount} môn học`;
        }
    }

    // 5. QUẢN LÝ VÒNG ĐỜI ĐÓNG MỞ MODAL FORM
    function openModal(mode, subjectId = null) {
        formMode = mode;
        subjectModal.classList.remove('hidden');
        
        if (mode === 'add') {
            modalTitle.textContent = 'Thêm môn học mới';
            subjectForm.reset();
            inputSubjectId.removeAttribute('disabled');
            populatePrerequisiteDropdown(); // Nạp đầy đủ danh sách môn học làm điều kiện
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Cập nhật thông tin môn học';
            inputSubjectId.setAttribute('disabled', 'true'); // Khóa mã môn (Khóa chính)
            
            // Cấu hình dropdown môn tiên quyết loại trừ chính môn đang sửa ra
            populatePrerequisiteDropdown(subjectId);
            
            const target = subjects.find(s => s.id === subjectId);
            if (target) {
                editingSubjectId = subjectId;
                inputSubjectId.value = target.id;
                inputSubjectName.value = target.name;
                inputSubjectLessons.value = target.lessons || '';
                inputSubjectCredits.value = target.credits;
                inputSubjectType.value = target.type;
                selectSubjectPrerequisite.value = target.prerequisite;
            }
        }
    }

    function closeModal() {
        subjectModal.classList.add('hidden');
        subjectForm.reset();
        editingSubjectId = null;
    }

    if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openModal('add'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // 6. GẮN SỰ KIỆN NÚT SỬA/XÓA ĐỘNG (Dynamic Event Binding)
    function bindActionButtons() {
        // Sự kiện click nút Sửa
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openModal('edit', id);
            });
        });

        // Sự kiện click nút Xóa
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                
                // Kiểm tra xem môn này có đang bị môn khác chọn làm môn tiên quyết hay không (Chặn lỗi ràng buộc dữ liệu)
                const isBeingUsedAsPrereq = subjects.some(s => s.prerequisite === id);
                if (isBeingUsedAsPrereq) {
                    alert(`Không thể xóa môn học [Mã: ${id}] này!\nMôn này hiện đang được cấu hình làm MÔN HỌC TRƯỚC của một học phần khác trong hệ thống.`);
                    return;
                }

                const target = subjects.find(s => s.id === id);
                if (target) {
                    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn môn học:\n[Mã môn: ${target.id}] - ${target.name}?`);
                    if (confirmDelete) {
                        subjects = subjects.filter(s => s.id !== id);
                        filterAndRenderData();
                    }
                }
            });
        });
    }

    // 7. SỰ KIỆN SUBMIT FORM (Xử lý Lưu: Thêm mới / Cập nhật)
    if (subjectForm) {
        subjectForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Thu thập và làm sạch chuỗi nhập liệu
            const id = inputSubjectId.value.trim().toUpperCase();
            const name = inputSubjectName.value.trim();
            const lessons = parseInt(inputSubjectLessons.value, 10);
            const credits = parseInt(inputSubjectCredits.value, 10);
            const type = inputSubjectType.value;
            const prerequisite = selectSubjectPrerequisite.value;

            // --- KIỂM TRA RÀNG BUỘC NGHIỆP VỤ (Validation Rules) ---
            if (!id || !name || isNaN(credits)) {
                alert('Vui lòng nhập đầy đủ các thông tin có dấu sao bắt buộc (*).');
                return;
            }

            if (!credits || credits <= 0) {
                alert('Số tín chỉ không hợp lệ. Vui lòng kiểm tra lại số tiết và loại môn.');
                return;
            }

            if (credits < 1 || credits > 10) {
                alert('Số tín chỉ quy định của một môn học phải nằm trong khoảng từ 1 đến 10 tín chỉ.');
                inputSubjectCredits.focus();
                return;
            }

            if (formMode === 'add') {
                // Kiểm tra trùng khóa chính (Mã môn)
                const isDuplicate = subjects.some(s => s.id === id);
                if (isDuplicate) {
                    alert(`Lỗi: Mã môn học "${id}" đã tồn tại trong danh mục đào tạo!`);
                    inputSubjectId.focus();
                    return;
                }

                subjects.push({ id, name, lessons, credits, type, prerequisite });
                alert('Thêm môn học vào danh mục đào tạo thành công!');
            } else if (formMode === 'edit') {
                const index = subjects.findIndex(s => s.id === editingSubjectId);
                if (index !== -1) {
                    subjects[index] = { id: editingSubjectId, name, credits, type, prerequisite };
                    alert('Cập nhật dữ liệu môn học thành công!');
                }
            }

            closeModal();
            filterAndRenderData(); // Làm tươi lại bảng hiển thị
        });
    }

    // 8. BỘ LỌC TÌM KIẾM ĐA TIÊU CHÍ (Multi-Filter kết hợp thời gian thực)
    function filterAndRenderData() {
        const searchText = searchSubjectInput.value.toLowerCase().trim();
        const selectedType = filterTypeSelect.value;

        const filteredData = subjects.filter(subject => {
            const matchesSearch = subject.id.toLowerCase().includes(searchText) || 
                                  subject.name.toLowerCase().includes(searchText);
            const matchesType = selectedType === "" || subject.type === selectedType;

            return matchesSearch && matchesType;
        });

        renderTable(filteredData);
    }

    if (searchSubjectInput) searchSubjectInput.addEventListener('input', filterAndRenderData);
    if (filterTypeSelect) filterTypeSelect.addEventListener('change', filterAndRenderData);

    // 9. INITIAL BOOT (Khởi chạy hệ thống lần đầu)
    renderTable(subjects);
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