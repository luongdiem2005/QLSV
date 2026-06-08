/* EduFee - SV: gửi đơn Xin miễn giảm / Gia hạn + xem trạng thái đơn của mình. */
document.addEventListener('DOMContentLoaded', async () => {
    const me = await EduFeeGuard.protect(['SV']);
    if (!me) return;
  
    const $ = (id) => document.getElementById(id);
    const tbody = $('reqTableBody');
    const btn = $('btnSubmitRequest');
    const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    setText('sidebar-student-name', me.HoTen || me.TenDangNhap);
  
    const TEN_LOAI = { MIENGIAM: 'Miễn giảm học phí', GIAHAN: 'Gia hạn đóng học phí' };
    const BADGE = {
      CHO_DUYET: '<span style="color:#d69e2e;">Chờ duyệt</span>',
      DA_DUYET: '<span style="color:#38a169;">Đã duyệt</span>',
      TU_CHOI: '<span style="color:#e53e3e;">Từ chối</span>',
    };
  
    async function load() {
      const list = await EduFeeAPI.get('/requests');
      tbody.innerHTML = '';
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:22px;color:#718096;">Bạn chưa gửi đơn nào.</td></tr>';
        return;
      }
      list.forEach((d) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${d.MaDon}</strong></td><td>${TEN_LOAI[d.Loai] || d.Loai}</td>
          <td>${d.LyDo || ''}</td>
          <td>${d.NgayTao ? new Date(d.NgayTao).toLocaleDateString('vi-VN') : ''}</td>
          <td class="text-center">${BADGE[d.TrangThai] || d.TrangThai}</td>
          <td>${d.GhiChuXuLy || '—'}</td>`;
        tbody.appendChild(tr);
      });
    }
  
    if (btn) btn.addEventListener('click', async () => {
      const Loai = $('reqType') ? $('reqType').value : '';
      const LyDo = $('reqReason') ? $('reqReason').value.trim() : '';
      if (!LyDo) { alert('Vui lòng nhập lý do.'); return; }
      try {
        await EduFeeAPI.post('/requests', { Loai, LyDo });
        alert('Đã gửi đơn. Vui lòng chờ Phòng Đào tạo / Tài chính xét duyệt.');
        if ($('reqReason')) $('reqReason').value = '';
        load();
      } catch (e) { alert(e.message); }
    });
  
    await load();
  });
  