/* EduFee - LỊCH SỬ ĐĂNG KÝ HỌC PHẦN (SV). Liệt kê tất cả phiếu đăng ký qua các
 * học kỳ; bấm "Chi tiết" để xem các môn của phiếu (modal). */
document.addEventListener('DOMContentLoaded', async () => {
    const me = await EduFeeGuard.protect(['SV']);
    if (!me) return;
  
    const $ = (id) => document.getElementById(id);
    const tbody = $('regHistoryTableBody');
    const modal = $('regDetailModal');
    const detailBody = $('regDetailBody');
    const detailMeta = $('regDetailMeta');
    const detailTitle = $('regDetailTitle');
    const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
    const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    setText('sidebar-student-name', me.HoTen || me.TenDangNhap);
  
    let phieuList = [];
  
    async function load() {
      phieuList = await EduFeeAPI.get('/enrollments');
      tbody.innerHTML = '';
      if (!phieuList.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center" style="padding:24px;color:#718096;">Bạn chưa có phiếu đăng ký học phần nào.</td></tr>';
        return;
      }
      phieuList.forEach((p, i) => {
        const conLai = Number(p.SoTienConLai);
        const soMon = p._count ? p._count.ctPhieuDKList : '';
        const tt = conLai <= 0 ? '<span style="color:#38a169;">Đã đóng đủ</span>' : '<span style="color:#e53e3e;">Còn nợ</span>';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td><strong>${p.MaPhieu}</strong></td><td>${p.MaHKNH}</td>
          <td>${p.NgayLapPhieu ? new Date(p.NgayLapPhieu).toLocaleDateString('vi-VN') : ''}</td>
          <td class="text-center">${soMon}</td>
          <td class="text-right">${fmt(p.TongTienDK)}</td>
          <td class="text-right">${fmt(p.SoTienDaDong)}</td>
          <td class="text-right" style="${conLai > 0 ? 'color:#e53e3e;' : ''}">${fmt(p.SoTienConLai)}</td>
          <td class="text-center">${tt}</td>
          <td class="text-center"><button class="btn-action btn-detail" data-id="${p.MaPhieu}" title="Xem chi tiết"><i class="ti ti-eye"></i></button></td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.btn-detail').forEach((b) => b.addEventListener('click', () => showDetail(b.dataset.id)));
      if (window.EduFeeExcel) EduFeeExcel.mountTableButton({ table: '.data-table', filename: 'LichSuDangKy_' + me.MaSoSinhVien, label: 'Xuất Excel' });
    }
  
    async function showDetail(maPhieu) {
      if (!modal) return;
      try {
        const p = await EduFeeAPI.get('/enrollments/' + maPhieu);
        if (detailTitle) detailTitle.textContent = 'Chi tiết phiếu ' + p.MaPhieu;
        if (detailMeta) {
          const ngay = p.NgayLapPhieu ? new Date(p.NgayLapPhieu).toLocaleDateString('vi-VN') : '—';
          detailMeta.innerHTML = `<strong>Học kỳ:</strong> ${p.MaHKNH} &nbsp;·&nbsp;
            <strong>Ngày lập:</strong> ${ngay} &nbsp;·&nbsp;
            <strong>Tổng tiền ĐK:</strong> ${fmt(p.TongTienDK)} &nbsp;·&nbsp;
            <strong>Miễn giảm:</strong> ${fmt(p.TienMienGiam)} &nbsp;·&nbsp;
            <strong>Phải đóng:</strong> ${fmt(p.TongTienPhaiDong)} &nbsp;·&nbsp;
            <strong>Còn lại:</strong> ${fmt(p.SoTienConLai)}`;
        }
        detailBody.innerHTML = '';
        const mons = p.monHocList || [];
        if (!mons.length) {
          detailBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:16px;color:#718096;">Phiếu chưa có môn nào.</td></tr>';
        } else mons.forEach((m, i) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${i + 1}</td><td>${m.MaMonHoc}</td><td>${m.TenMonHoc}</td>
            <td class="text-center">${m.SoTinChi}</td><td>${m.LoaiMon}</td>
            <td class="text-right">${fmt(m.ThanhTien)}</td>`;
          detailBody.appendChild(tr);
        });
        modal.classList.remove('hidden');
      } catch (e) { alert(e.message); }
    }
    function closeModal() { if (modal) modal.classList.add('hidden'); }
    const c1 = $('btnCloseRegDetail'), c2 = $('btnCloseRegDetail2');
    if (c1) c1.addEventListener('click', closeModal);
    if (c2) c2.addEventListener('click', closeModal);
  
    await load();
  });
  