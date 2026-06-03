/**
 * ==========================================================================
 * CONTROLLER XỬ LÝ LOGIC MÀN HÌNH DASHBOARD PHÒNG ĐÀO TẠ
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Gọi các hàm khởi tạo khi cây DOM đã sẵn sàng
    initDashboardUser();
    initSemesterChart();
    initLogoutForm();
});

/**
 * 1. Hàm hiển thị thông tin cán bộ đăng nhập
 */
function initDashboardUser() {
    const session = localStorage.getItem('edufee_session');
    const usernameDisplay = document.getElementById('sidebar-username');
    
    if (session && usernameDisplay) {
        const userData = JSON.parse(session);
        // Chuẩn hóa hiển thị: Viết hoa tên tài khoản để tăng tính thẩm mỹ
        usernameDisplay.textContent = userData.username.toUpperCase();
    }
}

/**
 * 2. Hàm vẽ biểu đồ thống kê Đăng ký môn học (Sử dụng Chart.js)
 */
function initSemesterChart() {
    const ctx = document.getElementById('semesterChart');
    
    // Kiểm tra xem thẻ canvas có tồn tại trên DOM hiện tại hay không để tránh lỗi Crash Script
    if (!ctx) return;

    // Dữ liệu giả lập (Mock Data) phản ánh số liệu từ các học kỳ gần nhất
    const chartData = {
        labels: ['HK1 / 2024-2025', 'HK2 / 2024-2025', 'HK1 / 2025-2026', 'HK2 / 2025-2026'],
        datasets: [{
            label: 'Số lượng sinh viên đăng ký học phần thành công',
            data: [980, 1120, 1050, 1250], // Tương ứng với các cột số liệu
            backgroundColor: 'rgba(49, 130, 206, 0.2)', // Màu nền của cột (Xanh thương hiệu chủ đạo - nhạt)
            borderColor: 'rgba(49, 130, 206, 1)',     // Màu đường viền cột (Xanh đậm)
            borderWidth: 2,
            borderRadius: 6, // Bo góc nhẹ cho các đỉnh cột để giao diện hiện đại hơn
            barThickness: 40 // Độ rộng cố định của từng cột dữ liệu
        }]
    };

    // Cấu hình các tùy chọn hiển thị và tính năng Responsive cho biểu đồ
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Cho phép biểu đồ co giãn vừa vặn với container .chart-wrapper trong CSS
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: { family: "'Inter', sans-serif", size: 13, weight: 500 },
                    color: '#4a5568'
                }
            },
            tooltip: {
                padding: 12,
                cornerRadius: 8,
                backgroundColor: '#1a202c'
            }
        },
        scales: {
            y: {
                beginAtZero: true, // Trục Y luôn bắt đầu từ giá trị 0
                grid: { color: '#edf2f7' },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#718096'
                }
            },
            x: {
                grid: { display: false }, // Ẩn đường lưới dọc để biểu đồ trông thoáng đãng hơn
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#718096'
                }
            }
        }
    };

    // Khởi tạo đối tượng Biểu đồ cột (Bar Chart)
    new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

/**
 * 3. Hàm xử lý nghiệp vụ Đăng xuất (Logout)
 */
function initLogoutForm() {
    const btnLogout = document.getElementById('btnLogout');
    
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hiển thị hộp thoại xác nhận chuẩn UI/UX nghiệp vụ phần mềm
            const confirmLogout = confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống EduFee?');
            
            if (confirmLogout) {
                // Xóa sạch dữ liệu phiên làm việc để bảo mật thông tin trạm làm việc
                localStorage.removeItem('edufee_session');
                
                // Điều hướng an toàn đưa người dùng quay trở lại trang đăng nhập gốc
                window.location.href = '../../index.html';
            }
        });
    }
}