/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC NGHIỆP VỤ QUẢN LÝ SINH VIÊN (Presentation Logic)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHO DỮ LIỆU GIẢ LẬP BAN ĐẦU (Mock Database State)
    let students = [
        { id: '23520001', name: 'Nguyễn Văn A', dob: '2005-04-15', gender: 'Nam', class: 'CNNB2023', major: 'Công nghệ thông tin Việt-Nhật' },
        { id: '22520002', name: 'Trần Thị B', dob: '2004-08-22', gender: 'Nữ', class: 'KTPM2022', major: 'Kỹ thuật phần mềm' },
        { id: '25520003', name: 'Lê Hoàng C', dob: '2007-11-02', gender: 'Nam', class: 'KHMT2025', major: 'Khoa học máy tính' }
    ];

    // Trạng thái hiện tại của Form: 'add' (Thêm mới) hoặc 'edit' (Chỉnh sửa)
    let formMode = 'add'; 
    // Lưu lại MSSV đang được chọn để chỉnh sửa
    let editingStudentId = null; 

    // 2. KHAI BÁO CÁC PHẦN TỬ DOM CẦN THAO TÁC
    const studentTableBody = document.getElementById('studentTableBody');
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Các nút bấm điều khiển Modal
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    
    // Các ô dữ liệu trong Form
    const inputStudentId = document.getElementById('studentId');
    const inputStudentName = document.getElementById('studentName');
    const inputStudentDob = document.getElementById('studentDob');
    const inputStudentGender = document.getElementById('studentGender');
    const inputStudentClass = document.getElementById('studentClass');
    const inputStudentMajor = document.getElementById('studentMajor');

    // Các thành phần bộ lọc (Filters)
    const searchStudentInput = document.getElementById('searchStudent');
    const filterClassSelect = document.getElementById('filterClass');

    // 3. HÀM HIỂN THỊ DỮ LIỆU LÊN BẢNG (Render Data Function)
    function renderTable(dataToRender) {
        studentTableBody.innerHTML = ''; // Xóa sạch các hàng cũ trước khi nạp mới

        if (dataToRender.length === 0) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="color: #718096; padding: 30px;">
                        <i class="ti ti-database-off" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                        Không tìm thấy sinh viên nào phù hợp.
                    </td>
                </tr>`;
            updatePaginationInfo(0, 0);
            return;
        }

        dataToRender.forEach((student, index) => {
            // Định dạng lại ngày sinh từ YYYY-MM-DD sang DD/MM/YYYY hiển thị thân thiện
            const formattedDob = student.dob.split('-').reverse().join('/');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${student.id}</strong></td>
                <td>${student.name}</td>
                <td>${formattedDob}</td>
                <td>${student.gender}</td>
                <td>${student.class}</td>
                <td>${student.major}</td>
                <td class="text-center">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${student.id}" title="Sửa thông tin">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${student.id}" title="Xóa hồ sơ">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            studentTableBody.appendChild(tr);
        });

        updatePaginationInfo(dataToRender.length, students.length);
        bindActionButtons(); // Gắn lại sự kiện cho các nút Sửa/Xóa vừa được tạo mới
    }

    // Hàm cập nhật dòng thông số phân trang phía dưới bảng
    function updatePaginationInfo(currentCount, totalCount) {
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${currentCount} trên tổng số ${totalCount} sinh viên`;
        }
    }

    // 4. ĐIỀU KHIỂN ĐÓNG MỞ MODAL DIALOG
    function openModal(mode, studentId = null) {
        formMode = mode;
        studentModal.classList.remove('hidden');
        
        if (mode === 'add') {
            modalTitle.textContent = 'Thêm sinh viên mới';
            studentForm.reset(); // Xóa sạch dữ liệu cũ trong form ô nhập
            inputStudentId.removeAttribute('disabled'); // Cho phép gõ MSSV mới
        } else if (mode === 'edit') {
            modalTitle.textContent = 'Cập nhật thông tin sinh viên';
            inputStudentId.setAttribute('disabled', 'true'); // Khóa MSSV (Khóa chính không được sửa)
            
            // Tìm kiếm đối tượng cần sửa và đổ dữ liệu lên form (Data Binding)
            const target = students.find(s => s.id === studentId);
            if (target) {
                editingStudentId = studentId;
                inputStudentId.value = target.id;
                inputStudentName.value = target.name;
                inputStudentDob.value = target.dob;
                inputStudentGender.value = target.gender;
                inputStudentClass.value = target.class;
                inputStudentMajor.value = target.major;
            }
        }
    }

    function closeModal() {
        studentModal.classList.add('hidden');
        studentForm.reset();
        editingStudentId = null;
    }

    // Gắn sự kiện đóng mở cho hệ thống nút chức năng Modal
    if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openModal('add'));
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // 5. GẮN SỰ KIỆN CHO NÚT SỬA VÀ XÓA ĐỘNG (Dynamic Event Binding)
    function bindActionButtons() {
        // Xử lý sự kiện nút Sửa (Edit)
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                openModal('edit', id);
            });
        });

        // Xử lý sự kiện nút Xóa (Delete)
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const target = students.find(s => s.id === id);
                
                if (target) {
                    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ sinh viên:\n[MSSV: ${target.id}] - ${target.name}?`);
                    
                    if (confirmDelete) {
                        // Thực hiện lọc loại bỏ phần tử ra khỏi mảng dữ liệu gốc
                        students = students.filter(s => s.id !== id);
                        filterAndRenderData(); // Tải lại bảng ngay lập tức
                    }
                }
            });
        });
    }

    // 6. SỰ KIỆN SUBMIT FORM (Xử lý Lưu dữ liệu: Thêm mới / Cập nhật)
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Chặn hành vi tải lại trang mặc định

            // Thu thập dữ liệu từ các trường đầu vào
            const id = inputStudentId.value.trim();
            const name = inputStudentName.value.trim();
            const dob = inputStudentDob.value;
            const gender = inputStudentGender.value;
            const sClass = inputStudentClass.value.trim().toUpperCase();
            const major = inputStudentMajor.value;

            // --- BƯỚC VALIDATION: Kiểm tra tính toàn vẹn dữ liệu tại Front-End ---
            if (!id || !name || !dob || !sClass) {
                alert('Vui lòng điền đầy đủ các thông tin có dấu sao bắt buộc (*).');
                return;
            }

            if (formMode === 'add') {
                // Kiểm tra trùng mã khóa chính (MSSV không được trùng lặp trong hệ thống)
                const isDuplicate = students.some(s => s.id === id);
                if (isDuplicate) {
                    alert(`Lỗi: Mã số sinh viên ${id} đã tồn tại trong hệ thống!`);
                    inputStudentId.focus();
                    return;
                }

                // Thực hiện thêm mới đối tượng vào mảng
                students.push({ id, name, dob, gender, class: sClass, major });
                alert('Thêm mới hồ sơ sinh viên thành công!');
            } else if (formMode === 'edit') {
                // Tìm vị trí của phần tử và thực hiện cập nhật đè giá trị mới
                const index = students.findIndex(s => s.id === editingStudentId);
                if (index !== -1) {
                    students[index] = { id: editingStudentId, name, dob, gender, class: sClass, major };
                    alert('Cập nhật thông tin sinh viên thành công!');
                }
            }

            closeModal(); // Đóng form nhập liệu
            filterAndRenderData(); // Làm tươi (refresh) danh bạ hiển thị dữ liệu
        });
    }

    // 7. MULTI-FILTER LOGIC (Bộ lọc kết hợp đa điều kiện: Tìm kiếm + Thao tác chọn)
    function filterAndRenderData() {
        const searchText = searchStudentInput.value.toLowerCase().trim();
        const selectedClass = filterClassSelect.value;

        // Áp dụng thuật toán lọc mảng đa tiêu chí song song
        const filteredData = students.filter(student => {
            // Tiêu chí 1: Tìm kiếm theo Tên hoặc MSSV
            const matchesSearch = student.name.toLowerCase().includes(searchText) || 
                                  student.id.includes(searchText);
            
            // Tiêu chí 2: Lọc theo lớp sinh hoạt
            const matchesClass = selectedClass === "" || student.class === selectedClass;

            return matchesSearch && matchesClass;
        });

        renderTable(filteredData);
    }

    // Gắn sự kiện lắng nghe tương tác người dùng trên thanh bộ lọc thanh công cụ
    if (searchStudentInput) searchStudentInput.addEventListener('input', filterAndRenderData);
    if (filterClassSelect) filterClassSelect.addEventListener('change', filterAndRenderData);

    // 8. KHỞI CHẠY LẦN ĐẦU TIÊN (Initial Boot)
    renderTable(students);
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