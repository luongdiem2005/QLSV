/* ============================================================================
 *  EduFee - CHẶN TRUY CẬP TRANG (thay cho đoạn đọc edufee_session ở đầu mỗi trang)
 *  Cách dùng ở mỗi trang nội bộ (sau khi đã nạp api.js):
 *      <script src="../../js/api.js"></script>
 *      <script src="../../js/auth-guard.js"></script>
 *      <script>EduFeeGuard.protect(['PDT']);</script>
 * ========================================================================== */
const EduFeeGuard = (() => {
    /**
     * Bảo vệ trang: yêu cầu đăng nhập + đúng vai trò.
     * @param {string[]} allowedRoles - các vai trò được phép (vd ['PDT'])
     * @returns {Promise<object|null>} thông tin user nếu hợp lệ
     */
    async function protect(allowedRoles = []) {
      if (!EduFeeAPI.getToken()) {
        window.location.href = EduFeeAPI.loginPath();
        return null;
      }
      let user;
      try {
        // Xác thực lại với server (token còn hạn? tài khoản còn hoạt động?)
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
  
      // Hiển thị tên người dùng vào các ô thường gặp (nếu trang có)
      const ten = user.HoTen || user.TenDangNhap;
      ['sidebar-username', 'sidebarAdminName', 'sidebar-admin-name'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = ten;
      });
  
      // Gắn sự kiện đăng xuất cho mọi nút có class .btn-logout hoặc id logoutBtn
      document.querySelectorAll('.btn-logout, #logoutBtn, #btn-logout').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.preventDefault(); EduFeeAPI.logout(); });
      });
  
      return user;
    }
  
    return { protect };
  })();
  
  window.EduFeeGuard = EduFeeGuard;
  