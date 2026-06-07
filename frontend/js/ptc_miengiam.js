/* EduFee - ĐỐI TƯỢNG ƯU TIÊN / MIỄN GIẢM (nối API). Thay ptc_miengiam.js.
 * Bản đồ tới bảng DOITUONGUUTIEN. (Backend không có quy trình duyệt đơn nên
 * cntPending/Approved/Rejected để 0; cntAll = số đối tượng.)
 * Ghi: ADMIN/PDT/PTC (đã mở quyền PTC ở backend). */
 document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PTC', 'PDT', 'ADMIN']);
  const tbody = document.getElementById('exemptionsTableBody');
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  let list = [];

  async function load() {
    list = await EduFeeAPI.get('/doi-tuong-uu-tien');
    setText('cntAll', list.length);
    setText('cntPending', 0); setText('cntApproved', list.length); setText('cntRejected', 0);
    tbody.innerHTML = '';
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Chưa có đối tượng ưu tiên.</td></tr>'; return; }
    list.forEach((d, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${d.MaDoiTuong}</td><td>${d.TenDoiTuong}</td>
        <td>${Number(d.TyLeMienGiam)}%</td>
        <td class="text-center"><div class="action-buttons">
          <button class="btn-action btn-edit" data-id="${d.MaDoiTuong}"><i class="ti ti-edit"></i></button>
          <button class="btn-action btn-delete" data-id="${d.MaDoiTuong}"><i class="ti ti-trash"></i></button>
        </div></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => editDt(b.dataset.id)));
    tbody.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => delDt(b.dataset.id)));
  }
  async function editDt(id) {
    const d = list.find(x => x.MaDoiTuong === id); if (!d) return;
    const ten = prompt('Tên đối tượng:', d.TenDoiTuong); if (ten === null) return;
    const ty = prompt('Tỷ lệ miễn giảm (0-100):', String(d.TyLeMienGiam)); if (ty === null) return;
    try { await EduFeeAPI.put('/doi-tuong-uu-tien/' + id, { TenDoiTuong: ten, TyLeMienGiam: Number(ty), GhiChu: d.GhiChu }); load(); }
    catch (e) { alert(e.message); }
  }
  async function delDt(id) {
    if (!confirm('Xóa đối tượng ' + id + '?')) return;
    try { await EduFeeAPI.del('/doi-tuong-uu-tien/' + id); load(); } catch (e) { alert(e.message); }
  }
  // Nút thêm (nếu HTML có #btnAddExemption)
  const btnAdd = document.getElementById('btnAddExemption');
  if (btnAdd) btnAdd.addEventListener('click', async () => {
    const ma = prompt('Mã đối tượng:'); if (!ma) return;
    const ten = prompt('Tên đối tượng:'); if (!ten) return;
    const ty = prompt('Tỷ lệ miễn giảm (0-100):', '0'); if (ty === null) return;
    try { await EduFeeAPI.post('/doi-tuong-uu-tien', { MaDoiTuong: ma, TenDoiTuong: ten, TyLeMienGiam: Number(ty) }); load(); }
    catch (e) { alert(e.message); }
  });

  await load();
});
