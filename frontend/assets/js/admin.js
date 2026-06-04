/**
 * ==========================================================================
 * TRÌNH ĐIỀU KHIỂN LOGIC QUẢN TRỊ TỐI CAO (Super Admin Console)
 * Môn học: Nhập môn Công nghệ phần mềm
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Định danh hiển thị tên Admin trên Sidebar
    const sidebarAdminName = document.getElementById('sidebar-admin-name');
    if (sidebarAdminName) sidebarAdminName.textContent = 'Root_Master_2026';

    const adminUserTableBody = document.getElementById('adminUserTableBody');
    const logStreamContainer = document.getElementById('logStreamContainer');
    const lblTotalUsers = document.getElementById('lblTotalUsers');
    const lblStorageSize = document.getElementById('lblStorageSize');

    // 1. KHO TÀI KHOẢN GỐC - ĐỒNG BỘ VỚI HỆ THỐNG AUTHENTICATION
    function getSystemAccounts() {
        let accounts = localStorage.getItem('edufee_accounts');
        if (!accounts) {
            // Nếu chưa có, nạp danh sách mồi chuẩn của đồ án
            const defaultAccounts = [
                { username: 'pdt', name: 'Trần Giáo Vụ', role: 'PDT', status: 'ACTIVE' },
                { username: 'sv', name: 'Nguyễn Văn An', role: 'SV', status: 'ACTIVE' },
                { username: 'ptc', name: 'Trần Thị Thu Kế', role: 'PTC', status: 'ACTIVE' },
                { username: 'admin', name: 'Quản Trị Viên Tối Cao', role: 'ADMIN', status: 'ACTIVE' }
            ];
            localStorage.setItem('edufee_accounts', JSON.stringify(defaultAccounts));
            return defaultAccounts;
        }
        return JSON.parse(accounts);
    }

    // 2. THUẬT TOÁN ĐO DUNG LƯỢNG BỘ NHỚ LOCALSTORAGE (Infrastructure Metrics)
    function calculateLocalStorageSize() {
        let totalBytes = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalBytes += (localStorage[key].length + key.length) * 2; // Mỗi ký tự chiếm 2 bytes trong chuỗi UTF-16
            }
        }
        const kiloBytes = (totalBytes / 1024).toFixed(2);
        if (lblStorageSize) lblStorageSize.textContent = `${kiloBytes} KB`;
    }

    // 3. HÀM KẾT XUẤT MA TRẬN PHÂN QUYỀN NGƯỜI DÙNG (RBAC Data Grid Binder)
    function renderUserMatrix() {
        if (!adminUserTableBody) return;
        adminUserTableBody.innerHTML = '';

        const accounts = getSystemAccounts();
        if (lblTotalUsers) lblTotalUsers.textContent = accounts.length;

        accounts.forEach(acc => {
            // Định màu cho từng Badge vai trò hệ thống
            let roleBadgeStyle = '';
            if (acc.role === 'ADMIN') roleBadgeStyle = 'background: #fff5f5; color: #e53e3e; border: 1px solid #fed7d7;';
            else if (acc.role === 'PDT') roleBadgeStyle = 'background: #eef2ff; color: #4338ca; border: 1px solid #e0e7ff;';
            else if (acc.role === 'PTC') roleBadgeStyle = 'background: #f0fff4; color: #38a169; border: 1px solid #c6f6d5;';
            else roleBadgeStyle = 'background: #e6fffa; color: #0d9488; border: 1px solid #ccfbf1;';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="font-family: monospace; color: #4a5568;">${acc.username}</strong></td>
                <td><strong>${acc.name}</strong></td>
                <td>
                    <span class="role-selector-badge" style="${roleBadgeStyle}">
                        <i class="ti ti-id"></i> ${acc.role}
                    </span>
                </td>
                <td class="text-center">
                    <span style="background: #f0fff4; color: #38a169; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ● Sẵn sàng
                    </span>
                </td>
                <td class="text-center">
                    <select class="form-select select-role-mutation" data-username="${acc.username}" style="padding: 2px 6px; font-size: 12px; height: 28px; width: 120px; display:inline-block;">
                        <option value="SV" ${acc.role === 'SV' ? 'selected' : ''}>Sinh Viên</option>
                        <option value="PDT" ${acc.role === 'PDT' ? 'selected' : ''}>Phòng ĐT</option>
                        <option value="PTC" ${acc.role === 'PTC' ? 'selected' : ''}>Phòng TC</option>
                        <option value="ADMIN" ${acc.role === 'ADMIN' ? 'selected' : ''}>Quản Trị</option>
                    </select>
                </td>
            `;
            adminUserTableBody.appendChild(tr);
        });

        bindRoleMutationEvents();
    }

    // 4. LUỒNG ĐỔI QUYỀN HẠN TÀI KHOẢN TỨC THÌ (Role Mutation Handler)
    function bindRoleMutationEvents() {
        document.querySelectorAll('.select-role-mutation').forEach(select => {
            select.addEventListener('change', function() {
                const targetUsername = this.getAttribute('data-username');
                const newRole = this.value;

                if (targetUsername === 'admin' && newRole !== 'ADMIN') {
                    alert('Lỗi bảo mật: Không được phép giáng quyền của tài khoản Root tối cao!');
                    renderUserMatrix();
                    return;
                }

                let accounts = getSystemAccounts();
                const targetAcc = accounts.find(a => a.username === targetUsername);
                
                if (targetAcc) {
                    const oldRole = targetAcc.role;
                    targetAcc.role = newRole; // Đột biến vai trò
                    localStorage.setItem('edufee_accounts', JSON.stringify(accounts));
                    
                    // Phát ra log nghiệp vụ lên màn hình đen Terminal
                    pushAuditLog(`Tài khoản [${targetUsername}] đột biến vai trò: ${oldRole} -> ${newRole}`, 'warning');
                    alert(` ĐỔI VAI TRÒ THÀNH CÔNG!\n\nTài khoản: ${targetUsername}\nQuyền mới: ${newRole}\n\nHiệu lực được áp dụng ngay lập tức tại cổng Đăng nhập.`);
                    
                    renderUserMatrix();
                }
            });
        });
    }

    // 5. TRÌNH PHUN LOG MÔ PHỎNG NHẬT KÝ HỆ THỐNG (Dynamic Audit Trail Engine)
    function pushAuditLog(message, type = 'info') {
        if (!logStreamContainer) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        let typeClass = 'log-info';
        if (type === 'success') typeClass = 'log-success';
        if (type === 'warning') typeClass = 'log-warning';

        const logDiv = document.createElement('div');
        logDiv.className = 'log-item';
        logDiv.innerHTML = `
            <span class="log-timestamp">[${timeStr}]</span> 
            <span class="${typeClass}">${message}</span>
        `;

        logStreamContainer.appendChild(logDiv);
        
        // Luôn cuộn thanh cuộn xuống đáy Terminal tự động (Auto-scroll to bottom)
        logStreamContainer.scrollTop = logStreamContainer.scrollHeight;
    }

    // 6. GIẢ LẬP CÁC SỰ KIỆN HỆ THỐNG ĐANG DIỄN RA (System Event Simulator)
    function startSystemTelemetrySimulation() {
        // Danh sách các câu thông báo log mồi sinh động
        const fakeEvents = [
            { msg: "Hạ tầng kết nối cơ sở dữ liệu LocalStorage thiết lập thành công.", type: "success" },
            { msg: "Quét trạng thái đăng ký học phần: Tài khoản SV20260001 hợp lệ.", type: "info" },
            { msg: "Cảnh báo: Kiểm tra cấu hình biểu giá học phí kỳ 1 năm 2026.", type: "warning" },
            { msg: "Cổng thanh toán trực tuyến Ngân hàng VNPAY đang ở trạng thái lắng nghe.", type: "success" },
            { msg: "Hệ thống làm mới (Refresh) bộ nhớ đệm ma trận dòng tiền PTC.", type: "info" }
        ];

        // Phun 2 câu đầu ngay lập tức
        pushAuditLog(fakeEvents[0].msg, fakeEvents[0].type);
        setTimeout(() => pushAuditLog(fakeEvents[1].msg, fakeEvents[1].type), 1000);
        setTimeout(() => pushAuditLog(fakeEvents[2].msg, fakeEvents[2].type), 2500);

        // Chu kỳ 6 giây phun một câu ngẫu nhiên mô phỏng dòng chảy dữ liệu
        setInterval(() => {
            const randomEvent = fakeEvents[Math.floor(Math.random() * fakeEvents.length)];
            pushAuditLog(randomEvent.msg, randomEvent.type);
        }, 6000);
    }

    // 7. BOOTSTRAP INITIALIZATION (Kích hoạt chu trình chạy hệ thống)
    calculateLocalStorageSize();
    renderUserMatrix();
    startSystemTelemetrySimulation();
});
// Thêm đoạn này vào hàm khởi chạy DOMContentLoaded của các trang để nạp Footer tự động
// const footerContainer = document.getElementById('shared-footer-container');
// if (footerContainer) {
//     fetch('../../components/footer.html')
//         .then(response => response.text())
//         .then(data => {
//             footerContainer.innerHTML = data;
//             // Thực thi lại đoạn script tính năm bên trong file footer vừa nạp
//             const script = footerContainer.querySelector('script');
//             if (script) eval(script.innerHTML);
//         });
// }