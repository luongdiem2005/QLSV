/* ============================================================================
 *  EduFee - CHẶN TRUY CẬP TRANG + ĐĂNG XUẤT TOÀN CỤC
 *  Nạp sau api.js. Mỗi trang nội bộ gọi EduFeeGuard.protect([...]) trong file js.
 *  Nút đăng xuất (#btnLogout / .btn-logout) được gắn TỰ ĐỘNG, không phụ thuộc
 *  vào việc trang có gọi protect() hay không.
 * ========================================================================== */
const EduFeeGuard = (() => {
  function bindLogout() {
    document.querySelectorAll('.btn-logout, #btnLogout, #logoutBtn, #btn-logout').forEach((btn) => {
      if (btn.dataset.logoutBound) return;
      btn.dataset.logoutBound = '1';
      btn.addEventListener('click', (e) => { e.preventDefault(); EduFeeAPI.logout(); });
    });
  }

  // Gắn đăng xuất ngay khi DOM sẵn sàng (độc lập với protect)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLogout);
  } else {
    bindLogout();
  }

  async function protect(allowedRoles = []) {
    if (!EduFeeAPI.getToken()) {
      window.location.href = EduFeeAPI.loginPath();
      return null;
    }
    let user;
    try {
      user = await EduFeeAPI.get('/auth/me');
    } catch (e) {
      EduFeeAPI.clearSession();
      window.location.href = EduFeeAPI.loginPath();
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.VaiTro)) {
      alert('Bạn không có quyền truy cập trang này.');
      window.location.href = EduFeeAPI.loginPath();
      return null;
    }
    const ten = user.HoTen || user.TenDangNhap;
    ['sidebar-username', 'sidebarAdminName', 'sidebar-admin-name', 'sidebar-student-name'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = ten;
    });
    // Nạp footer dùng chung (mọi trang nội bộ ở pages/<khu>/<file>.html)
    const fc = document.getElementById('shared-footer-container');
    if (fc && !fc.dataset.loaded) {
      try { fc.innerHTML = await (await fetch('../../components/footer.html')).text(); fc.dataset.loaded = '1'; } catch (e) {}
    }
    bindLogout(); // gắn lại phòng khi nút được render động
    return user;
  }

  return { protect, bindLogout };
})();
window.EduFeeGuard = EduFeeGuard;
