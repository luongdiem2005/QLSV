/* ============================================================================
 *  EduFee - QUẢN LÝ SINH VIÊN (nối API, ĐẦY ĐỦ FIELD theo bảng SINHVIEN)
 *  Thay frontend/js/pdt_sv.js. Cần nạp api.js + auth-guard.js TRƯỚC.
 *  Field DB: MaSoSinhVien, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email,
 *            MaNganh, MaDoiTuong, MaXa, TinhTrang.
 *  HTML yêu cầu các id (xem STUDENT_UI_PATCH.md):
 *    studentId, studentName, studentDob, studentGender, studentPhone,
 *    studentEmail, studentMajor(select ngành), studentDoiTuong(select),
 *    studentXa(select), studentStatus(select), searchStudent, filterClass(lọc ngành)
 * ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await EduFeeGuard.protect(['PDT']);

  const $ = (id) => document.getElementById(id);
  const tbody = $('studentTableBody');
  const modal = $('studentModal');
  const form = $('studentForm');
  const modalTitle = $('modalTitle');
  const btnAdd = $('btnOpenAddModal');
  const btnClose = $('btnCloseModal');
  const btnCancel = $('btnCancelModal');

  const inId = $('studentId');
  const inName = $('studentName');
  const inDob = $('studentDob');
  const inGender = $('studentGender');
  const inPhone = $('studentPhone');
  const inEmail = $('studentEmail');
  const inMajor = $('studentMajor');        // ngành (MaNganh)
  const inDoiTuong = $('studentDoiTuong');  // đối tượng ưu tiên (MaDoiTuong)
  const inXa = $('studentXa');              // xã (MaXa)
  const inStatus = $('studentStatus');      // tình trạng
  const inKhoa = $('studentCohort');        // khóa (KhoaHoc)
  const filterKhoa = $('filterKhoa');
  const btnPrev = $('btnPrevPage'), btnNext = $('btnNextPage'), pageIndicator = $('pageIndicator');

  const search = $('searchStudent');
  const filterNganh = $('filterClass');     // tái sử dụng làm bộ lọc ngành

  let mode = 'add', editingId = null, lastItems = [];
  let currentPage = 1, totalRecords = 0; const PAGE_SIZE = 20;
  let nganhList = [], doituonguutienList = [], xaList = [];

  // ---------- Đổ dropdown danh mục ----------
  async function loadDanhMuc() {
    // Ngành là BẮT BUỘC khi thêm SV -> nếu lỗi phải báo, không nuốt im lặng.
    try {
      nganhList = await EduFeeAPI.get('/nganh');
    } catch (e) {
      nganhList = [];
      alert('Không tải được danh sách Ngành: ' + e.message);
    }
    // Hai mục này không bắt buộc -> lỗi thì bỏ qua.
    [doituonguutienList, xaList] = await Promise.all([
      EduFeeAPI.get('/doi-tuong-uu-tien').catch(() => []),
      EduFeeAPI.get('/xa').catch(() => []),
    ]);

    const optNganh = nganhList.map(n => `<option value="${n.MaNganh}">${n.TenNganh}</option>`).join('');
    if (inMajor) inMajor.innerHTML = '<option value="">-- Chọn ngành --</option>' + optNganh;
    if (filterNganh) filterNganh.innerHTML = '<option value="">-- Tất cả ngành --</option>' + optNganh;

    if (inDoiTuong) inDoiTuong.innerHTML = '<option value="">-- Không ưu tiên --</option>' +
      doituonguutienList.map(d => `<option value="${d.MaDoiTuong}">${d.TenDoiTuong} (${Number(d.TyLeMienGiam)}%)</option>`).join('');

    if (inXa) inXa.innerHTML = '<option value="">-- Chọn --</option>' +
      xaList.map(x => `<option value="${x.MaXa}">${x.TenXa}${x.tinh ? ' - ' + x.tinh.TenTinh : ''}</option>`).join('');

    if (inStatus && !inStatus.options.length) {
      inStatus.innerHTML = ['Đang học', 'Bảo lưu', 'Thôi học'].map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Không có Ngành nào -> không thể thêm SV (MaNganh bắt buộc). Báo để xử lý.
    if (!nganhList.length) {
      alert('Chưa có Ngành học nào trong hệ thống. Hãy tạo Ngành ở trang "Ngành học" trước khi thêm sinh viên.');
    }
  }

  // ---------- Render bảng ----------
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '';

  function render(items) {
    lastItems = items || [];
    tbody.innerHTML = '';
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding:30px;color:#718096;">
        <i class="ti ti-database-off" style="font-size:24px;display:block;margin-bottom:8px;"></i>
        Không tìm thấy sinh viên nào.</td></tr>`;
      updateInfo();
      return;
    }
    items.forEach((sv, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${(currentPage - 1) * PAGE_SIZE + i + 1}</td>
        <td><strong>${sv.MaSoSinhVien}</strong></td>
        <td>${sv.KhoaHoc || ''}</td>
        <td>${sv.HoTen}</td>
        <td>${fmtDate(sv.NgaySinh)}</td>
        <td>${sv.GioiTinh || ''}</td>
        <td>${sv.SoDienThoai || ''}</td>
        <td>${sv.Email || ''}</td>
        <td>${sv.nganh ? sv.nganh.TenNganh : ''}</td>
        <td>${sv.TinhTrang || ''}</td>
        <td class="text-center"><div class="action-buttons">
          <button class="btn-action btn-edit" data-id="${sv.MaSoSinhVien}" title="Sửa"><i class="ti ti-edit"></i></button>
          <button class="btn-action btn-delete" data-id="${sv.MaSoSinhVien}" title="Xóa"><i class="ti ti-trash"></i></button>
        </div></td>`;
      tbody.appendChild(tr);
    });
    updateInfo();
    bind();
    setupExport();
  }

  function setupExport() {
    if (!window.EduFeeExcel) return;
    EduFeeExcel.mountButton({
      label: 'Xuất Excel',
      onExport: () => ({
        filename: 'DanhSachSinhVien',
        columns: [
          { header: 'MSSV', key: 'MaSoSinhVien' }, { header: 'Khóa', key: 'khoa' }, { header: 'Họ tên', key: 'HoTen' },
          { header: 'Ngày sinh', key: 'ns' }, { header: 'Giới tính', key: 'gt' },
          { header: 'SĐT', key: 'sdt' }, { header: 'Email', key: 'email' },
          { header: 'Ngành', key: 'nganh' }, { header: 'Tình trạng', key: 'tt' },
        ],
        rows: lastItems.map(sv => ({
          MaSoSinhVien: sv.MaSoSinhVien, khoa: sv.KhoaHoc || '', HoTen: sv.HoTen,
          ns: fmtDate(sv.NgaySinh), gt: sv.GioiTinh || '',
          sdt: sv.SoDienThoai || '', email: sv.Email || '',
          nganh: sv.nganh ? sv.nganh.TenNganh : '', tt: sv.TinhTrang || '',
        })),
      }),
    });
  }
  function updateInfo() {
    const el = document.querySelector('.pagination-info');
    if (el) el.textContent = `Tổng ${totalRecords} sinh viên`;
  }
  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
    if (pageIndicator) pageIndicator.textContent = `Trang ${currentPage}/${totalPages}`;
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = currentPage >= totalPages;
  }

  // ---------- Tải dữ liệu (có phân trang) ----------
  async function load() {
    const p = new URLSearchParams();
    if (search && search.value.trim()) p.set('search', search.value.trim());
    if (filterNganh && filterNganh.value) p.set('maNganh', filterNganh.value);
    if (filterKhoa && filterKhoa.value.trim()) p.set('khoaHoc', filterKhoa.value.trim());
    p.set('page', String(currentPage));
    p.set('limit', String(PAGE_SIZE));
    try {
      const res = await EduFeeAPI.get('/students?' + p);
      totalRecords = res.total || 0;
      render(res.items);
      renderPagination();
    } catch (e) { alert(e.message); }
  }
  function reloadFromFirstPage() { currentPage = 1; load(); }

  // ---------- Modal ----------
  function openModal(m, mssv) {
    mode = m;
    modal.classList.remove('hidden');
    if (m === 'add') {
      modalTitle.textContent = 'Thêm sinh viên mới';
      form.reset();
      if (inId) inId.removeAttribute('disabled');
    } else {
      modalTitle.textContent = 'Cập nhật thông tin sinh viên';
      if (inId) { inId.removeAttribute('disabled'); inId.title = 'Có thể đổi MSSV — phiếu/tài khoản liên kết sẽ tự cập nhật'; }
      fill(mssv);
    }
  }
  async function fill(mssv) {
    try {
      const sv = await EduFeeAPI.get('/students/' + mssv);
      editingId = mssv;
      if (inId) inId.value = sv.MaSoSinhVien;
      if (inName) inName.value = sv.HoTen || '';
      if (inDob) inDob.value = sv.NgaySinh ? sv.NgaySinh.substring(0, 10) : '';
      if (inGender) inGender.value = sv.GioiTinh || '';
      if (inPhone) inPhone.value = sv.SoDienThoai || '';
      if (inEmail) inEmail.value = sv.Email || '';
      if (inMajor) inMajor.value = sv.MaNganh || '';
      if (inDoiTuong) inDoiTuong.value = sv.MaDoiTuong || '';
      if (inXa) inXa.value = sv.MaXa || '';
      if (inStatus) inStatus.value = sv.TinhTrang || 'Đang học';
      if (inKhoa) inKhoa.value = sv.KhoaHoc || '';
    } catch (e) { alert(e.message); }
  }
  function closeModal() { modal.classList.add('hidden'); form.reset(); editingId = null; }
  if (btnAdd) btnAdd.addEventListener('click', () => openModal('add'));
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  function bind() {
    document.querySelectorAll('.btn-edit').forEach(b =>
      b.addEventListener('click', () => openModal('edit', b.dataset.id)));
    document.querySelectorAll('.btn-delete').forEach(b =>
      b.addEventListener('click', async () => {
        if (!confirm(`Xóa vĩnh viễn hồ sơ sinh viên ${b.dataset.id}?`)) return;
        try { await EduFeeAPI.del('/students/' + b.dataset.id); await load(); }
        catch (e) { alert(e.message); }
      }));
  }

  // ---------- Lưu ----------
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      MaSoSinhVien: inId ? inId.value.trim() : '',
      HoTen: inName ? inName.value.trim() : '',
      NgaySinh: inDob && inDob.value ? inDob.value : null,
      GioiTinh: inGender ? inGender.value || null : null,
      SoDienThoai: inPhone ? inPhone.value.trim() || null : null,
      Email: inEmail ? inEmail.value.trim() || null : null,
      KhoaHoc: inKhoa ? inKhoa.value.trim() || null : null,
      MaNganh: inMajor ? inMajor.value : null,
      MaDoiTuong: inDoiTuong ? inDoiTuong.value || null : null,
      MaXa: inXa ? inXa.value || null : null,
      TinhTrang: inStatus ? inStatus.value || 'Đang học' : 'Đang học',
    };
    if (!payload.HoTen || !payload.MaNganh || (mode === 'add' && !payload.MaSoSinhVien)) {
      alert('Vui lòng nhập thông tin gắn dấu *.');
      return;
    }
    try {
      if (mode === 'add') {
        await EduFeeAPI.post('/students', payload);
        alert('Thêm sinh viên thành công!');
      } else {
        await EduFeeAPI.put('/students/' + editingId, payload);
        alert('Cập nhật thành công!');
      }
      closeModal();
      await load();
    } catch (e) { alert(e.message); }
  });

  if (search) search.addEventListener('input', reloadFromFirstPage);
  if (filterNganh) filterNganh.addEventListener('change', reloadFromFirstPage);
  if (filterKhoa) filterKhoa.addEventListener('input', reloadFromFirstPage);
  if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; load(); } });
  if (btnNext) btnNext.addEventListener('click', () => { currentPage++; load(); });

  await loadDanhMuc();
  await load();
});
