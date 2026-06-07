/* EduFee - HỌC PHÍ SINH VIÊN: chi tiết phiếu đăng ký 1 học kỳ + đóng học phí. */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['SV']);
  if (!me) return;

  const $ = (id) => document.getElementById(id);
  const tbody = $('tuitionDetailTableBody');
  const sumTotal = $('sumTotal'), sumDiscount = $('sumDiscount'), sumPaid = $('sumPaid'), sumDebt = $('sumDebt');
  const badge = $('paymentStatusBadge');
  const lblPolicyName = $('lblPolicyName'), lblPolicyRate = $('lblPolicyRate');
  const invoiceId = $('invoiceIdOut'), invoiceDate = $('invoiceDateOut');
  const btnPay = $('btnExecutePayment');
  const termSelect = $('selectTuitionTerm');
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  setText('sidebar-student-name', me.HoTen || me.TenDangNhap);

  let maHKNH = null, phieu = null, offerings = [];

  async function initTerm() {
    const hks = await EduFeeAPI.get('/semesters');
    if (termSelect) {
      termSelect.innerHTML = hks.map((h) => `<option value="${h.MaHKNH}">${h.MaHKNH} (${h.HocKy})</option>`).join('');
      termSelect.addEventListener('change', () => { maHKNH = termSelect.value; loadData(); });
    }
    maHKNH = hks.length ? hks[0].MaHKNH : null;
    if (termSelect && maHKNH) termSelect.value = maHKNH;
  }

  async function loadProfile() {
    try {
      const t = (await EduFeeAPI.get('/reports/student/' + me.MaSoSinhVien)).thongTin;
      if (lblPolicyName) lblPolicyName.textContent = t.DoiTuongUuTien || 'Không thuộc diện ưu tiên';
      if (lblPolicyRate) lblPolicyRate.textContent = (t.TyLeMienGiam || 0) + '%';
    } catch (e) {}
  }

  function maLopCuaMon(maMon) {
    const o = offerings.find((x) => x.MaMonHoc === maMon);
    return o ? o.MaMonHocMo : maMon;
  }

  async function loadData() {
    phieu = null;
    if (maHKNH) {
      offerings = await EduFeeAPI.get('/offerings?maHKNH=' + encodeURIComponent(maHKNH)).catch(() => []);
      const list = await EduFeeAPI.get('/enrollments?maHKNH=' + encodeURIComponent(maHKNH));
      if (list.length) phieu = await EduFeeAPI.get('/enrollments/' + list[0].MaPhieu);
    }
    render();
  }

  function render() {
    // Thông tin phiếu
    if (invoiceId) invoiceId.textContent = phieu ? phieu.MaPhieu : '—';
    if (invoiceDate) invoiceDate.textContent = (phieu && phieu.NgayLapPhieu) ? new Date(phieu.NgayLapPhieu).toLocaleDateString('vi-VN') : '—';

    // Bảng chi tiết môn
    tbody.innerHTML = '';
    const mons = (phieu && phieu.monHocList) || [];
    if (!mons.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:20px;color:#718096;">Chưa đăng ký môn nào trong học kỳ này.</td></tr>';
    } else mons.forEach((m, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${maLopCuaMon(m.MaMonHoc)}</td><td>${m.TenMonHoc}</td>
        <td class="text-center">${m.SoTinChi}</td><td>${m.LoaiMon}</td>
        <td class="text-right">${fmt(m.DonGiaTinChi)}</td><td class="text-right">${fmt(m.ThanhTien)}</td>`;
      tbody.appendChild(tr);
    });

    // Tổng tiền
    if (sumTotal) sumTotal.textContent = fmt(phieu ? phieu.TongTienDK : 0);
    if (sumDiscount) sumDiscount.textContent = fmt(phieu ? phieu.TienMienGiam : 0);
    if (sumPaid) sumPaid.textContent = fmt(phieu ? phieu.SoTienDaDong : 0);
    if (sumDebt) sumDebt.textContent = fmt(phieu ? phieu.SoTienConLai : 0);

    const conLai = phieu ? Number(phieu.SoTienConLai) : 0;
    if (badge) {
      badge.textContent = !phieu ? 'Chưa đăng ký' : conLai <= 0 ? 'Đã hoàn thành' : 'Còn nợ';
      badge.style.color = (phieu && conLai <= 0) ? '#38a169' : '#e53e3e';
    }
    // Bật/tắt nút thanh toán
    if (btnPay) {
      const canPay = !!phieu && conLai > 0;
      btnPay.disabled = !canPay;
      btnPay.style.opacity = canPay ? '1' : '0.6';
      btnPay.style.cursor = canPay ? 'pointer' : 'not-allowed';
    }
  }

  if (btnPay) btnPay.addEventListener('click', async () => {
    if (!phieu) { alert('Bạn chưa đăng ký học phần trong học kỳ này.'); return; }
    const conLai = Number(phieu.SoTienConLai);
    if (conLai <= 0) { alert('Học phí học kỳ này đã hoàn thành.'); return; }
    const input = prompt(`Số tiền còn phải đóng: ${fmt(conLai)}.\nNhập số tiền muốn đóng:`, String(conLai));
    if (input === null) return;
    const soTien = Number(input);
    if (!soTien || soTien <= 0) { alert('Số tiền không hợp lệ.'); return; }
    if (soTien > conLai) { alert('Số tiền vượt quá số còn phải đóng.'); return; }
    try {
      await EduFeeAPI.post('/payments', { MaPhieuDK: phieu.MaPhieu, SoTienThu: soTien });
      alert('Đóng học phí thành công!');
      loadData();
    } catch (e) { alert(e.message); }
  });

  await initTerm();
  await loadProfile();
  await loadData();
});
