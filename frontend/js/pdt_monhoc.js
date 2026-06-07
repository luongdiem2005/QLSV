/* EduFee - QUẢN LÝ MÔN HỌC (nối API). Thay frontend/js/pdt_monhoc.js.
 * HTML cần thêm: <select id="subjectDepartment"></select> (Khoa phụ trách).
 * subjectType -> dropdown loại môn; subjectCredits -> readonly (server tính);
 * subjectPrerequisite -> dropdown 1 môn tiên quyết (hoặc "none"). */
document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PDT']);

  const tbody = document.getElementById('subjectTableBody');
  const modal = document.getElementById('subjectModal');
  const form = document.getElementById('subjectForm');
  const modalTitle = document.getElementById('modalTitle');
  const btnAdd = document.getElementById('btnOpenAddModal');
  const btnClose = document.getElementById('btnCloseModal');
  const btnCancel = document.getElementById('btnCancelModal');
  const inId = document.getElementById('subjectId');
  const inName = document.getElementById('subjectName');
  const inCredits = document.getElementById('subjectCredits');
  const inType = document.getElementById('subjectType');
  const inDept = document.getElementById('subjectDepartment');
  const inPrereq = document.getElementById('subjectPrerequisite');
  const inLessons = document.getElementById('subjectLessons');
  const search = document.getElementById('searchSubject');
  const filterType = document.getElementById('filterType');

  let mode = 'add', editingId = null, loaiList = [], khoaList = [], courseList = [];

  async function loadDanhMuc() {
    [loaiList, khoaList] = await Promise.all([
      EduFeeAPI.get('/loai-mon-hoc'),
      EduFeeAPI.get('/khoa').catch(() => []),
    ]);
    if (inType) inType.innerHTML = '<option value="">-- Loại môn --</option>' +
      loaiList.map(l => `<option value="${l.MaLoaiMonHoc}">${l.TenLoaiMonHoc}</option>`).join('');
    if (filterType) filterType.innerHTML = '<option value="">-- Tất cả loại --</option>' +
      loaiList.map(l => `<option value="${l.MaLoaiMonHoc}">${l.TenLoaiMonHoc}</option>`).join('');
    if (inDept) inDept.innerHTML = '<option value="">-- Khoa phụ trách --</option>' +
      khoaList.map(k => `<option value="${k.MaKhoa}">${k.TenKhoa}</option>`).join('');
  }

  async function loadPrereqOptions(excludeId) {
    courseList = await EduFeeAPI.get('/courses?limit=200');
    courseList = courseList.items || courseList;
    if (inPrereq) inPrereq.innerHTML = '<option value="none">Không có</option>' +
      courseList.filter(c => c.MaMonHoc !== excludeId)
        .map(c => `<option value="${c.MaMonHoc}">[${c.MaMonHoc}] ${c.TenMonHoc}</option>`).join('');
  }

  function autoCredits() {
    if (!inCredits || !inType || !inLessons) return;
    const loai = loaiList.find(l => l.MaLoaiMonHoc === inType.value);
    const tiet = Number(inLessons.value);
    inCredits.value = loai && tiet ? Math.floor(tiet / loai.SoTietMotTinChi) : '';
  }
  if (inType) inType.addEventListener('change', autoCredits);
  if (inLessons) inLessons.addEventListener('input', autoCredits);

  function render(items) {
    tbody.innerHTML = '';
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#718096;">Không có môn học.</td></tr>'; return; }
    items.forEach((m, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td><strong>${m.MaMonHoc}</strong></td><td>${m.TenMonHoc}</td>
        <td>${m.SoTiet}</td><td>${m.SoTinChi}</td><td>${m.loaiMonHoc ? m.loaiMonHoc.TenLoaiMonHoc : ''}</td>
        <td class="text-center"><div class="action-buttons">
          <button class="btn-action btn-edit" data-id="${m.MaMonHoc}"><i class="ti ti-edit"></i></button>
          <button class="btn-action btn-delete" data-id="${m.MaMonHoc}"><i class="ti ti-trash"></i></button>
        </div></td>`;
      tbody.appendChild(tr);
    });
    bind();
  }

  async function load() {
    const p = new URLSearchParams();
    if (search && search.value.trim()) p.set('search', search.value.trim());
    if (filterType && filterType.value) p.set('maLoai', filterType.value);
    p.set('limit', '200');
    try { render((await EduFeeAPI.get('/courses?' + p)).items); } catch (e) { alert(e.message); }
  }

  function openModal(m, id) {
    mode = m; modal.classList.remove('hidden');
    loadPrereqOptions(id);
    if (m === 'add') { modalTitle.textContent = 'Thêm môn học'; form.reset(); inId.removeAttribute('disabled'); autoCredits(); }
    else { modalTitle.textContent = 'Sửa môn học'; inId.setAttribute('disabled', 'true'); fill(id); }
  }
  async function fill(id) {
    const m = await EduFeeAPI.get('/courses/' + id);
    editingId = id;
    inId.value = m.MaMonHoc; inName.value = m.TenMonHoc; inLessons.value = m.SoTiet;
    if (inType) inType.value = m.MaLoaiMonHoc;
    if (inDept) inDept.value = m.MaKhoa;
    if (inPrereq) inPrereq.value = (m.monHocTruocList && m.monHocTruocList[0]) ? m.monHocTruocList[0].MaMonHocTruoc : 'none';
    autoCredits();
  }
  function closeModal() { modal.classList.add('hidden'); form.reset(); editingId = null; }
  if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  function bind() {
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal('edit', b.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
      if (!confirm(`Xóa môn ${b.dataset.id}?`)) return;
      try { await EduFeeAPI.del('/courses/' + b.dataset.id); load(); } catch (e) { alert(e.message); }
    }));
  }

  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const prereq = inPrereq && inPrereq.value !== 'none' ? [inPrereq.value] : [];
    const payload = {
      MaMonHoc: inId.value.trim(), TenMonHoc: inName.value.trim(),
      MaKhoa: inDept ? inDept.value : '', MaLoaiMonHoc: inType ? inType.value : '',
      SoTiet: Number(inLessons.value), monHocTruoc: prereq,
    };
    if (!payload.TenMonHoc || !payload.MaKhoa || !payload.MaLoaiMonHoc || !payload.SoTiet || (mode === 'add' && !payload.MaMonHoc)) {
      alert('Nhập đủ Mã, Tên, Khoa, Loại môn, Số tiết.'); return;
    }
    try {
      if (mode === 'add') await EduFeeAPI.post('/courses', payload);
      else { delete payload.MaMonHoc; await EduFeeAPI.put('/courses/' + editingId, payload); }
      closeModal(); load();
    } catch (e) { alert(e.message); }
  });

  if (search) search.addEventListener('input', load);
  if (filterType) filterType.addEventListener('change', load);

  if (window.EduFeeExcel) EduFeeExcel.mountTableButton({ table: '.data-table', filename: 'DanhSachMonHoc', label: 'Xuất Excel' });
  await loadDanhMuc();
  await load();
});
