/* EduFee - QUẢN TRỊ HỆ THỐNG (nối API). Thay frontend/js/admin.js.
 * Quản lý tài khoản qua /api/admin/accounts (đổi vai trò, khóa/mở, xóa).
 * Thêm tài khoản qua nút #btnAddAccount (nếu HTML có) bằng hộp thoại nhanh. */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['ADMIN']);
  if (!me) return;

  const tbody = document.getElementById('adminUserTableBody');
  const lblTotal = document.getElementById('lblTotalUsers');
  const lblStorage = document.getElementById('lblStorageSize');
  const logStream = document.getElementById('logStreamContainer');
  const VAITRO = ['ADMIN', 'PDT', 'PTC', 'SV'];
  let accounts = [];

  function log(msg) {
    if (!logStream) return;
    const div = document.createElement('div');
    div.className = 'log-info';
    div.textContent = `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`;
    logStream.prepend(div);
  }

  async function load() {
    accounts = await EduFeeAPI.get('/admin/accounts');
    if (lblTotal) lblTotal.textContent = accounts.length;
    if (lblStorage) {
      try { const params = await EduFeeAPI.get('/admin/params'); lblStorage.textContent = params.length + ' tham số'; }
      catch (e) {}
    }
    tbody.innerHTML = '';
    accounts.forEach(a => {
      const tr = document.createElement('tr');
      const roleOpts = VAITRO.map(r => `<option value="${r}" ${r === a.VaiTro ? 'selected' : ''}>${r}</option>`).join('');
      tr.innerHTML = `<td><strong>${a.TenDangNhap}</strong></td><td>${a.HoTen || ''}</td>
        <td><select class="role-select" data-user="${a.TenDangNhap}">${roleOpts}</select></td>
        <td><button class="btn-status" data-user="${a.TenDangNhap}" data-active="${a.TrangThai}">
            ${a.TrangThai ? 'Đang hoạt động' : 'Đã khóa'}</button></td>
        <td class="text-center"><button class="btn-action btn-del" data-user="${a.TenDangNhap}"><i class="ti ti-trash"></i></button></td>`;
      tbody.appendChild(tr);
    });
    bind();
  }

  function bind() {
    tbody.querySelectorAll('.role-select').forEach(sel => sel.addEventListener('change', async () => {
      try { await EduFeeAPI.put('/admin/accounts/' + sel.dataset.user, { VaiTro: sel.value }); log(`Đổi vai trò ${sel.dataset.user} -> ${sel.value}`); }
      catch (e) { alert(e.message); load(); }
    }));
    tbody.querySelectorAll('.btn-status').forEach(btn => btn.addEventListener('click', async () => {
      const newActive = btn.dataset.active !== 'true';
      try { await EduFeeAPI.put('/admin/accounts/' + btn.dataset.user, { TrangThai: newActive }); log(`${newActive ? 'Mở' : 'Khóa'} tài khoản ${btn.dataset.user}`); load(); }
      catch (e) { alert(e.message); }
    }));
    tbody.querySelectorAll('.btn-del').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Xóa tài khoản ' + btn.dataset.user + '?')) return;
      try { await EduFeeAPI.del('/admin/accounts/' + btn.dataset.user); log(`Xóa tài khoản ${btn.dataset.user}`); load(); }
      catch (e) { alert(e.message); }
    }));
  }

  const btnAdd = document.getElementById('btnAddAccount');
  if (btnAdd) btnAdd.addEventListener('click', async () => {
    const u = prompt('Tên đăng nhập:'); if (!u) return;
    const pw = prompt('Mật khẩu (>=6 ký tự):'); if (!pw) return;
    const role = prompt('Vai trò (ADMIN/PDT/PTC/SV):', 'PDT'); if (!role) return;
    const body = { TenDangNhap: u, MatKhau: pw, VaiTro: role, HoTen: prompt('Họ tên:') || '' };
    if (role === 'SV') body.MaSoSinhVien = prompt('Mã số sinh viên gắn với tài khoản:') || '';
    try { await EduFeeAPI.post('/admin/accounts', body); log(`Tạo tài khoản ${u}`); load(); }
    catch (e) { alert(e.message); }
  });

  await load();
  log('Đã tải danh sách tài khoản.');
});
