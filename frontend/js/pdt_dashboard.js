/* EduFee - DASHBOARD PHÒNG ĐÀO TẠO (nối API). Thay frontend/js/pdt_dashboard.js. */
document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PDT']);

  // Năm hiện tại ở footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nạp footer dùng chung nếu có khung chứa
  const footer = document.getElementById('shared-footer-container');
  if (footer) {
    try { footer.innerHTML = await (await fetch('../../components/footer.html')).text(); } catch (e) {}
  }

  // Hàm định dạng số với dấu phân cách
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Lấy học kỳ hiện tại
  async function getCurrentSemester() {
    try {
      const semesters = await EduFeeAPI.get('/semesters');
      const now = new Date();
      
      for (const sem of semesters) {
        const startDate = new Date(sem.NgayBatDau);
        const endDate = new Date(sem.NgayKetThuc);
        
        if (startDate <= now && now <= endDate) {
          return sem;
        }
      }
      
      // Nếu không có học kỳ hiện tại, trả về học kỳ gần nhất
      return semesters.length > 0 ? semesters[0] : null;
    } catch (e) {
      console.error('Lỗi lấy học kỳ:', e);
      return null;
    }
  }

  // Lấy và cập nhật tổng số sinh viên
  async function loadTotalStudents() {
    try {
      const studentData = await EduFeeAPI.get('/students?limit=1');
      const total = studentData.total || 0;
      const totalEl = document.getElementById('totalStudentCount');
      if (totalEl) {
        totalEl.textContent = formatNumber(total);
      }
    } catch (e) {
      console.error('Lỗi lấy tổng sinh viên:', e);
    }
  }

  // Hiển thị học kỳ hiện tại
  async function loadCurrentSemester() {
    try {
      const currentSem = await getCurrentSemester();
      const semesterDisplay = document.getElementById('currentSemesterDisplay');
      
      if (currentSem && semesterDisplay) {
        semesterDisplay.textContent = `${currentSem.MaHKNH} - Kỳ ${currentSem.HocKy}`;
      } else if (semesterDisplay) {
        semesterDisplay.textContent = 'Chưa có học kỳ nào';
      }
    } catch (e) {
      console.error('Lỗi hiển thị học kỳ:', e);
    }
  }

  // Biểu đồ học kỳ: chỉ vẽ nếu thư viện Chart đã được nạp trong HTML
  async function loadSemesterChart() {
    const canvas = document.getElementById('semesterChart');
    if (canvas && window.Chart) {
      try {
        const offerings = await EduFeeAPI.get('/offerings');
        
        // Nhóm dữ liệu theo học kỳ
        const semesterData = {};
        offerings.forEach(o => {
          if (!semesterData[o.MaHKNH]) {
            semesterData[o.MaHKNH] = 0;
          }
          semesterData[o.MaHKNH] += o.SiSoHienTai || 0;
        });

        const labels = Object.keys(semesterData);
        const data = Object.values(semesterData);

        const ctx = canvas.getContext('2d');
        new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Số sinh viên đăng ký',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
              }
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatNumber(value);
                  }
                }
              }
            }
          },
        });
      } catch (e) {
        console.error('Lỗi vẽ biểu đồ:', e);
      }
    }
  }

  // Gọi tất cả hàm
  await loadTotalStudents();
  await loadCurrentSemester();
  await loadSemesterChart();
});
