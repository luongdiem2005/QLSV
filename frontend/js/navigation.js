/* ==========================================================================
   LOGIC ĐIỀU HƯỚNG VÀ CHUẨN HÓA ACTIVE MENU (NAVIGATION.JS)
   ========================================================================= */

   document.addEventListener('DOMContentLoaded', function() {
    // 1. Chạy hàm tự động active menu dựa theo URL hiện tại của trang
    setActiveMenu();

    // 2. Lắng nghe và xử lý sự kiện nút Đăng xuất (Logout Button)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?')) {
                // Định vị lại đường dẫn quay về trang chủ đăng nhập ở gốc dự án
                // Tùy thuộc vào vị trí file hiện tại, ta tính toán số cấp thư mục cần đi ra
                const currentPath = window.location.pathname;
                
                if (currentPath.includes('/pages/')) {
                    // Nếu đang ở trong thư mục con (ví dụ: pages/academic/pdt.html) -> lùi ra 2 cấp
                    window.location.href = '../../index.html';
                } else {
                    // Nếu đang ở thư mục gốc
                    window.location.href = 'index.html';
                }
            }
        });
    }
});

/**
 * Hàm tự động kiểm tra URL hiện tại và gán class 'active' cho item tương ứng
 */
function setActiveMenu() {
    // Lấy toàn bộ đường dẫn URL của trang hiện tại (Ví dụ: /pages/academic/pdt_sv.html)
    const currentPath = window.location.pathname;
    
    // Tách lấy tên file thực tế ở cuối cùng (Ví dụ: pdt_sv.html)
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    // Lấy tất cả các thẻ li đại diện cho các mục menu trong Sidebar
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');

    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;

        // Lấy giá trị thuộc tính href của menu (Ví dụ: pdt_sv.html hoặc pdt.html)
        const menuHref = link.getAttribute('href');
        
        // Trích xuất tên file từ href đề phòng trường hợp ghi đường dẫn tương đối dài
        const menuPageFile = menuHref.substring(menuHref.lastIndexOf('/') + 1);

        // So sánh: Nếu tên file trùng khớp hoặc URL hiện tại chứa file menu này
        if (currentPageFile === menuPageFile && menuPageFile !== '') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}