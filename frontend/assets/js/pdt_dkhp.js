/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC NGHIỆP VỤ MỞ LỚP ĐĂNG KÝ HỌC PHẦN (Presentation Logic)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHO DỮ LIỆU GIẢ LẬP DANH MỤC MÔN HỌC (Đọc từ phân hệ Môn học sang để liên kết)
    const mockSubjectsRepository = [
        { id: 'IT001', name: 'Nhập môn lập trình', credits: 3, type: 'Thực hành' },
        { id: 'IT007', name: 'Hệ điều hành', credits: 4, type: 'Lý thuyết' },
        { id: 'SE104', name: 'Nhập môn Công nghệ phần mềm', credits: 3, type: 'Lý thuyết' },
        { id: 'IE105', name: 'An toàn thông tin', credits: 3, type: 'Lý thuyết' }
    ];

    // 2. KHO DỮ LIỆU GIẢ LẬP DANH SÁCH LỚP HỌC PHẦN ĐANG MỞ (State Management)
    let openedClasses = [
        { classId: 'SE104.O11', year: '2026-2027', semester: 'HK1', subjectId: 'SE104', maxStudents: 50, currentStudents: 25 },
        { classId: 'IT007.O12', year: '2026-2027', semester: 'HK1', subjectId: 'IT007', maxStudents: 50, currentStudents: 50 },
        { classId: 'IT001.O11', year: '2025-2026', semester: 'HK2', subjectId: 'IT001', maxStudents: 40, currentStudents: 40 }
    ];

    // Điều hướng trạng thái Form: 'add' hoặc 'edit'
    let formMode = 'add';
    let editingClassId = null;

    // 3. KHAI BÁO CÁC PHẦN TỬ DOM
    const classTableBody = document.getElementById('classTableBody');
    const classModal = document.getElementById('classModal');
    const classForm = document.getElementById('classForm');
    const modalTitle = document.getElementById('modalTitle');

    // Nút điều khiển Modal
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');

    // Các trường dữ liệu trong Form Modal
    const inputClassYear = document.getElementById('classYear');
    const inputClassSemester = document.getElementById('classSemester');
    const selectClassSubjectId = document.getElementById('classSubjectId');
    const inputClassId = document.getElementById('classId');
    const inputClassMaxStudents = document.getElementById('classMaxStudents');

    // Các thành phần bộ lọc trên Toolbar
    const searchClassSubjectInput = document.getElementById('searchClassSubject');
    const filterYearSelect = document.getElementById('filterYear');
    const filterSemesterSelect = document.getElementById('filterSemester');

    // 4. HÀM NẠP DANH SÁCH MÔN HỌC VÀO FORM DROPDOWN (Data Binding liên kết môn học)
    function populateSubjectDropdown() {
        if (!selectClassSubjectId) return;
        selectClassSubjectId.innerHTML = '<option value="">-- Chọn môn học cần mở lớp --</option>';
        
        mockSubjectsRepository.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = `[${subject.id}] - ${subject.name} (${subject.credits} TC - ${subject.type})`;
            selectClassSubjectId.appendChild(option);
        });
    }

    // Tự động gợi ý sinh mã lớp theo quy tắc nghiệp vụ khi người dùng chọn môn học
    if (selectClassSubjectId) {
        selectClassSubjectId.addEventListener('change', function() {
            if (formMode === 'add' && this.value) {
                // Tạo hậu tố ngẫu nhiên hoặc mặc định cho mã lớp học phần (.O11)
                inputClassId.value = `${this.value}.O11`;
            }
        });
    }

    // 5. HÀM HIỂN THỊ DỮ LIỆU LÊN BẢNG (Render Data Function)
    function renderTable(dataToRender) {
        classTableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            classTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="color: #718096; padding: 30px;">
                        <i class="ti ti-clipboard-off" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Không có lớp học phần nào mở trùng khớp điều kiện lọc.
                    </td>
                </tr>`;
            updatePaginationInfo(0, 0);
            return;
        }

        dataToRender.forEach((item, index) => {
            // Truy vết đối chiếu lấy thông tin chi tiết môn học từ kho lưu trữ nền
            const subjectInfo = mockSubjectsRepository.find(s => s.id === item.subjectId);
            const subjectName = subjectInfo ? subjectInfo.name : 'Môn học không tồn tại';
            const subjectCredits = subjectInfo ? subjectInfo.credits : 0;

            // Tính toán huy hiệu trạng thái (Status Badges) dựa trên sĩ số thực tế
            let statusBadge = '';
            if (item.currentStudents >= item.maxStudents) {
                statusBadge = '<span class="status-indicator current" style="background-color: #feebc8; color: #c05621; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Hết chỗ</span>';
            } else {
                statusBadge = '<span class="status-indicator active" style="background-color: #e6fffa; color: #234e52; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">Đang mở ĐK</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.classId}</strong></td>
                <td>${item.semester} (${item.year.substring(2)})</td>
                <td>${subjectName} <span style="color:#718096; font-size:12px;">(${item.subjectId})</span></td>
                <td class="text-center">${subjectCredits}</td>
                <td class="text-center">
                    <span class="badge-count" style="font-family: monospace;"><strong>${item.currentStudents}</strong> / ${item.maxStudents}</span>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${item.classId}" title="Sửa cấu hình lớp">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${item.classId}" title="Hủy mở lớp">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            classTableBody.appendChild(tr);
        });

        updatePaginationInfo(dataToRender.length, openedClasses.length);
        bindActionButtons(); // Tái gắn kết các sự kiện nút bấm cho các hàng mới
    }

    function updatePaginationInfo(currentCount, totalCount) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${currentCount} trên tổng số ${totalCount} lớp học phần được mở`;
        }
    }

    // 6. QUẢN LÝ VÒNG ĐỜI ĐÓNG MỞ MODAL DIALOG
    function openModal(mode, classId = null) {
        formMode = mode;
        classModal.classList.remove('hidden');
        populateSubjectDropdown(); // Cập nhật danh sách môn học mới nhất vào ô chọn
        
        if (mode === 'add') {
            modalTitle.textContent = 'Mở lớp học phần mới';
            classForm.reset();
            inputClassId.removeAttribute('disabled');
            selectClassSubjectId.removeAttribute('disabled');
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Cập nhật cấu hình lớp học phần';
            inputClassId.setAttribute('disabled', 'true'); // Khóa mã lớp (Khóa chính)
            selectClassSubjectId.setAttribute('disabled', 'true'); // Khóa môn học cố định
            
            const target = openedClasses.find(c => c.classId === classId);
            if (target) {
                editingClassId = classId;
                inputClassYear.value = target.year;
                inputClassSemester.value = target.semester;
                selectClassSubjectId.value = target.subjectId;
                inputClassId.value = target.classId;
                inputClassMaxStudents.value = target.maxStudents;
            }
        }
    }

    function closeModal() {
        classModal.classList.add('hidden');
        classForm.reset();
        editingClassId = null;
    }

    if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openModal('add'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // 7. GẮN SỰ KIỆN NÚT THAO TÁC ĐỘNG (Dynamic Event Binding)
    function bindActionButtons() {
        // Xử lý sự kiện Sửa lớp
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openModal('edit', id);
            });
        });

        // Xử lý sự kiện Hủy mở lớp (Xóa)
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const target = openedClasses.find(c => c.classId === id);
                
                if (target) {
                    // Kiểm tra nghiệp vụ: Nếu đã có sinh viên đăng ký, cấm xóa để bảo vệ hệ thống
                    if (target.currentStudents > 0) {
                        alert(`Lỗi nghiêm trọng: Không thể hủy lớp học phần [Mã: ${id}]!\nLớp học này hiện đã có ${target.currentStudents} sinh viên bấm chọn đăng ký thành công. Việc hủy lớp sẽ làm vỡ dữ liệu thời khóa biểu.`);
                        return;
                    }

                    const confirmDelete = confirm(`Bạn có chắc chắn muốn hủy quyết định mở lớp học phần:\n[Mã lớp: ${target.classId}]?`);
                    if (confirmDelete) {
                        openedClasses = openedClasses.filter(c => c.classId !== id);
                        filterAndRenderData();
                    }
                }
            });
        });
    }

    // 8. SỰ KIỆN SUBMIT FORM (Xử lý Lưu dữ liệu: Mở mới / Chỉnh sửa)
    if (classForm) {
        classForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Thu thập dữ liệu form
            const year = inputClassYear.value;
            const semester = inputClassSemester.value;
            const subjectId = selectClassSubjectId.value;
            const classId = inputClassId.value.trim().toUpperCase();
            const maxStudents = parseInt(inputClassMaxStudents.value, 10);

            // --- KIỂM TRA RÀNG BUỘC PHẦN MỀM (Validation Rules) ---
            if (!subjectId || !classId || isNaN(maxStudents)) {
                alert('Vui lòng nhập đầy đủ các thông tin có dấu sao bắt buộc (*).');
                return;
            }

            if (maxStudents < 10 || maxStudents > 150) {
                alert('Sĩ số giới hạn của một lớp học phần phải nằm trong khoảng hợp lệ từ 10 đến 150 sinh viên.');
                inputClassMaxStudents.focus();
                return;
            }

            if (formMode === 'add') {
                // Kiểm tra trùng mã lớp học phần (Khóa chính hệ thống)
                const isDuplicate = openedClasses.some(c => c.classId === classId);
                if (isDuplicate) {
                    alert(`Lỗi: Mã lớp học phần "${classId}" đã tồn tại trong học kỳ này!`);
                    inputClassId.focus();
                    return;
                }

                // Thêm bản ghi mới với số lượng sinh viên đăng ký ban đầu mặc định bằng 0
                openedClasses.push({ classId, year, semester, subjectId, maxStudents, currentStudents: 0 });
                alert('Quyết định ban hành mở lớp học phần thành công!');
            } else if (formMode === 'edit') {
                const index = openedClasses.findIndex(c => c.classId === editingClassId);
                if (index !== -1) {
                    // Kiểm tra nếu sĩ số tối đa mới nhỏ hơn số sinh viên hiện tại đã đăng ký thực tế
                    if (maxStudents < openedClasses[index].currentStudents) {
                        alert(`Lỗi hạ sĩ số: Không thể đặt sĩ số tối đa là ${maxStudents} vì hiện tại đã có ${openedClasses[index].currentStudents} sinh viên đăng ký lớp này!`);
                        return;
                    }

                    openedClasses[index].year = year;
                    openedClasses[index].semester = semester;
                    openedClasses[index].maxStudents = maxStudents;
                    alert('Cập nhật cấu hình lớp học phần thành công!');
                }
            }

            closeModal();
            filterAndRenderData(); // Làm tươi (refresh) lưới hiển thị dữ liệu
        });
    }

    // 9. BỘ LỌC ĐA TIÊU CHÍ KẾT HỢP (Năm học + Học kỳ + Từ khóa)
    function filterAndRenderData() {
        const searchText = searchClassSubjectInput.value.toLowerCase().trim();
        const selectedYear = filterYearSelect.value;
        const selectedSemester = filterSemesterSelect.value;

        const filteredData = openedClasses.filter(item => {
            // Tiêu chí 1: Tìm kiếm theo mã lớp hoặc mã môn học
            const matchesSearch = item.classId.toLowerCase().includes(searchText) || 
                                  item.subjectId.toLowerCase().includes(searchText);
            // Tiêu chí 2: Lọc theo năm học cố định
            const matchesYear = item.year === selectedYear;
            // Tiêu chí 3: Lọc theo học kỳ chọn lựa (Nếu để trống thì lấy tất cả học kỳ của năm đó)
            const matchesSemester = selectedSemester === "" || item.semester === selectedSemester;

            return matchesSearch && matchesYear && matchesSemester;
        });

        renderTable(filteredData);
    }

    // Gắn sự kiện lắng nghe tương tác trên thanh Toolbar công cụ
    if (searchClassSubjectInput) searchClassSubjectInput.addEventListener('input', filterAndRenderData);
    if (filterYearSelect) filterYearSelect.addEventListener('change', filterAndRenderData);
    if (filterSemesterSelect) filterSemesterSelect.addEventListener('change', filterAndRenderData);

    // 10. KHỞI CHẠY HỆ THỐNG LẦN ĐẦU (Initial Boot)
    filterAndRenderData(); // Chạy bộ lọc lần đầu để nạp dữ liệu theo năm học đang chọn mặc định
});