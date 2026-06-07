/* EduFee - QUẢN LÝ KHOA (nối API). Khớp ID trong pdt_khoa.html:
 * facultyTableBody, facultyModal, facultyForm, modalTitle, btnOpenAddModal,
 * btnCloseModal, btnCancelModal, facultyId, facultyName, facultyDescription, searchFaculty */
document.addEventListener('DOMContentLoaded', async () => {
    await EduFeeGuard.protect(['PDT', 'ADMIN']);
  
    const $ = (id) => document.getElementById(id);
    const tbody = $('facultyTableBody');
    const modal = $('facultyModal');
    const form = $('facultyForm');
    const modalTitle = $('modalTitle');
    const btnAdd = $('btnOpenAddModal');
    const btnClose = $('btnCloseModal');
    const btnCancel = $('btnCancelModal');
    const inId = $('facultyId');
    const inName = $('facultyName');
    const inDesc = $('facultyDescription');
    const search = $('searchFaculty');
  
    let mode = 'add', editingId = null;
  
    function render(items) {
      tbody.innerHTML = '';
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:24px;color:#718096;">Chưa có khoa nào.</td></tr>';
        return;
      }
      items.forEach((k, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td><strong>${k.MaKhoa}</strong></td>
          <td>${k.TenKhoa}</td>
          <td class="text-center"><div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${k.MaKhoa}" title="Sửa"><i class="ti ti-edit"></i></button>
            <button class="btn-action btn-delete" data-id="${k.MaKhoa}" title="Xóa"><i class="ti ti-trash"></i></button>
          </div></td>`;
        tbody.appendChild(tr);
      });
      bind();
    }
  
    async function load() {
      try {
        let list = await EduFeeAPI.get('/khoa');
        const kw = search && search.value.trim().toLowerCase();
        if (kw) list = list.filter(k => k.MaKhoa.toLowerCase().includes(kw) || k.TenKhoa.toLowerCase().includes(kw));
        render(list);
      } catch (e) { alert(e.message); }
    }
  
    function openModal(m, id) {
      mode = m; modal.classList.remove('hidden');
      if (m === 'add') {
        modalTitle.textContent = 'Thêm khoa mới'; form.reset();
        if (inId) inId.removeAttribute('disabled');
      } else {
        modalTitle.textContent = 'Cập nhật khoa';
        if (inId) inId.setAttribute('disabled', 'true');
        fill(id);
      }
    }
    async function fill(id) {
      const k = await EduFeeAPI.get('/khoa/' + id);
      editingId = id;
      if (inId) inId.value = k.MaKhoa;
      if (inName) inName.value = k.TenKhoa || '';
      if (inDesc) inDesc.value = k.GhiChu || '';
    }
    function closeModal() { modal.classList.add('hidden'); form.reset(); editingId = null; }
    if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
  
    function bind() {
      document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal('edit', b.dataset.id)));
      document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
        if (!confirm(`Xóa khoa ${b.dataset.id}?`)) return;
        try { await EduFeeAPI.del('/khoa/' + b.dataset.id); load(); } catch (e) { alert(e.message); }
      }));
    }
  
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        MaKhoa: inId ? inId.value.trim() : '',
        TenKhoa: inName ? inName.value.trim() : '',
        GhiChu: inDesc ? inDesc.value.trim() || null : null,
      };
      if (!payload.TenKhoa || (mode === 'add' && !payload.MaKhoa)) {
        alert('Vui lòng nhập Mã khoa và Tên khoa.'); return;
      }
      try {
        if (mode === 'add') await EduFeeAPI.post('/khoa', payload);
        else { delete payload.MaKhoa; await EduFeeAPI.put('/khoa/' + editingId, payload); }
        closeModal(); load();
      } catch (e) { alert(e.message); }
    });
  
    if (search) search.addEventListener('input', load);
    await load();
  });
  