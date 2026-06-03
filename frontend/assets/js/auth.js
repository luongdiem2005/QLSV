/**
 * ==========================================================================
 * MODULE XỬ LÝ XÁC THỰC VÀ PHÂN QUYỀN (Client-side Authentication)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khai báo các phần tử DOM cần tương tác
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const errorMessageDiv = document.getElementById('error-message');
    const errorTextSpan = errorMessageDiv.querySelector('.error-text');

    // 2. Tài khoản giả lập (Mock Data) phục vụ giai đoạn phát triển Frontend
    // Định nghĩa rõ ràng: Username -> Role tương ứng và Trang đích (Redirect URL)
    const MOCK_USERS = {
        'pdt': { password: '123', role: 'PDT', redirect: 'pages/academic/pdt.html' },
        'ptc': { password: '123', role: 'PTC', redirect: 'pages/finance/ptc.html' },
        'student': { password: '123', role: 'STUDENT', redirect: 'pages/student/sv.html' },
        'admin': { password: '123', role: 'ADMIN', redirect: 'pages/admin/admin.html' }
    };

    /**
     * Hàm hiển thị thông báo lỗi động trên giao diện
     * @param {string} message - Nội dung lỗi cần hiển thị
     */
    function showError(message) {
        errorTextSpan.textContent = message;
        errorMessageDiv.classList.remove('hidden');
        
        // Tạo hiệu ứng rung nhẹ (Shake effect) bằng cách thêm class để thu hút sự chú ý
        errorMessageDiv.style.animation = 'none';
        errorMessageDiv.offsetHeight; // Kích hoạt reflow để reset animation
        errorMessageDiv.style.animation = 'shake 0.3s ease-in-out';
    }

    /**
     * Hàm ẩn thông báo lỗi
     */
    function hideError() {
        errorMessageDiv.classList.add('hidden');
    }

    // 3. Sự kiện Ẩn/Hiện mật khẩu (Toggle Password Visibility)
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            // Kiểm tra kiểu hiện tại của ô input
            const isPassword = passwordInput.getAttribute('type') === 'password';
            
            // Thay đổi thuộc tính type tương ứng
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Thay đổi Icon hiển thị (Mắt mở / Mắt đóng)
            const icon = togglePasswordBtn.querySelector('i');
            if (isPassword) {
                icon.classList.remove('ti-eye');
                icon.classList.add('ti-eye-off');
                togglePasswordBtn.setAttribute('aria-label', 'Ẩn mật khẩu');
            } else {
                icon.classList.remove('ti-eye-off');
                icon.classList.add('ti-eye');
                togglePasswordBtn.setAttribute('aria-label', 'Hiển thị mật khẩu');
            }
        });
    }

    // 4. Sự kiện Xử lý Đăng nhập khi Submit Form
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // Chặn hành vi tải lại trang mặc định của Form HTML
            e.preventDefault(); 
            hideError();

            // Thu thập dữ liệu và làm sạch khoảng trắng (Trim)
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // --- BƯỚC VALIDATE (Kiểm tra dữ liệu đầu vào tại Client) ---
            if (!username) {
                showError('Vui lòng nhập tên đăng nhập hoặc mã số.');
                usernameInput.focus();
                return;
            }

            if (!password) {
                showError('Vui lòng nhập mật khẩu.');
                passwordInput.focus();
                return;
            }

            // --- BƯỚC AUTHENTICATION (Xác thực thông tin) ---
            const user = MOCK_USERS[username.toLowerCase()];

            if (user && user.password === password) {
                // Đăng nhập thành công!
                
                // Lưu thông tin phiên làm việc vào localStorage để các trang sau kiểm tra quyền truy cập
                const sessionData = {
                    username: username,
                    role: user.role,
                    loginAt: new Date().toISOString()
                };
                localStorage.setItem('edufee_session', JSON.stringify(sessionData));

                // Thực hiện điều hướng (Redirect) theo phân hệ tương ứng của User Role
                window.location.href = user.redirect;
            } else {
                // Thất bại: Hiển thị thông báo lỗi
                showError('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!');
                passwordInput.value = ''; // Xóa mật khẩu cũ để người dùng nhập lại
                passwordInput.focus();
            }
        });
    }
});