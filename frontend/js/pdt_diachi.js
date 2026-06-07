/* EduFee - QUẢN LÝ TỈNH / XÃ (nối API). Dùng /api/tinh và /api/xa. */
document.addEventListener('DOMContentLoaded', async () => {
    await EduFeeGuard.protect(['PDT', 'ADMIN']);
    const $ = (id) => document.getElementById(id);
  
    // ---------- TỈNH ----------
    const tinhBody = $('tinhTableBody');
    const tinhModal = $('tinhModal');
    const tinhForm = $('tinhForm');
    const tinhTitle = $('tinhModalTitle');
    const inTinhId = $('tinhId');
    const inTinhName = $('tinhName');
    const searchTinh = $('searchTinh');
    let tinhMode = 'add', tinhEditing = null, tinhList = [];
  
    // ---------- XÃ ----------
    const xaBody = $('xaTableBody');
    const xaModal = $('xaModal');
    const xaForm = $('xaForm');
    const xaTitle = $('xaModalTitle');
    const inXaId = $('xaId');
    const inXaName = $('xaName');
    const inXaTinh = $('xaTinh');
    const inXaVungsau = $('xaVungsau');
    const searchXa = $('searchXa');
    let xaMode = 'add', xaEditing = null, xaList = [];
  
    // ===== TỈNH =====
    async function loadTinh() {
      tinhList = await EduFeeAPI.get('/tinh');
      // đổ dropdown tỉnh cho form xã
      if (inXaTinh) inXaTinh.innerHTML = '<option value="">-- Chọn tỉnh --</option>' +
        tinhList.map(t => `<option value="${t.MaTinh}">${t.TenTinh}</option>`).join('');
      renderTinh();
    }
    function renderTinh() {
      const kw = searchTinh && searchTinh.value.trim().toLowerCase();
      let list = tinhList;
      if (kw) list = list.filter(t => t.MaTinh.toLowerCase().includes(kw) || t.TenTinh.toLowerCase().includes(kw));
      tinhBody.innerHTML = '';
      if (!list.length) { tinhBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:20px;color:#718096;">Chưa có tỉnh.</td></tr>'; return; }
      list.forEach((t, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td><strong>${t.MaTinh}</strong></td><td>${t.TenTinh}</td>
          <td class="text-center"><div class="action-buttons">
            <button class="btn-action btn-edit-tinh" data-id="${t.MaTinh}"><i class="ti ti-edit"></i></button>
            <button class="btn-action btn-del-tinh" data-id="${t.MaTinh}"><i class="ti ti-trash"></i></button>
          </div></td>`;
        tinhBody.appendChild(tr);
      });
      tinhBody.querySelectorAll('.btn-edit-tinh').forEach(b => b.addEventListener('click', () => openTinh('edit', b.dataset.id)));
      tinhBody.querySelectorAll('.btn-del-tinh').forEach(b => b.addEventListener('click', () => delTinh(b.dataset.id)));
    }
    function openTinh(m, id) {
      tinhMode = m; tinhModal.classList.remove('hidden');
      if (m === 'add') { tinhTitle.textContent = 'Thêm tỉnh'; tinhForm.reset(); inTinhId.removeAttribute('disabled'); }
      else {
        tinhTitle.textContent = 'Sửa tỉnh'; inTinhId.setAttribute('disabled', 'true');
        const t = tinhList.find(x => x.MaTinh === id); tinhEditing = id;
        inTinhId.value = t.MaTinh; inTinhName.value = t.TenTinh;
      }
    }
    function closeTinh() { tinhModal.classList.add('hidden'); tinhForm.reset(); tinhEditing = null; }
    $('btnAddTinh').addEventListener('click', () => openTinh('add'));
    $('btnCloseTinh').addEventListener('click', closeTinh);
    $('btnCancelTinh').addEventListener('click', closeTinh);
    tinhForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = { MaTinh: inTinhId.value.trim(), TenTinh: inTinhName.value.trim() };
      if (!payload.TenTinh || (tinhMode === 'add' && !payload.MaTinh)) { alert('Nhập đủ Mã và Tên tỉnh.'); return; }
      try {
        if (tinhMode === 'add') await EduFeeAPI.post('/tinh', payload);
        else { delete payload.MaTinh; await EduFeeAPI.put('/tinh/' + tinhEditing, payload); }
        closeTinh(); await loadTinh();
      } catch (e) { alert(e.message); }
    });
    async function delTinh(id) {
      if (!confirm(`Xóa tỉnh ${id}? (không xóa được nếu còn xã trực thuộc)`)) return;
      try { await EduFeeAPI.del('/tinh/' + id); await loadTinh(); } catch (e) { alert(e.message); }
    }
    if (searchTinh) searchTinh.addEventListener('input', renderTinh);
  
    // ===== XÃ =====
    async function loadXa() {
      xaList = await EduFeeAPI.get('/xa');
      renderXa();
    }
    function renderXa() {
      const kw = searchXa && searchXa.value.trim().toLowerCase();
      let list = xaList;
      if (kw) list = list.filter(x => x.MaXa.toLowerCase().includes(kw) || x.TenXa.toLowerCase().includes(kw));
      xaBody.innerHTML = '';
      if (!list.length) { xaBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:20px;color:#718096;">Chưa có xã/phường.</td></tr>'; return; }
      list.forEach((x, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td><strong>${x.MaXa}</strong></td><td>${x.TenXa}</td>
          <td>${x.tinh ? x.tinh.TenTinh : x.MaTinh}</td>
          <td class="text-center">${x.VungSauVungXa ? '✔' : ''}</td>
          <td class="text-center"><div class="action-buttons">
            <button class="btn-action btn-edit-xa" data-id="${x.MaXa}"><i class="ti ti-edit"></i></button>
            <button class="btn-action btn-del-xa" data-id="${x.MaXa}"><i class="ti ti-trash"></i></button>
          </div></td>`;
        xaBody.appendChild(tr);
      });
      xaBody.querySelectorAll('.btn-edit-xa').forEach(b => b.addEventListener('click', () => openXa('edit', b.dataset.id)));
      xaBody.querySelectorAll('.btn-del-xa').forEach(b => b.addEventListener('click', () => delXa(b.dataset.id)));
    }
    function openXa(m, id) {
      xaMode = m; xaModal.classList.remove('hidden');
      if (m === 'add') { xaTitle.textContent = 'Thêm xã/phường'; xaForm.reset(); inXaId.removeAttribute('disabled'); }
      else {
        xaTitle.textContent = 'Sửa xã/phường'; inXaId.setAttribute('disabled', 'true');
        const x = xaList.find(v => v.MaXa === id); xaEditing = id;
        inXaId.value = x.MaXa; inXaName.value = x.TenXa; inXaTinh.value = x.MaTinh;
        inXaVungsau.value = x.VungSauVungXa ? 'true' : 'false';
      }
    }
    function closeXa() { xaModal.classList.add('hidden'); xaForm.reset(); xaEditing = null; }
    $('btnAddXa').addEventListener('click', () => openXa('add'));
    $('btnCloseXa').addEventListener('click', closeXa);
    $('btnCancelXa').addEventListener('click', closeXa);
    xaForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        MaXa: inXaId.value.trim(), TenXa: inXaName.value.trim(),
        MaTinh: inXaTinh.value, VungSauVungXa: inXaVungsau.value === 'true',
      };
      if (!payload.TenXa || !payload.MaTinh || (xaMode === 'add' && !payload.MaXa)) { alert('Nhập đủ Mã xã, Tên xã và chọn Tỉnh.'); return; }
      try {
        if (xaMode === 'add') await EduFeeAPI.post('/xa', payload);
        else { delete payload.MaXa; await EduFeeAPI.put('/xa/' + xaEditing, payload); }
        closeXa(); await loadXa();
      } catch (e) { alert(e.message); }
    });
    async function delXa(id) {
      if (!confirm(`Xóa xã ${id}?`)) return;
      try { await EduFeeAPI.del('/xa/' + id); await loadXa(); } catch (e) { alert(e.message); }
    }
    if (searchXa) searchXa.addEventListener('input', renderXa);
  
    // ===== Khởi chạy =====
    await loadTinh();
    await loadXa();
  });
  