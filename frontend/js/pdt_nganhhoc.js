/* EduFee - QUẢN LÝ NGÀNH HỌC (nối API). Thay frontend/js/pdt_nganhhoc.js.
 * majorDepartment -> dropdown Khoa. (Trường majorCredits không có trong DB -> bỏ qua) */
document.addEventListener('DOMContentLoaded', async () => {
    await EduFeeGuard.protect(['PDT']);
    const tbody = document.getElementById('majorTableBody');
    const modal = document.getElementById('majorModal');
    const form = document.getElementById('majorForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnAdd = document.getElementById('btnOpenAddModal');
    const btnClose = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancelModal');
    const inId = document.getElementById('majorId');
    const inName = document.getElementById('majorName');
    const inDept = document.getElementById('majorDepartment');
    const search = document.getElementById('searchMajor');
    let mode = 'add', editingId = null;
  
    async function loadKhoa() {
      const ks = await EduFeeAPI.get('/khoa');
      if (inDept) inDept.innerHTML = '<option value="">-- Chọn khoa --</option>' +
        ks.map(k => `<option value="${k.MaKhoa}">${k.TenKhoa}</option>`).join('');
    }
    function render(items) {
      tbody.innerHTML = '';
      if (!items.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;color:#718096;">Không có ngành.</td></tr>'; return; }
      items.forEach((n, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td><strong>${n.MaNganh}</strong></td><td>${n.TenNganh}</td>
          <td>${n.khoa ? n.khoa.TenKhoa : ''}</td>
          <td class="text-center"><div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${n.MaNganh}"><i class="ti ti-edit"></i></button>
            <button class="btn-action btn-delete" data-id="${n.MaNganh}"><i class="ti ti-trash"></i></button>
          </div></td>`;
        tbody.appendChild(tr);
      });
      bind();
    }
    async function load() {
      const p = new URLSearchParams();
      if (search && search.value.trim()) p.set('search', search.value.trim());
      try { render(await EduFeeAPI.get('/nganh?' + p)); } catch (e) { alert(e.message); }
    }
    function openModal(m, id) {
      mode = m; modal.classList.remove('hidden');
      if (m === 'add') { modalTitle.textContent = 'Thêm ngành'; form.reset(); inId.removeAttribute('disabled'); }
      else { modalTitle.textContent = 'Sửa ngành'; inId.setAttribute('disabled', 'true'); fill(id); }
    }
    async function fill(id) {
      const n = await EduFeeAPI.get('/nganh/' + id);
      editingId = id; inId.value = n.MaNganh; inName.value = n.TenNganh;
      if (inDept) inDept.value = n.MaKhoa;
    }
    function closeModal() { modal.classList.add('hidden'); form.reset(); editingId = null; }
    if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    function bind() {
      document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal('edit', b.dataset.id)));
      document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', async () => {
        if (!confirm(`Xóa ngành ${b.dataset.id}?`)) return;
        try { await EduFeeAPI.del('/nganh/' + b.dataset.id); load(); } catch (e) { alert(e.message); }
      }));
    }
    if (form) form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = { MaNganh: inId.value.trim(), TenNganh: inName.value.trim(), MaKhoa: inDept ? inDept.value : '' };
      if (!payload.TenNganh || !payload.MaKhoa || (mode === 'add' && !payload.MaNganh)) { alert('Nhập đủ Mã, Tên, Khoa.'); return; }
      try {
        if (mode === 'add') await EduFeeAPI.post('/nganh', payload);
        else { delete payload.MaNganh; await EduFeeAPI.put('/nganh/' + editingId, payload); }
        closeModal(); load();
      } catch (e) { alert(e.message); }
    });
    if (search) search.addEventListener('input', load);
    await loadKhoa(); await load();
  });
  