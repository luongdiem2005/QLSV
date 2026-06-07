/* EduFee - LỊCH SỬ ĐĂNG KÝ HỌC PHẦN (SV): liệt kê CÁC MÔN sinh viên đã đăng ký
 * qua các học kỳ (gộp từ mọi phiếu đăng ký). */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await EduFeeGuard.protect(['SV']);
  if (!me) return;

  const $ = (id) => document.getElementById(id);
  const tbody = $('regHistoryTableBody');
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

  async function load() {
    const phieuList = await EduFeeAPI.get('/enrollments');
    if (!phieuList.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;color:#718096;">Bạn chưa đăng ký môn học nào.</td></tr>';
      return;
    }
    // Lấy chi tiết từng phiếu để có danh sách môn
    const details = await Promise.all(phieuList.map((p) => EduFeeAPI.get('/enrollments/' + p.MaPhieu)));
    const rows = [];
    details.forEach((p) => {
      const conLai = Number(p.SoTienConLai);
      const trangThai = conLai <= 0
        ? '<span style="color:#38a169;">Đã đóng đủ</span>'
        : '<span style="color:#e53e3e;">Còn nợ</span>';
      (p.monHocList || []).forEach((m) => rows.push({ ...m, MaHKNH: p.MaHKNH, trangThai }));
    });
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;color:#718096;">Bạn chưa đăng ký môn học nào.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    rows.forEach((m, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td><strong>${m.MaMonHoc}</strong></td><td>${m.TenMonHoc}</td>
        <td class="text-center">${m.SoTinChi}</td><td>${m.LoaiMon}</td>
        <td class="text-center">${m.MaHKNH}</td>
        <td class="text-right">${fmt(m.ThanhTien)}</td>
        <td class="text-center">${m.trangThai}</td>`;
      tbody.appendChild(tr);
    });
    if (window.EduFeeExcel) EduFeeExcel.mountTableButton({ table: '.data-table', filename: 'LichSuDangKy_' + me.MaSoSinhVien, label: 'Xuất Excel' });
  }

  await load();
});
