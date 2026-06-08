/* EduFee - PĐT/PTC: xét duyệt đơn Xin miễn giảm / Gia hạn của sinh viên. */
document.addEventListener('DOMContentLoaded', async () => {
    const me = await EduFeeGuard.protect(['PDT', 'PTC', 'ADMIN']);
    if (!me) return;
  
    const $ = (id) => document.getElementById(id);
    const tbody = $('reqAdminTableBody');
    const filterStatus = $('filterStatus');
    const TEN_LOAI = { MIENGIAM: 'Miễn giảm học phí', GIAHAN: 'Gia hạn đóng học phí' };
    const BADGE = {
      CHO_DUYET: '<span style="color:#d69e2e;">Chờ duyệt</span>',
      DA_DUYET: '<span style="color:#38a169;">Đã duyệt</span>',
      TU_CHOI: '<span style="color:#e53e3e;">Từ chối</span>',
    };
    let all = [];
  
    async function load() {
      all = await EduFeeAPI.get('/requests');
      render();
    }
  
    function render() {
      const f = filterStatus ? filterStatus.value : '';
      const list = f ? all.filter((d) => d.TrangThai === f) : all;
      tbody.innerHTML = '';
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:22px;color:#718096;">Không có đơn nào.</td></tr>';
        return;
      }
      list.forEach((d) => {
        const sv = d.sinhvien || {};
        const choDuyet = d.TrangThai === 'CHO_DUYET';
        const act = choDuyet
          ? `<button class="btn-action btn-reg" data-id="${d.MaDon}" data-ok="1" title="Duyệt"><i class="ti ti-check"></i></button>
             <button class="btn-action btn-del" data-id="${d.MaDon}" data-ok="0" title="Từ chối"><i class="ti ti-x"></i></button>`
          : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${d.MaDon}</strong></td><td>${sv.MaSoSinhVien || ''}</td><td>${sv.HoTen || ''}</td>
          <td>${TEN_LOAI[d.Loai] || d.Loai}</td><td>${d.LyDo || ''}</td>
          <td>${d.NgayTao ? new Date(d.NgayTao).toLocaleDateString('vi-VN') : ''}</td>
          <td class="text-center">${BADGE[d.TrangThai] || d.TrangThai}</td>
          <td class="text-center">${act}</td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('[data-ok]').forEach((b) =>
        b.addEventListener('click', () => duyet(b.dataset.id, b.dataset.ok === '1')));
    }
  
    async function duyet(maDon, ok) {
      const TrangThai = ok ? 'DA_DUYET' : 'TU_CHOI';
      const GhiChuXuLy = prompt(ok ? 'Ghi chú khi duyệt (tùy chọn):' : 'Lý do từ chối (tùy chọn):', '');
      if (GhiChuXuLy === null) return;
      try { await EduFeeAPI.put('/requests/' + maDon, { TrangThai, GhiChuXuLy }); await load(); }
      catch (e) { alert(e.message); }
    }
  
    if (filterStatus) filterStatus.addEventListener('change', render);
    await load();
  });
  