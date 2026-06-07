/* EduFee - LỊCH SỬ GIAO DỊCH HỌC PHÍ (SV, nối API). Thay frontend/js/sv_lsgd.js. */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['SV']);
  if (!me) return;

  const tbody = document.getElementById('historyTableBody');
  const modal = document.getElementById('receiptModal');
  const btnClose = document.getElementById('btnCloseReceiptModal');
  const btnCancel = document.getElementById('btnCancelReceiptModal');
  const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  let payments = [];

  async function load() {
    payments = await EduFeeAPI.get('/payments');
    tbody.innerHTML = '';
    if (!payments.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Chưa có giao dịch.</td></tr>'; return; }
    payments.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${p.MaPhieuThu}</td>
        <td>${new Date(p.NgayLapPhieu).toLocaleString('vi-VN')}</td>
        <td>${p.phieuDangKy ? p.phieuDangKy.MaHKNH : ''}</td>
        <td class="text-right">${fmt(p.SoTienThu)}</td>`;
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => showReceipt(p.MaPhieuThu));
      tbody.appendChild(tr);
    });
    setupExport();
  }

  function setupExport() {
    if (!window.EduFeeExcel) return;
    EduFeeExcel.mountButton({
      label: 'Xuất Excel',
      onExport: () => ({
        filename: 'LichSuGiaoDich_' + me.MaSoSinhVien,
        columns: [
          { header: 'Mã phiếu thu', key: 'ma' },
          { header: 'Ngày', key: 'ngay' },
          { header: 'Học kỳ', key: 'hk' },
          { header: 'Số tiền', key: 'tien' },
        ],
        rows: payments.map(p => ({
          ma: p.MaPhieuThu,
          ngay: new Date(p.NgayLapPhieu).toLocaleString('vi-VN'),
          hk: p.phieuDangKy ? p.phieuDangKy.MaHKNH : '',
          tien: Number(p.SoTienThu),
        })),
      }),
    });
  }

  async function showReceipt(id) {
    if (!modal) return;
    try {
      const pt = await EduFeeAPI.get('/payments/' + id);
      const sv = pt.phieuDangKy.sinhVien || {};
      setText('rcpStudentId', sv.MaSoSinhVien || '');
      setText('rcpStudentName', sv.HoTen || '');
      setText('rcpClassName', pt.phieuDangKy.hocKyNamHoc ? pt.phieuDangKy.hocKyNamHoc.HocKy : '');
      setText('rcpTxnId', pt.MaPhieuThu);
      setText('rcpDate', new Date(pt.NgayLapPhieu).toLocaleString('vi-VN'));
      setText('rcpTerm', pt.phieuDangKy.MaHKNH);
      setText('rcpAmountGross', fmt(pt.phieuDangKy.TongTienDK));
      setText('rcpAmountDiscount', fmt(pt.phieuDangKy.TienMienGiam));
      setText('rcpAmountNet', fmt(pt.SoTienThu));
      setText('rcpMethodWord', 'Tiền mặt');
      modal.classList.remove('hidden');
    } catch (e) { alert(e.message); }
  }
  function closeModal() { if (modal) modal.classList.add('hidden'); }
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  await load();
});
