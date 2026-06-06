/* EduFee - DASHBOARD TÀI CHÍNH (PTC, nối API). Thay frontend/js/ptc.js.
 * KPI tổng hợp từ /api/enrollments của học kỳ mới nhất; công nợ từ /api/reports/unpaid. */
 document.addEventListener('DOMContentLoaded', async () => {
    await EduFeeGuard.protect(['PTC', 'PDT', 'ADMIN']);
    const tbody = document.getElementById('masterDebtTableBody');
    const searchDebt = document.getElementById('searchStudentDebt');
    const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    let maHKNH = null, debtList = [];
  
    async function init() {
      const hks = await EduFeeAPI.get('/semesters');
      maHKNH = hks.length ? hks[0].MaHKNH : null;
      if (!maHKNH) return;
  
      // KPI từ toàn bộ phiếu của học kỳ
      const phieuList = await EduFeeAPI.get('/enrollments?maHKNH=' + encodeURIComponent(maHKNH));
      let gross = 0, discount = 0, paid = 0, debt = 0;
      // Cần chi tiết tiền -> gọi từng phiếu (số lượng nhỏ trong đồ án)
      for (const p of phieuList) {
        const d = await EduFeeAPI.get('/enrollments/' + p.MaPhieu);
        gross += Number(d.TongTienDK); discount += Number(d.TienMienGiam);
        paid += Number(d.SoTienDaDong); debt += Number(d.SoTienConLai);
      }
      setText('kpiTotalGross', fmt(gross));
      setText('kpiTotalDiscount', fmt(discount));
      setText('kpiTotalPaid', fmt(paid));
      setText('kpiTotalDebt', fmt(debt));
      const tongPhaiDong = gross - discount;
      const pct = tongPhaiDong > 0 ? Math.round((paid / tongPhaiDong) * 100) : 0;
      setText('lblPercentageOutput', pct + '%');
      const barPaid = document.getElementById('barPaid');
      const barDebt = document.getElementById('barDebt');
      if (barPaid) barPaid.style.width = pct + '%';
      if (barDebt) barDebt.style.width = (100 - pct) + '%';
  
      // Bảng công nợ
      const rep = await EduFeeAPI.get('/reports/unpaid?maHKNH=' + encodeURIComponent(maHKNH));
      debtList = rep.danhSach;
      renderDebt();
    }
  
    function renderDebt() {
      const kw = (searchDebt && searchDebt.value.trim().toLowerCase()) || '';
      const rows = debtList.filter(d => d.MaSoSinhVien.toLowerCase().includes(kw) || d.HoTen.toLowerCase().includes(kw));
      tbody.innerHTML = '';
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Không có sinh viên nợ học phí.</td></tr>'; return; }
      rows.forEach((d, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${d.MaSoSinhVien}</td><td>${d.HoTen}</td>
          <td class="text-right">${fmt(d.TongTienPhaiDong)}</td><td class="text-right" style="color:#e53e3e;">${fmt(d.SoTienConLai)}</td>`;
        tbody.appendChild(tr);
      });
    }
    if (searchDebt) searchDebt.addEventListener('input', renderDebt);
  
    await init();
  });
  