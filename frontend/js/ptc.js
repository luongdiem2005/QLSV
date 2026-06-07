/* EduFee - DASHBOARD TÀI CHÍNH (PTC). KPI từ /enrollments; công nợ từ /reports/unpaid. */
document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PTC', 'PDT', 'ADMIN']);

  const tbody = document.getElementById('masterDebtTableBody');
  const searchDebt = document.getElementById('searchStudentDebt');
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  let maHKNH = null;
  let debtList = [];

  async function init() {
    const hks = await EduFeeAPI.get('/semesters');
    maHKNH = hks.length ? hks[0].MaHKNH : null;
    if (!maHKNH) { renderDebt(); return; }

    // /enrollments đã kèm sẵn các cột tiền -> cộng KPI trực tiếp
    const phieuList = await EduFeeAPI.get('/enrollments?maHKNH=' + encodeURIComponent(maHKNH));
    let gross = 0, discount = 0, paid = 0, debt = 0;
    phieuList.forEach((p) => {
      gross += Number(p.TongTienDK); discount += Number(p.TienMienGiam);
      paid += Number(p.SoTienDaDong); debt += Number(p.SoTienConLai);
    });
    setText('kpiTotalGross', fmt(gross));
    setText('kpiTotalDiscount', fmt(discount));
    setText('kpiTotalPaid', fmt(paid));
    setText('kpiTotalDebt', fmt(debt));
    const phaiDong = gross - discount;
    const pct = phaiDong > 0 ? Math.round((paid / phaiDong) * 100) : 0;
    setText('lblPercentageOutput', pct + '%');
    const barPaid = document.getElementById('barPaid');
    const barDebt = document.getElementById('barDebt');
    if (barPaid) barPaid.style.width = pct + '%';
    if (barDebt) barDebt.style.width = (100 - pct) + '%';

    const rep = await EduFeeAPI.get('/reports/unpaid?maHKNH=' + encodeURIComponent(maHKNH));
    debtList = rep.danhSach || [];
    renderDebt();
    setupExport();
  }

  function renderDebt() {
    const kw = (searchDebt && searchDebt.value.trim().toLowerCase()) || '';
    const rows = debtList.filter((d) => d.MaSoSinhVien.toLowerCase().includes(kw) || d.HoTen.toLowerCase().includes(kw));
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Không có sinh viên nợ học phí.</td></tr>';
      return;
    }
    rows.forEach((d, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${d.MaSoSinhVien}</td><td>${d.HoTen}</td>
        <td class="text-right">${fmt(d.TongTienPhaiDong)}</td>
        <td class="text-right" style="color:#e53e3e;">${fmt(d.SoTienConLai)}</td>`;
      tbody.appendChild(tr);
    });
  }

  function setupExport() {
    if (!window.EduFeeExcel) return;
    EduFeeExcel.mountButton({
      label: 'Xuất Excel công nợ',
      onExport: () => ({
        filename: 'BaoCaoCongNo_' + (maHKNH || ''),
        columns: [
          { header: 'MSSV', key: 'mssv' },
          { header: 'Họ tên', key: 'hoten' },
          { header: 'Tổng phải đóng', key: 'phaidong' },
          { header: 'Còn nợ', key: 'conlai' },
        ],
        rows: debtList.map((d) => ({
          mssv: d.MaSoSinhVien, hoten: d.HoTen,
          phaidong: Number(d.TongTienPhaiDong), conlai: Number(d.SoTienConLai),
        })),
      }),
    });
  }

  if (searchDebt) searchDebt.addEventListener('input', renderDebt);
  await init();
});
