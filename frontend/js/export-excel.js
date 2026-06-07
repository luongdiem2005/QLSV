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
    const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  
    function ensureXLSX() {
      return new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const s = document.createElement('script');
        s.src = CDN;
        s.onload = () => resolve(window.XLSX);
        s.onerror = () => reject(new Error('Không tải được thư viện Excel (kiểm tra kết nối mạng).'));
        document.head.appendChild(s);
      });
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
  