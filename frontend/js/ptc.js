// Giả sử enrollments đã được lấy từ API trước đó
let enrollments = []; // <-- dữ liệu đã có sẵn
let debtList = [];

async function reload() {
  // ... các đoạn code khác ...
  // Không gọi lại API /reports/unpaid nữa

  // Tính toán KPI từ enrollments
  let totalPaid = 0, totalDebt = 0;
  debtList = enrollments.filter(e => e.SoTienConLai > 0).map(e => ({
    MaSoSinhVien: e.MaSoSinhVien,
    HoTen: e.HoTen,
    TongTienPhaiDong: e.TongTienPhaiDong,
    SoTienConLai: e.SoTienConLai
  }));

  enrollments.forEach(e => {
    totalPaid += (e.TongTienPhaiDong - e.SoTienConLai);
    totalDebt += e.SoTienConLai;
  });

  const total = totalPaid + totalDebt;
  const pct = total ? Math.round((totalPaid / total) * 100) : 0;

  const barPaid = document.getElementById('barPaid');
  const barDebt = document.getElementById('barDebt');
  if (barPaid) barPaid.style.width = pct + '%';
  if (barDebt) barDebt.style.width = (100 - pct) + '%';

  renderDebt();
  setupExport();
}

function renderDebt() {
  const kw = (searchDebt && searchDebt.value.trim().toLowerCase()) || '';
  const rows = debtList.filter(d => d.MaSoSinhVien.toLowerCase().includes(kw) || d.HoTen.toLowerCase().includes(kw));
  tbody.innerHTML = '';
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Không có sinh viên nợ học phí.</td></tr>';
    return;
  }
  rows.forEach((d, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${d.MaSoSinhVien}</td><td>${d.HoTen}</td>
      <td class="text-right">${fmt(d.TongTienPhaiDong)}</td><td class="text-right" style="color:#e53e3e;">${fmt(d.SoTienConLai)}</td>`;
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
        // ...
      ],
      data: debtList
    })
  });
}