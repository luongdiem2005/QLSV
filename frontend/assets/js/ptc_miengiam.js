/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC THẨM ĐỊNH & PHÊ DUYỆT MIỄN GIẢM (Finance Exemptions)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Định danh thông tin cán bộ tài chính hiển thị lên sidebar
    const financeStaff = { name: 'Trần Thị Thu Kế' };
    const sidebarUserName = document.getElementById('sidebar-user-name');
    if (sidebarUserName) sidebarUserName.textContent = financeStaff.name;

    // 1. KHO DỮ LIỆU MẪU SỔ THEO DÕI ĐƠN TỪ CHÍNH SÁCH (Exemption Records Store)
    // Khởi tạo danh sách hồ sơ miễn giảm của trường nếu hệ thống chưa có dữ liệu lưu vết
    function initExemptionsDataStore() {
        const existingData = localStorage.getItem('edufee_exemptions_list');
        if (!existingData) {
            const defaultExemptions = [
                {
                    studentId: 'SV20260001',
                    studentName: 'Nguyễn Văn An',
                    className: 'KHMT2023',
                    policyGroup: 'Con thương binh, liệt sĩ (Hạng 2/4)',
                    discountRate: 0.30,
                    evidenceFile: 'chung_nhan_thuong_binh_SV20260001.pdf',
                    status: 'PENDING' // Chờ xét duyệt (Mặc định cho sinh viên An để giảng viên bấm test)
                },
                {
                    studentId: 'SV20260002',
                    studentName: 'Trần Minh Tâm',
                    className: 'ANNT2024',
                    policyGroup: 'Sinh viên vùng cao, dân tộc thiểu số đặc biệt khó khăn',
                    discountRate: 0.50,
                    evidenceFile: 'giay_khai_sinh_va_ho_khau_SV20260002.pdf',
                    status: 'APPROVED' // Đã phê duyệt thành công từ trước
                },
                {
                    studentId: 'SV20260004',
                    studentName: 'Phạm Đức Long',
                    className: 'HTTT2025',
                    policyGroup: 'Sinh viên khuyết tật nặng (Có giấy xác nhận y tế)',
                    discountRate: 1.00,
                    evidenceFile: 'so_khanh_kiet_y_te_SV20260004.pdf',
                    status: 'APPROVED' // Đã phê duyệt thành công từ trước
                }
            ];
            localStorage.setItem('edufee_exemptions_list', JSON.stringify(defaultExemptions));
        }
    }

    // 2. KHAI BÁO CÁC PHẦN TỬ THÀNH PHẦN DOM
    const exemptionsTableBody = document.getElementById('exemptionsTableBody');
    const filterTabs = document.querySelectorAll('.tab-item');
    
    // Các phần tử hiển thị số đếm badge lượng đơn từ trên Tab
    const cntAll = document.getElementById('cntAll');
    const cntPending = document.getElementById('cntPending');
    const cntApproved = document.getElementById('cntApproved');
    const cntRejected = document.getElementById('cntRejected');

    let currentFilterStatus = 'ALL'; // Trạng thái bộ lọc mặc định khi tải trang

    // 3. THUẬT TOÁN TÍNH TOÁN SỐ LƯỢNG BADGE ĐẾM ĐƠN ĐỘNG (Counter Aggregator)
    function updateTabCounters() {
        const list = JSON.parse(localStorage.getItem('edufee_exemptions_list')) || [];
        
        const allCount = list.length;
        const pendingCount = list.filter(item => item.status === 'PENDING').length;
        const approvedCount = list.filter(item => item.status === 'APPROVED').length;
        const rejectedCount = list.filter(item => item.status === 'REJECTED').length;

        if (cntAll) cntAll.textContent = allCount;
        if (cntPending) cntPending.textContent = pendingCount;
        if (cntApproved) cntApproved.textContent = approvedCount;
        if (cntRejected) cntRejected.textContent = rejectedCount;
    }

    // 4. HÀM KẾT XUẤT LƯỚI HỒ SƠ PHÊ DUYỆT (Workflow Data Grid Renderer)
    function renderExemptionsGrid() {
        if (!exemptionsTableBody) return;
        exemptionsTableBody.innerHTML = '';

        const list = JSON.parse(localStorage.getItem('edufee_exemptions_list')) || [];

        // Lọc danh sách hiển thị dựa trên Tab trạng thái đang active
        const filteredList = list.filter(item => {
            if (currentFilterStatus === 'ALL') return true;
            return item.status === currentFilterStatus;
        });

        if (filteredList.length === 0) {
            exemptionsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="color: #a0aec0; padding: 30px;">
                        <i class="ti ti-folder-off" style="font-size: 26px; display: block; margin-bottom: 8px;"></i>
                        Không có hồ sơ miễn giảm nào thuộc trạng thái kiểm duyệt này.
                    </td>
                </tr>`;
            return;
        }

        filteredList.forEach(item => {
            // Định dạng thẻ trạng thái (Status Badge Markup)
            let statusMarkup = '';
            let actionButtonsMarkup = '';

            if (item.status === 'PENDING') {
                statusMarkup = `<span class="badge-status" style="background-color: #fffaf0; color: #dd6b20; border: 1px solid #fbd38d; padding: 4px 8px; border-radius:4px; font-size:12px; font-weight:500;"><i class="ti ti-clock"></i> Chờ thẩm định</span>`;
                actionButtonsMarkup = `
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button class="btn btn-approve btn-action-gate" data-id="${item.studentId}" data-action="APPROVE" style="padding: 4px 10px; font-size: 12px; height: 28px;">
                            <i class="ti ti-check"></i> Duyệt
                        </button>
                        <button class="btn btn-reject btn-action-gate" data-id="${item.studentId}" data-action="REJECT" style="padding: 4px 10px; font-size: 12px; height: 28px;">
                            <i class="ti ti-x"></i> Từ chối
                        </button>
                    </div>
                `;
            } else if (item.status === 'APPROVED') {
                statusMarkup = `<span class="badge-status" style="background-color: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 4px 8px; border-radius:4px; font-size:12px; font-weight:500;"><i class="ti ti-circle-check"></i> Đã phê duyệt</span>`;
                actionButtonsMarkup = `<span style="color: #a0aec0; font-size: 13px; font-style: italic;"><i class="ti ti-lock"></i> Đã chốt sổ</span>`;
            } else {
                statusMarkup = `<span class="badge-status" style="background-color: #fff5f5; color: #9b2c2c; border: 1px solid #feb2b2; padding: 4px 8px; border-radius:4px; font-size:12px; font-weight:500;"><i class="ti ti-ban"></i> Đã từ chối</span>`;
                actionButtonsMarkup = `<span style="color: #a0aec0; font-size: 13px; font-style: italic;"><i class="ti ti-lock"></i> Đã đóng đơn</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="font-family: monospace; color: #2b6cb0;">${item.studentId}</strong></td>
                <td><strong>${item.studentName}</strong></td>
                <td>${item.className}</td>
                <td><span style="font-size: 13px; color: #4a5568;">${item.policyGroup}</span></td>
                <td class="text-center"><strong style="color: #dd6b20;">${(item.discountRate * 100)}%</strong></td>
                <td>
                    <a href="#" class="attachment-link" onclick="alert('Hệ thống đang chạy giả lập môi trường Local, tệp tin đính kèm sinh viên tải lên: \\n\\n[${item.evidenceFile}] \\nhợp lệ và đã được kiểm tra mã băm bảo mật MD5!'); return false;">
                        <i class="ti ti-paperclip"></i> Xem minh chứng
                    </a>
                </td>
                <td class="text-center">${statusMarkup}</td>
                <td class="text-center">${actionButtonsMarkup}</td>
            `;
            exemptionsTableBody.appendChild(tr);
        });

        bindWorkflowGateActions(); // Gắn trình lắng nghe sự kiện Phê duyệt / Từ chối đơn từ
    }

    // 5. XỬ LÝ SỰ KIỆN QUYẾT ĐỊNH DUYỆT ĐƠN CHÍNH SÁCH (Approval Action Gate Handler)
    function bindWorkflowGateActions() {
        document.querySelectorAll('.btn-action-gate').forEach(button => {
            button.addEventListener('click', function() {
                const targetStudentId = this.getAttribute('data-id');
                const actionType = this.getAttribute('data-action');

                const list = JSON.parse(localStorage.getItem('edufee_exemptions_list')) || [];
                const targetRecord = list.find(item => item.studentId === targetStudentId);

                if (!targetRecord) return;

                const confirmMessage = actionType === 'APPROVE' 
                    ? `Bạn có chắc chắn muốn PHÊ DUYỆT chế độ giảm giá ${(targetRecord.discountRate * 100)}% cho sinh viên ${targetRecord.studentName}?\n\nHành động này sẽ khấu trừ trực tiếp tiền công nợ học phí của sinh viên.`
                    : `Bạn có chắc chắn muốn TỪ CHỐI hồ sơ xin miễn giảm của sinh viên ${targetRecord.studentName}?`;

                if (!confirm(confirmMessage)) return;

                // Cập nhật trạng thái duyệt đơn tương ứng
                if (actionType === 'APPROVE') {
                    targetRecord.status = 'APPROVED';
                    
                    // Nếu duyệt thành công cho sinh viên An (SV20260001), cập nhật luôn chính sách giảm giá
                    if (targetStudentId === 'SV20260001') {
                        localStorage.setItem('edufee_payment_status_2026_hk1', 'UNPAID'); // Đảm bảo trạng thái chưa đóng để thấy khấu trừ tiền
                    }
                } else {
                    targetRecord.status = 'REJECTED';
                    // Nếu từ chối, đưa mức miễn giảm của SV An về 0%
                    if (targetStudentId === 'SV20260001') {
                         // Hệ thống lưu trạng thái ép từ chối chế độ
                    }
                }

                // Lưu đè danh sách đã thẩm định vào kho dữ liệu
                localStorage.setItem('edufee_exemptions_list', JSON.stringify(list));

                alert(actionType === 'APPROVE' ? ' HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT!\nHệ thống đã hạch toán giảm trừ công nợ.' : ' ĐƠN TỪ ĐÃ BỊ TỪ CHỐI!\nHồ sơ chuyển về trạng thái không hợp lệ.');

                // Tải lại bộ đếm và lưới dữ liệu thời gian thực
                updateTabCounters();
                renderExemptionsGrid();
            });
        });
    }

    // 6. THIẾT LẬP LẮNG NGHE SỰ KIỆN CHUYỂN TABS BỘ LỌC (Tabs Filter Listener)
    if (filterTabs) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Xóa class active cũ trên tất cả các tab
                filterTabs.forEach(t => t.classList.remove('active'));
                // Thêm class active vào tab vừa click
                this.classList.add('active');

                // Cập nhật trạng thái bộ lọc và vẽ lại bảng
                currentFilterStatus = this.getAttribute('data-status');
                renderExemptionsGrid();
            });
        });
    }

    // 7. KÍCH HOẠT CHU TRÌNH KHỞI CHẠY (Bootstrap Loop Execution)
    initExemptionsDataStore();
    updateTabCounters();
    renderExemptionsGrid();
});
// Thêm đoạn này vào hàm khởi chạy DOMContentLoaded của các trang để nạp Footer tự động
const footerContainer = document.getElementById('shared-footer-container');
if (footerContainer) {
    fetch('../../components/footer.html')
        .then(response => response.text())
        .then(data => {
            footerContainer.innerHTML = data;
            // Thực thi lại đoạn script tính năm bên trong file footer vừa nạp
            const script = footerContainer.querySelector('script');
            if (script) eval(script.innerHTML);
        });
}