/* ============================================================================
 *  EduFee - QUẢN LÝ SINH VIÊN (bản nối API thật, thay cho mảng mock)
 *  Thay thế frontend/js/pdt_sv.js cũ. Cần nạp api.js + auth-guard.js TRƯỚC.
 *
 *  THAY ĐỔI HTML CẦN LÀM (xem INTEGRATION_GUIDE.md):
 *   - Đổi  <input id="studentMajor">  thành  <select id="studentMajor"></select>
 *     (JS sẽ tự đổ danh sách ngành từ /api/nganh)
 *   - Cột "Lớp" trong bảng sẽ hiển thị MÃ NGÀNH; cột "Ngành" hiển thị TÊN NGÀNH.
 *     (DB không có "lớp sinh hoạt"; nếu muốn giữ thì phải thêm cột Lop ở backend)
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Chặn truy cập: chỉ Phòng Đào tạo
  await EduFeeGuard.protect(['PDT']);

  // ----- DOM -----
  const studentTableBody = document.getElementById('studentTableBody');
  const studentModal = document.getElementById('studentModal');
  const studentForm = document.getElementById('studentForm');
  const modalTitle = document.getElementById('modalTitle');
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');

  const inputStudentId = document.getElementById('studentId');
  const inputStudentName = document.getElementById('studentName');
  const inputStudentDob = document.getElementById('studentDob');
  const inputStudentGender = document.getElementById('studentGender');
  const inputStudentClass = document.getElementById('studentClass');   // có thể đã bỏ -> null
  const inputStudentMajor = document.getElementById('studentMajor');   // nên là <select>

  const searchStudentInput = document.getElementById('searchStudent');
  const filterClassSelect = document.getElementById('filterClass');    // dùng lọc theo ngành

  let formMode = 'add';
  let editingStudentId = null;
  let nganhList = [];

  // ----- Nạp danh sách ngành để đổ dropdown + bộ lọc -----
  async function loadNganh() {
    try {
      nganhList = await EduFeeAPI.get('/nganh');
    } catch (e) {
      nganhList = [];
      console.error(e);
    }
    if (inputStudentMajor && inputStudentMajor.tagName === 'SELECT') {
      inputStudentMajor.innerHTML =
        '<option value="">-- Chọn ngành --</option>' +
        nganhList.map((n) => `<option value="${n.MaNganh}">${n.TenNganh}</option>`).join('');
    }
    if (filterClassSelect) {
      filterClassSelect.innerHTML =
        '<option value="">-- Tất cả ngành --</option>' +
        nganhList.map((n) => `<option value="${n.MaNganh}">${n.TenNganh}</option>`).join('');
    }
  }

  // ----- Render bảng -----
  function formatDob(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('vi-VN');
  }

  function renderTable(items) {
    studentTableBody.innerHTML = '';
    if (!items.length) {
      studentTableBody.innerHTML = `
        <tr><td colspan="8" class="text-center" style="color:#718096;padding:30px;">
          <i class="ti ti-database-off" style="font-size:24px;display:block;margin-bottom:8px;"></i>
          Không tìm thấy sinh viên nào phù hợp.
        </td></tr>`;
      updatePaginationInfo(0);
      return;
    }
    items.forEach((sv, index) => {
      const tenNganh = sv.nganh ? sv.nganh.TenNganh : '—';
      const maNganh = sv.nganh ? sv.nganh.MaNganh : '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${sv.MaSoSinhVien}</strong></td>
        <td>${sv.HoTen}</td>
        <td>${formatDob(sv.NgaySinh)}</td>
        <td>${sv.GioiTinh || ''}</td>
        <td>${maNganh}</td>
        <td>${tenNganh}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${sv.MaSoSinhVien}" title="Sửa"><i class="ti ti-edit"></i></button>
            <button class="btn-action btn-delete" data-id="${sv.MaSoSinhVien}" title="Xóa"><i class="ti ti-trash"></i></button>
          </div>
        </td>`;
      studentTableBody.appendChild(tr);
    });
    updatePaginationInfo(items.length);
    bindActionButtons();
  }

  function updatePaginationInfo(count) {
    const el = document.querySelector('.pagination-info');
    if (el) el.textContent = `Hiển thị ${count} sinh viên`;
  }

  // ----- Tải dữ liệu từ API (server lo lọc) -----
  async function loadStudents() {
    const params = new URLSearchParams();
    if (searchStudentInput && searchStudentInput.value.trim()) params.set('search', searchStudentInput.value.trim());
    if (filterClassSelect && filterClassSelect.value) params.set('maNganh', filterClassSelect.value);
    params.set('limit', '100');
    try {
      const data = await EduFeeAPI.get('/students?' + params.toString());
      renderTable(data.items);
    } catch (e) {
      alert(e.message);
    }
  }

  // ----- Modal -----
  function openModal(mode, mssv = null) {
    formMode = mode;
    studentModal.classList.remove('hidden');
    if (mode === 'add') {
      modalTitle.textContent = 'Thêm sinh viên mới';
      studentForm.reset();
      inputStudentId.removeAttribute('disabled');
    } else {
      modalTitle.textContent = 'Cập nhật thông tin sinh viên';
      inputStudentId.setAttribute('disabled', 'true');
      loadOne(mssv);
    }
  }
  async function loadOne(mssv) {
    try {
      const sv = await EduFeeAPI.get('/students/' + mssv);
      editingStudentId = mssv;
      inputStudentId.value = sv.MaSoSinhVien;
      inputStudentName.value = sv.HoTen;
      inputStudentDob.value = sv.NgaySinh ? sv.NgaySinh.substring(0, 10) : '';
      if (inputStudentGender) inputStudentGender.value = sv.GioiTinh || '';
      if (inputStudentMajor) inputStudentMajor.value = sv.MaNganh || '';
    } catch (e) { alert(e.message); }
  }
  function closeModal() {
    studentModal.classList.add('hidden');
    studentForm.reset();
    editingStudentId = null;
  }
  if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => openModal('add'));
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  // ----- Sửa / Xóa -----
  function bindActionButtons() {
    document.querySelectorAll('.btn-edit').forEach((b) =>
      b.addEventListener('click', () => openModal('edit', b.getAttribute('data-id'))));
    document.querySelectorAll('.btn-delete').forEach((b) =>
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        if (!confirm(`Xóa vĩnh viễn hồ sơ sinh viên ${id}?`)) return;
        try {
          await EduFeeAPI.del('/students/' + id);
          await loadStudents();
        } catch (e) { alert(e.message); }
      }));
  }

  // ----- Lưu (thêm/sửa) -----
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        MaSoSinhVien: inputStudentId.value.trim(),
        HoTen: inputStudentName.value.trim(),
        NgaySinh: inputStudentDob.value || null,
        GioiTinh: inputStudentGender ? inputStudentGender.value : null,
        MaNganh: inputStudentMajor ? inputStudentMajor.value : null,
      };
      if (!payload.HoTen || !payload.MaNganh || (formMode === 'add' && !payload.MaSoSinhVien)) {
        alert('Vui lòng nhập đầy đủ MSSV, Họ tên và chọn Ngành.');
        return;
      }
      try {
        if (formMode === 'add') {
          await EduFeeAPI.post('/students', payload);
          alert('Thêm sinh viên thành công!');
        } else {
          delete payload.MaSoSinhVien; // không gửi khóa chính khi sửa
          await EduFeeAPI.put('/students/' + editingStudentId, payload);
          alert('Cập nhật thành công!');
        }
        closeModal();
        await loadStudents();
      } catch (e) { alert(e.message); }
    });
  }

  if (searchStudentInput) searchStudentInput.addEventListener('input', loadStudents);
  if (filterClassSelect) filterClassSelect.addEventListener('change', loadStudents);

  // ----- Khởi chạy -----
  await loadNganh();
  await loadStudents();
});
