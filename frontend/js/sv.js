/* EduFee - ĐĂNG KÝ HỌC PHẦN (SV, nối API). Thay frontend/js/sv.js.
 * Cần chọn học kỳ: file dùng học kỳ mới nhất từ /api/semesters. Nếu HTML có
 * <select id="termSelect"> thì sẽ dùng để chọn học kỳ. */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['SV']);
  if (!me) return;

  const availBody = document.getElementById('availableClassTableBody');
  const selBody = document.getElementById('selectedClassTableBody');
  const cartBadge = document.getElementById('cartCountBadge');
  const totalCredits = document.getElementById('totalCreditsOut');
  const totalTuition = document.getElementById('totalTuitionOut');
  const search = document.getElementById('searchClass');
  const btnSubmit = document.getElementById('btnSubmitRegistration');
  const termSelect = document.getElementById('termSelect'); // tùy chọn

  // Thông tin SV bên hồ sơ
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  let maHKNH = null, offerings = [], phieu = null;
  const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';

  async function initTerm() {
    const hks = await EduFeeAPI.get('/semesters');
    if (termSelect) {
      termSelect.innerHTML = hks.map(h => `<option value="${h.MaHKNH}">${h.MaHKNH} (${h.HocKy})</option>`).join('');
      termSelect.addEventListener('change', () => { maHKNH = termSelect.value; reloadAll(); });
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
    if (!maHKNH) { offerings = []; return; }
    offerings = await EduFeeAPI.get('/offerings?maHKNH=' + encodeURIComponent(maHKNH));
  }

  async function loadPhieu() {
    phieu = null;
    if (!maHKNH) return;
    const list = await EduFeeAPI.get('/enrollments?maHKNH=' + encodeURIComponent(maHKNH));
    if (list.length) phieu = await EduFeeAPI.get('/enrollments/' + list[0].MaPhieu);
  }

  function daDangKy(maMon) {
    return phieu && phieu.monHocList && phieu.monHocList.some(m => m.MaMonHoc === maMon);
  }

  function renderAvailable() {
    const kw = (search && search.value.trim().toLowerCase()) || '';
    availBody.innerHTML = '';
    const list = offerings.filter(o => {
      const ten = o.monHoc ? o.monHoc.TenMonHoc.toLowerCase() : '';
      return o.MaMonHoc.toLowerCase().includes(kw) || ten.includes(kw);
    });
    if (!list.length) { availBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:20px;color:#718096;">Không có lớp mở.</td></tr>'; return; }
    list.forEach(o => {
      const ten = o.monHoc ? o.monHoc.TenMonHoc : o.MaMonHoc;
      const full = o.SiSoHienTai >= o.SiSoToiDa;
      const done = daDangKy(o.MaMonHoc);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.MaMonHoc}</td><td>${ten}</td><td>${o.MaMonHocMo}</td>
        <td>${o.SiSoHienTai}/${o.SiSoToiDa}</td><td>${full ? 'Đầy' : 'Còn'}</td>
        <td class="text-center">${done ? '<span style="color:#38a169;">Đã ĐK</span>'
          : `<button class="btn-action btn-reg" data-mon="${o.MaMonHoc}" ${full ? 'disabled' : ''}><i class="ti ti-plus"></i></button>`}</td>`;
      availBody.appendChild(tr);
    });
    availBody.querySelectorAll('.btn-reg').forEach(b => b.addEventListener('click', () => dangKy(b.dataset.mon)));
  }

  function renderSelected() {
    selBody.innerHTML = '';
    const mons = (phieu && phieu.monHocList) || [];
    if (cartBadge) cartBadge.textContent = mons.length;
    if (!mons.length) { selBody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#718096;">Chưa chọn môn.</td></tr>'; }
    else mons.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.MaMonHoc}</td><td>${m.TenMonHoc}</td><td>${m.SoTinChi}</td><td>${m.LoaiMon}</td>
        <td class="text-center"><button class="btn-action btn-del" data-mon="${m.MaMonHoc}"><i class="ti ti-trash"></i></button></td>`;
      selBody.appendChild(tr);
    });
    selBody.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => huy(b.dataset.mon)));
    const tc = mons.reduce((s, m) => s + m.SoTinChi, 0);
    if (totalCredits) totalCredits.textContent = tc;
    if (totalTuition) totalTuition.textContent = phieu ? fmt(phieu.TongTienPhaiDong) : fmt(0);
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
  async function reloadData() { await loadOfferings(); await loadPhieu(); renderAvailable(); renderSelected(); }
  async function reloadAll() { await reloadData(); }

  if (search) search.addEventListener('input', renderAvailable);
  if (btnSubmit) btnSubmit.addEventListener('click', () => alert('Các môn đã được lưu ngay khi bấm Đăng ký. Bạn có thể sang trang Học phí để đóng tiền.'));

  await initTerm();
  await loadProfile();
  await reloadData();
});
