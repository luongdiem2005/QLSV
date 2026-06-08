/* EduFee - DANH SÁCH SINH VIÊN ĐƯỢC XÉT MIỄN GIẢM (theo đối tượng ưu tiên).
 * Lấy /students, lọc những SV có đối tượng ưu tiên (MaDoiTuong). 8 cột khớp HTML. */
 document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PTC', 'PDT', 'ADMIN']);
  const tbody = document.getElementById('exemptionsTableBody');
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  let rows = [];

  async function load() {
    const res = await EduFeeAPI.get('/students?limit=500');
    const all = res.items || res;
    rows = all.filter((sv) => sv.MaDoiTuong && sv.doituonguutien);
    setText('cntAll', rows.length);
    setText('cntApproved', rows.length);
    setText('cntPending', 0);
    setText('cntRejected', 0);
    render();
  }

  function render() {
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:20px;color:#718096;">Chưa có sinh viên nào thuộc diện miễn giảm.</td></tr>';
    } else rows.forEach((sv) => {
      const dt = sv.doituonguutien || {};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${sv.MaSoSinhVien}</strong></td><td>${sv.HoTen}</td>
        <td>${sv.nganh ? sv.nganh.TenNganh : '—'}</td>
        <td>${dt.TenDoiTuong || ''}</td>
        <td class="text-center">${Number(dt.TyLeMienGiam || 0)}%</td>
        <td class="text-center">—</td>
        <td class="text-center"><span style="color:#38a169;">Đã áp dụng</span></td>
        <td class="text-center">—</td>`;
      tbody.appendChild(tr);
    });
    if (window.EduFeeExcel) EduFeeExcel.mountTableButton({ table: '.data-table', filename: 'DanhSachMienGiam', label: 'Xuất Excel' });
  }

  await load();
});
