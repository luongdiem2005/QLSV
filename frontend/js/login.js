/* ==========================================================================
   LOGIC XỬ LÝ ĐĂNG NHẬP PHÍA CLIENT (LOGIN.JS)
   ========================================================================== */

   document.addEventListener('DOMContentLoaded', function() {
    // 1. Khai báo các phần tử DOM cần thiết
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userRoleSelect = document.getElementById('userRole');
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // 2. Xử lý tính năng Ẩn / Hiện mật khẩu
    if (btnTogglePassword && passwordInput) {
        btnTogglePassword.addEventListener('click', function() {
            // Thay đổi qua lại giữa 'password' và 'text'
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Thay đổi icon tương ứng của Tabler Icons
            const icon = this.querySelector('i');
            if (isPassword) {
                icon.className = 'ti ti-eye-off';
                this.setAttribute('title', 'Ẩn mật khẩu');
            } else {
                icon.className = 'ti ti-eye';
                this.setAttribute('title', 'Hiện mật khẩu');
            }
        });
    }

    // 3. Xử lý sự kiện Submit Form Đăng nhập
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Ngăn chặn form tải lại trang theo cách truyền thống

            // Lấy giá trị và xóa khoảng trắng thừa ở 2 đầu
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const selectedRole = userRoleSelect.value;

            // Ẩn thông báo lỗi cũ trước khi kiểm tra mới
            errorMessage.style.display = 'none';

            // Bước Validation cơ bản (Kiểm tra dữ liệu rỗng)
            if (username === '' || password === '') {
                showError('Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu!');
                return;
            }

            // Giai đoạn Frontend: Giả lập (Mock) kiểm tra đăng nhập thành công
            // (Khi kết nối Backend, đoạn này sẽ được thay bằng hàm fetch/axios API)
            if (password.length < 4) {
                showError('Mật khẩu phải chứa ít nhất từ 4 ký tự trở lên!');
                return;
            }

            // Xử lý điều hướng linh hoạt dựa trên Vai trò (Role-based Navigation)
            // Vì index.html nằm ở gốc, các trang phân hệ nằm trong thư mục pages/
            switch (selectedRole) {
                case 'academic':
                    window.location.href = 'pages/academic/pdt.html';
                    break;
                case 'finance':
                    window.location.href = 'pages/finance/ptc.html';
                    break;
                case 'student':
                    // Dự phòng đường dẫn cho phân hệ Sinh viên sẽ xây dựng mới sau này
                    window.location.href = 'pages/student/dkhp.html';
                    break;
                case 'admin':
                    window.location.href = 'pages/admin/admin.html';
                    break;
                default:
                    showError('Vai trò đăng nhập hệ thống không hợp lệ!');
            }
        });
    }

    // Hàm tiện ích hiển thị thông báo lỗi lên UI
    function showError(message) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
        }
    }
});