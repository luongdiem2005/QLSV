/* ============================================================================
 *  EduFee - XỬ LÝ ĐĂNG NHẬP (bản nối API thật, thay cho MOCK_USERS)
 *  Thay thế file frontend/js/auth.js cũ. Cần nạp api.js TRƯỚC file này.
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const errorMessageDiv = document.getElementById('error-message');
  const errorTextSpan = errorMessageDiv ? errorMessageDiv.querySelector('.error-text') : null;

  // Trang đích theo vai trò (đường dẫn tương đối từ index.html)
  const REDIRECT = {
    ADMIN: 'pages/admin/admin.html',
    PDT: 'pages/academic/pdt.html',
    PTC: 'pages/finance/ptc.html',
    SV: 'pages/student/sv.html',
  };

  function showError(message) {
    if (!errorMessageDiv || !errorTextSpan) { alert(message); return; }
    errorTextSpan.textContent = message;
    errorMessageDiv.classList.remove('hidden');
    errorMessageDiv.style.animation = 'none';
    errorMessageDiv.offsetHeight; // reflow để reset animation
    errorMessageDiv.style.animation = 'shake 0.3s ease-in-out';
  }
  function hideError() {
    if (errorMessageDiv) errorMessageDiv.classList.add('hidden');
  }

  // Ẩn/hiện mật khẩu (giữ nguyên hành vi cũ)
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      const icon = togglePasswordBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('ti-eye', !isPassword);
        icon.classList.toggle('ti-eye-off', isPassword);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (!username) { showError('Vui lòng nhập tên đăng nhập hoặc mã số.'); usernameInput.focus(); return; }
      if (!password) { showError('Vui lòng nhập mật khẩu.'); passwordInput.focus(); return; }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        // Gọi API thật -> server trả token + user (kèm VaiTro lấy từ DB)
        const user = await EduFeeAPI.login(username, password);
        window.location.href = REDIRECT[user.VaiTro] || 'index.html';
      } catch (err) {
        showError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
        passwordInput.value = '';
        passwordInput.focus();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
