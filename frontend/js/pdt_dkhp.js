/* EduFee - MỞ MÔN / LỚP HỌC PHẦN (nối API). Thay frontend/js/pdt_dkhp.js.
 * Hiển thị tự động học kỳ hiện tại, không có dropdown. */
document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PDT']);
  const tbody = document.getElementById('classTableBody');
  const modal = document.getElementById('classModal');
  const form = document.getElementById('classForm');
  const modalTitle = document.getElementById('modalTitle');
  const btnAdd = document.getElementById('btnOpenAddModal');
  const btnClose = document.getElementById('btnCloseModal');
  const btnCancel = document.getElementById('btnCancelModal');
  const inSemester = document.getElementById('classSemester');
  const inSubject = document.getElementById('classSubjectId');
  const inId = document.getElementById('classId');
  const inMax = document.getElementById('classMaxStudents');
  const search = document.getElementById('searchClassSubject');
  const semesterLabel = document.getElementById('currentSemesterLabel');
  
  let mode = 'add', editingId = null;
  let currentSemester = null; // Lưu học kỳ hiện tại
  let allCourses = []; // Lưu tất cả các môn học

  // Lấy học kỳ hiện tại
  async function getCurrentSemester() {
    try {
      const semesters = await EduFeeAPI.get('/semesters');
      const now = new Date();
      
      for (const sem of semesters) {
        const startDate = new Date(sem.NgayBatDau);
        const endDate = new Date(sem.NgayKetThuc);
        
        if (startDate <= now && now <= endDate) {
          return sem;
        }
      }
      
      // Nếu không có học kỳ hiện tại, trả về học kỳ gần nhất
      return semesters.length > 0 ? semesters[0] : null;
    } catch (e) {
      console.error('Lỗi lấy học kỳ:', e);
      return null;
    }
  }

  // Nạp danh mục: học kỳ và môn học
  async function loadDanhMuc() {
    try {
      // Lấy học kỳ hiện tại
      currentSemester = await getCurrentSemester();
      
      if (currentSemester) {
        if (inSemester) {
          inSemester.value = `${currentSemester.MaHKNH} - Kỳ ${currentSemester.HocKy}`;
        }
        if (semesterLabel) {
          semesterLabel.textContent = `${currentSemester.MaHKNH} - Kỳ ${currentSemester.HocKy}`;
        }
      } else {
        if (semesterLabel) {
          semesterLabel.textContent = 'Chưa có học kỳ nào';
        }
      }

      // Lấy tất cả môn học
      const coursesData = await EduFeeAPI.get('/courses?limit=200');
      allCourses = coursesData.items || coursesData;
      
      // Cập nhật dropdown môn học
      if (inSubject) {
        inSubject.innerHTML = '<option value="">-- Chọn môn học --</option>' +
          allCourses.map(c => `<option value="${c.MaMonHoc}">[${c.MaMonHoc}] ${c.TenMonHoc} (${c.SoTinChi} TC)</option>`).join('');
      }
    } catch (e) {
      console.error('Lỗi nạp danh mục:', e);
      alert('Lỗi khi nạp danh mục. Vui lòng tải lại trang.');
    }
  }

  // Render bảng danh sách lớp (chỉ hiển thị lớp của học kỳ hiện tại)
  function render(items) {
    tbody.innerHTML = '';
    
    // Lọc chỉ hiển thị lớp của học kỳ hiện tại
    const filteredItems = currentSemester 
      ? items.filter(o => o.MaHKNH === currentSemester.MaHKNH)
      : [];
    
    if (!filteredItems.length) { 
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#718096;">Chưa có lớp mở cho học kỳ này.</td></tr>'; 
      return; 
    }
    
    filteredItems.forEach((o, i) => {
      const ten = o.monhoc ? o.monhoc.TenMonHoc : o.MaMonHoc;
      const loai = o.monhoc && o.monhoc.loaimonhoc ? o.monhoc.loaimonhoc.TenLoaiMonHoc : '';
      const full = o.SiSoHienTai >= o.SiSoToiDa;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td><strong>${o.MaMonHocMo}</strong></td>
        <td>${ten}</td><td>${loai}</td><td class="text-center" style="${full ? 'color:#e53e3e;font-weight:600;' : ''}">${o.SiSoHienTai}/${o.SiSoToiDa}</td>
        <td>${full ? 'Đã đầy' : 'Còn chỗ'}</td>
        <td class="text-center"><div class="action-buttons">
          <button class="btn-action btn-edit" data-id="${o.MaMonHocMo}"><i class="ti ti-edit"></i></button>
          <button class="btn-action btn-delete" data-id="${o.MaMonHocMo}"><i class="ti ti-trash"></i></button>
        </div></td>`;
      tbody.appendChild(tr);
    });
    bind();
  }

  // Nạp dữ liệu lớp
  async function load() {
    if (!currentSemester) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#718096;">Chưa xác định được học kỳ hiện tại.</td></tr>';
      return;
    }

    const p = new URLSearchParams();
    p.set('maHKNH', currentSemester.MaHKNH);
    if (search && search.value.trim()) p.set('search', search.value.trim());
    try { 
      const offerings = await EduFeeAPI.get('/offerings?' + p);
      render(offerings); 
    } catch (e) { 
      alert(e.message); 
    }
  }

  // Mở modal (chỉ chế độ add, không có edit)
  function openModal(m, id) {
    mode = m; 
    modal.classList.remove('hidden');
    if (m === 'add') {
      modalTitle.textContent = 'Mở lớp học phần mới'; 
      form.reset();
      if (inSemester) {
        inSemester.value = currentSemester 
          ? `${currentSemester.MaHKNH} - Kỳ ${currentSemester.HocKy}` 
          : '';
      }
    } else {
      modalTitle.textContent = 'Sửa sĩ số lớp';
      if (inId) inId.removeAttribute('disabled');
      if (inSubject) inSubject.setAttribute('disabled', 'true');
      fill(id);
    }
  }

  // Điền dữ liệu khi edit
  async function fill(id) {
    const o = await EduFeeAPI.get('/offerings/' + id);
    editingId = id;
    if (inId) {
      inId.value = o.MaMonHocMo;
      inId.removeAttribute('disabled');
    }
    if (inSemester) {
      inSemester.value = o.MaHKNH;
    }
    if (inSubject) {
      inSubject.value = o.MaMonHoc;
      inSubject.setAttribute('disabled', 'true');
    }
    if (inMax) inMax.value = o.SiSoToiDa;
  }

  function closeModal() { 
    modal.classList.add('hidden'); 
    form.reset(); 
    editingId = null;
    // Bỏ disabled
    if (inId) inId.removeAttribute('disabled');
    if (inSubject) inSubject.removeAttribute('disabled');
  }

  if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  function bind() {
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal('edit', b.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`Xóa lớp mở ${b.dataset.id}?`)) return;
      try { 
        await EduFeeAPI.del('/offerings/' + b.dataset.id); 
        load(); 
      } catch (e) { 
        alert(e.message); 
      }
    }));
  }

  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      if (mode === 'add') {
        if (!currentSemester) {
          alert('Chưa xác định được học kỳ hiện tại.');
          return;
        }
        const payload = {
          MaMonHocMo: inId.value.trim(), 
          MaHKNH: currentSemester.MaHKNH,
          MaMonHoc: inSubject.value, 
          SiSoToiDa: Number(inMax.value) || 50,
        };
        if (!payload.MaMonHocMo || !payload.MaMonHoc) { 
          alert('Nhập đủ mã lớp và môn học.'); 
          return; 
        }
        await EduFeeAPI.post('/offerings', payload);
      } else {
        await EduFeeAPI.put('/offerings/' + editingId, { SiSoToiDa: Number(inMax.value) });
      }
      closeModal(); 
      load();
    } catch (e) { 
      alert(e.message); 
    }
  });

  if (search) search.addEventListener('input', load);

  // Khởi tạo
  await loadDanhMuc();
  await load();
});
