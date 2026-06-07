/* ============================================================================
 *  EduFee - TIỆN ÍCH XUẤT EXCEL (.xlsx) cho các trang báo cáo/danh sách.
 *  Tự nạp thư viện SheetJS từ CDN khi cần (không phải thêm script thủ công).
 *  Nạp file này SAU api.js, TRƯỚC file js của trang:
 *    <script src="../../js/export-excel.js"></script>
 *
 *  Dùng trong file js của trang:
 *    EduFeeExcel.mountButton({
 *      onExport: () => ({ filename, columns:[{header,key}], rows:[{...}] })
 *    });
 * ========================================================================== */
const EduFeeExcel = (() => {
  // Ưu tiên bản đóng gói trong project (chạy offline), lỗi mới fallback ra CDN.
  const LOCAL = (location.pathname.includes('/pages/') ? '../../' : './') + 'assets/vendor/xlsx.full.min.js';
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

  function napScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Không tải được: ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureXLSX() {
    if (window.XLSX) return window.XLSX;
    try {
      await napScript(LOCAL);              // 1) bản trong project
    } catch (e) {
      try { await napScript(CDN); }        // 2) dự phòng qua mạng
      catch (e2) { throw new Error('Không tải được thư viện Excel (cả bản nội bộ lẫn CDN).'); }
    }
    if (!window.XLSX) throw new Error('Thư viện Excel nạp lỗi.');
    return window.XLSX;
  }

  // columns: [{header, key}]; rows: [{key: value}]
  async function exportData(filename, columns, rows) {
    const XLSX = await ensureXLSX();
    const aoa = [columns.map((c) => c.header)];
    rows.forEach((r) => aoa.push(columns.map((c) => r[c.key])));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCao');
    XLSX.writeFile(wb, (filename || 'bao-cao') + '.xlsx');
  }

  /**
   * Tạo (hoặc dùng lại) nút "Xuất Excel" và gắn sự kiện.
   * opts: { id?, mount?(selector), label?, onExport()->{filename,columns,rows} }
   */
  function mountButton(opts) {
    const id = opts.id || 'btnExportExcel';
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.className = 'btn btn-secondary';
      btn.innerHTML = '<i class="ti ti-file-spreadsheet"></i> <span>' + (opts.label || 'Xuất Excel') + '</span>';
      const mount = document.querySelector(opts.mount || '.table-toolbar')
        || document.querySelector('main') || document.body;
      mount.appendChild(btn);
    }
    btn.onclick = async () => {
      try {
        const { filename, columns, rows } = opts.onExport();
        if (!rows || !rows.length) { alert('Không có dữ liệu để xuất.'); return; }
        await exportData(filename, columns, rows);
      } catch (e) { alert(e.message); }
    };
    return btn;
  }

  return { export: exportData, mountButton };
})();
window.EduFeeExcel = EduFeeExcel;
