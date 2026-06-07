/* EduFee - MỞ MÔN / LỚP HỌC PHẦN (nối API). Thay frontend/js/pdt_dkhp.js.
 * classSemester + filterSemester -> dropdown học kỳ (value = MaHKNH).
 * classYear/filterYear: không dùng (DB gộp năm+kỳ trong MaHKNH) -> có thể ẩn.
 * classSubjectId -> dropdown môn học. classId = mã lớp (MaMonHocMo). */
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
  const filterSemester = document.getElementById('filterSemester');
  let mode = 'add', editingId = null;

  async function loadDanhMuc() {
    const [hkList, courses] = await Promise.all([
      EduFeeAPI.get('/semesters'),
      EduFeeAPI.get('/courses?limit=200'),
    ]);
    const courseItems = courses.items || courses;
    const hkOptions = hkList.map(h => `<option value="${h.MaHKNH}">${h.MaHKNH} (${h.HocKy})</option>`).join('');
    if (inSemester) inSemester.innerHTML = '<option value="">-- Chọn học kỳ --</option>' + hkOptions;
    if (filterSemester) filterSemester.innerHTML = '<option value="">-- Tất cả học kỳ --</option>' + hkOptions;
    if (inSubject) inSubject.innerHTML = '<option value="">-- Chọn môn học --</option>' +
      courseItems.map(c => `<option value="${c.MaMonHoc}">[${c.MaMonHoc}] ${c.TenMonHoc} (${c.SoTinChi} TC)</option>`).join('');
  }

  function render(items) {
    tbody.innerHTML = '';
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#718096;">Chưa có lớp mở.</td></tr>'; return; }
    items.forEach((o, i) => {
      const ten = o.monHoc ? o.monHoc.TenMonHoc : o.MaMonHoc;
      const full = o.SiSoHienTai >= o.SiSoToiDa;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td><strong>${o.MaMonHocMo}</strong></td><td>${o.MaHKNH}</td>
        <td>${ten}</td><td style="${full ? 'color:#e53e3e;font-weight:600;' : ''}">${o.SiSoHienTai}/${o.SiSoToiDa}</td>
        <td>${full ? 'Đã đầy' : 'Còn chỗ'}</td>
        <td class="text-center"><div class="action-buttons">
          <button class="btn-action btn-edit" data-id="${o.MaMonHocMo}"><i class="ti ti-edit"></i></button>
          <button class="btn-action btn-delete" data-id="${o.MaMonHocMo}"><i class="ti ti-trash"></i></button>
        </div></td>`;
      tbody.appendChild(tr);
    });
    bind();
  }
  async function load() {
    const p = new URLSearchParams();
    if (filterSemester && filterSemester.value) p.set('maHKNH', filterSemester.value);
    if (search && search.value.trim()) p.set('search', search.value.trim());
    try { render(await EduFeeAPI.get('/offerings?' + p)); } catch (e) { alert(e.message); }
  }
  function openModal(m, id) {
    mode = m; modal.classList.remove('hidden');
    if (m === 'add') {
      modalTitle.textContent = 'Mở lớp học phần'; form.reset();
      [inId, inSemester, inSubject].forEach(el => el && el.removeAttribute('disabled'));
    } else {
      modalTitle.textContent = 'Sửa sĩ số lớp';
      // Chỉ cho sửa sĩ số tối đa; khóa các trường định danh
      [inId, inSemester, inSubject].forEach(el => el && el.setAttribute('disabled', 'true'));
      fill(id);
    }
  }
  async function fill(id) {
    const o = await EduFeeAPI.get('/offerings/' + id);
    editingId = id;
    if (inId) inId.value = o.MaMonHocMo;
    if (inSemester) inSemester.value = o.MaHKNH;
    if (inSubject) inSubject.value = o.MaMonHoc;
    if (inMax) inMax.value = o.SiSoToiDa;
  }
  function closeModal() { modal.classList.add('hidden'); form.reset(); editingId = null; }
  if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  function bind() {
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal('edit', b.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`Xóa lớp mở ${b.dataset.id}?`)) return;
      try { await EduFeeAPI.del('/offerings/' + b.dataset.id); load(); } catch (e) { alert(e.message); }
    }));
  }
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      if (mode === 'add') {
        const payload = {
          MaMonHocMo: inId.value.trim(), MaHKNH: inSemester.value,
          MaMonHoc: inSubject.value, SiSoToiDa: Number(inMax.value) || 50,
        };
        if (!payload.MaMonHocMo || !payload.MaHKNH || !payload.MaMonHoc) { alert('Nhập đủ mã lớp, học kỳ, môn học.'); return; }
        await EduFeeAPI.post('/offerings', payload);
      } else {
        await EduFeeAPI.put('/offerings/' + editingId, { SiSoToiDa: Number(inMax.value) });
      }
      closeModal(); load();
    } catch (e) { alert(e.message); }
  });
  if (search) search.addEventListener('input', load);
  if (filterSemester) filterSemester.addEventListener('change', load);
  await loadDanhMuc(); await load();
});
