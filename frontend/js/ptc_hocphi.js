/* EduFee - CẤU HÌNH ĐƠN GIÁ HỌC PHÍ theo loại môn. Map tới LOAIMONHOC.SoTienMotTinChi.
 * Ghi: ADMIN/PDT/PTC (đã mở quyền PTC ở backend). */
 document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PTC', 'PDT', 'ADMIN']);

  const tbody = document.getElementById('ratesTableBody');
  const form = document.getElementById('formRateConfig');
  const panelTitle = document.getElementById('formPanelTitle');
  const txtId = document.getElementById('txtRateId');
  const selType = document.getElementById('selectClassType');
  const numPrice = document.getElementById('numUnitPrice');
  const btnReset = document.getElementById('btnResetForm');
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  let loaiList = [];

  async function load() {
    loaiList = await EduFeeAPI.get('/loai-mon-hoc');
    if (selType) selType.innerHTML = '<option value="">-- Chọn loại môn --</option>' +
      loaiList.map((l) => `<option value="${l.MaLoaiMonHoc}">${l.TenLoaiMonHoc}</option>`).join('');
    tbody.innerHTML = '';
    if (!loaiList.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Chưa có loại môn.</td></tr>';
      return;
    }
    loaiList.forEach((l, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${l.TenLoaiMonHoc}</td><td class="text-right">${fmt(l.SoTienMotTinChi)}</td>
        <td class="text-center">—</td>
        <td class="text-center"><button class="btn-action btn-edit" data-id="${l.MaLoaiMonHoc}"><i class="ti ti-edit"></i></button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.btn-edit').forEach((b) => b.addEventListener('click', () => fill(b.dataset.id)));
  }

  function fill(id) {
    const l = loaiList.find((x) => x.MaLoaiMonHoc === id);
    if (!l) return;
    if (panelTitle) panelTitle.textContent = 'Sửa đơn giá: ' + l.TenLoaiMonHoc;
    if (txtId) txtId.value = l.MaLoaiMonHoc;
    if (selType) selType.value = l.MaLoaiMonHoc;
    if (numPrice) numPrice.value = l.SoTienMotTinChi;
  }
  function reset() {
    if (form) form.reset();
    if (txtId) txtId.value = '';
    if (panelTitle) panelTitle.textContent = 'Cập nhật đơn giá';
  }
  if (btnReset) btnReset.addEventListener('click', (e) => { e.preventDefault(); reset(); });

  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (txtId && txtId.value) || (selType && selType.value);
    if (!id) { alert('Chọn loại môn cần cập nhật đơn giá.'); return; }
    const l = loaiList.find((x) => x.MaLoaiMonHoc === id);
    const gia = Number(numPrice.value);
    if (!gia || gia < 0) { alert('Đơn giá không hợp lệ.'); return; }
    try {
      await EduFeeAPI.put('/loai-mon-hoc/' + id, {
        TenLoaiMonHoc: l.TenLoaiMonHoc, SoTietMotTinChi: l.SoTietMotTinChi, SoTienMotTinChi: gia,
      });
      alert('Cập nhật đơn giá thành công!');
      reset(); load();
    } catch (e) { alert(e.message); }
  });

  await load();
});
