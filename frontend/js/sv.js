/* EduFee - ĐĂNG KÝ HỌC PHẦN (SV). Một bảng hiển thị TẤT CẢ lớp mở trong học kỳ;
 * mỗi dòng có nút Đăng ký / Hủy ngay; dòng đã đăng ký được tô nhẹ và cộng vào tổng. */
 document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['SV']);
  if (!me) return;

  const body = document.getElementById('selectedClassTableBody');
  const search = document.getElementById('searchClass');
  const totalCredits = document.getElementById('totalCreditsOut');
  const totalTuition = document.getElementById('totalTuitionOut');
  const rateDisplay = document.getElementById('tuitionRateDisplay');
  const termSelect = document.getElementById('termSelect');
  const btnSubmit = document.getElementById('btnSubmitRegistration');
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const tinChi = (tiet, tietMotTc) => (tietMotTc ? Math.floor(tiet / tietMotTc) : 0);

  let maHKNH = null, offerings = [], phieu = null;

  async function initTerm() {
    const hks = await EduFeeAPI.get('/semesters');
    if (termSelect) {
      termSelect.innerHTML = hks.map((h) => `<option value="${h.MaHKNH}">${h.MaHKNH} (${h.HocKy})</option>`).join('');
      termSelect.addEventListener('change', () => { maHKNH = termSelect.value; reloadData(); });
    }
    maHKNH = hks.length ? hks[0].MaHKNH : null;
    if (termSelect && maHKNH) termSelect.value = maHKNH;
  }

  async function loadProfile() {
    try {
      const r = await EduFeeAPI.get('/reports/student/' + me.MaSoSinhVien);
      setText('profName', r.thongTin.HoTen);
      setText('profId', r.thongTin.MaSoSinhVien);
      setText('profMajor', r.thongTin.Nganh || '—');
      setText('profClass', r.thongTin.Khoa || '—');
    } catch (e) {}
  }

  async function loadOfferings() {
    offerings = maHKNH ? await EduFeeAPI.get('/offerings?maHKNH=' + encodeURIComponent(maHKNH)) : [];
  }
  async function loadPhieu() {
    phieu = null;
    if (!maHKNH) return;
    const list = await EduFeeAPI.get('/enrollments?maHKNH=' + encodeURIComponent(maHKNH));
    if (list.length) phieu = await EduFeeAPI.get('/enrollments/' + list[0].MaPhieu);
  }
  function daDangKy(maMon) {
    return phieu && phieu.monHocList && phieu.monHocList.some((m) => m.MaMonHoc === maMon);
  }
  function thongTinLop(o) {
    const lmh = o.monHoc ? o.monHoc.loaiMonHoc : null;
    const stc = o.monHoc ? tinChi(o.monHoc.SoTiet, lmh.SoTietMotTinChi) : 0;
    const donGia = lmh ? Number(lmh.SoTienMotTinChi) : 0;
    return { ten: o.monHoc ? o.monHoc.TenMonHoc : o.MaMonHoc, loai: lmh ? lmh.TenLoaiMonHoc : '', stc, tamTinh: stc * donGia };
  }

  function render() {
    const kw = (search && search.value.trim().toLowerCase()) || '';
    const list = offerings.filter((o) => {
      const ten = o.monHoc ? o.monHoc.TenMonHoc.toLowerCase() : '';
      return o.MaMonHocMo.toLowerCase().includes(kw) || o.MaMonHoc.toLowerCase().includes(kw) || ten.includes(kw);
    });
    body.innerHTML = '';
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="7" class="text-center" style="color:#a0aec0;padding:24px;font-style:italic;">Không có lớp học phần mở trong học kỳ này.</td></tr>';
    } else list.forEach((o, i) => {
      const t = thongTinLop(o);
      const done = daDangKy(o.MaMonHoc);
      const full = o.SiSoHienTai >= o.SiSoToiDa;
      const tr = document.createElement('tr');
      if (done) tr.style.background = '#f0fff4';
      const action = done
        ? `<button class="btn-action btn-del" data-mon="${o.MaMonHoc}" title="Hủy đăng ký"><i class="ti ti-trash"></i></button>`
        : `<button class="btn-action btn-reg" data-mon="${o.MaMonHoc}" ${full ? 'disabled title="Đã đầy"' : 'title="Đăng ký"'}><i class="ti ti-plus"></i></button>`;
      tr.innerHTML = `<td>${i + 1}</td><td><strong>${o.MaMonHocMo}</strong></td><td>${t.ten}</td>
        <td class="text-center">${t.stc}</td><td>${t.loai}</td>
        <td class="text-right">${fmt(t.tamTinh)}</td>
        <td class="text-center">${action}</td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll('.btn-reg').forEach((b) => b.addEventListener('click', () => dangKy(b.dataset.mon)));
    body.querySelectorAll('.btn-del').forEach((b) => b.addEventListener('click', () => huy(b.dataset.mon)));

    // Tổng dựa trên các môn ĐÃ đăng ký
    const mons = (phieu && phieu.monHocList) || [];
    const tc = mons.reduce((s, m) => s + m.SoTinChi, 0);
    if (totalCredits) totalCredits.textContent = tc;
    if (totalTuition) totalTuition.textContent = phieu ? fmt(phieu.TongTienPhaiDong) : fmt(0);
    if (rateDisplay) {
      const loais = {};
      offerings.forEach((o) => { const l = o.monHoc && o.monHoc.loaiMonHoc; if (l) loais[l.TenLoaiMonHoc] = Number(l.SoTienMotTinChi); });
      const parts = Object.keys(loais).map((k) => `${k}: ${fmt(loais[k])}/TC`);
      rateDisplay.textContent = parts.length ? ('Đơn giá — ' + parts.join(' · ')) : '';
    }
  }

  async function dangKy(maMon) {
    try { await EduFeeAPI.post('/enrollments/courses', { MaHKNH: maHKNH, MaMonHoc: maMon }); await reloadData(); }
    catch (e) { alert(e.message); }
  }
  async function huy(maMon) {
    if (!phieu) return;
    try { await EduFeeAPI.del('/enrollments/' + phieu.MaPhieu + '/courses/' + maMon); await reloadData(); }
    catch (e) { alert(e.message); }
  }
  async function reloadData() { await loadOfferings(); await loadPhieu(); render(); }

  if (search) search.addEventListener('input', render);
  if (btnSubmit) btnSubmit.addEventListener('click', () =>
    alert('Các môn được lưu ngay khi bạn bấm Đăng ký. Sang trang "Học phí" để đóng tiền.'));

  await initTerm();
  await loadProfile();
  await reloadData();
});
