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
  
    // Một vài số liệu thật (nếu trang có ô hiển thị tương ứng)
    try {
      const sv = await EduFeeAPI.get('/students?limit=1');
      const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setText('kpiTotalStudents', sv.total);
    } catch (e) {}
  
    // Biểu đồ học kỳ: chỉ vẽ nếu thư viện Chart đã được nạp trong HTML
    const canvas = document.getElementById('semesterChart');
    if (canvas && window.Chart) {
      try {
        const offs = await EduFeeAPI.get('/offerings');
        const ctx = canvas.getContext('2d');
        new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: offs.map(o => o.MaMonHocMo),
            datasets: [{ label: 'Sĩ số hiện tại', data: offs.map(o => o.SiSoHienTai) }],
          },
          options: { responsive: true },
        });
      } catch (e) {}
    }
  });
  