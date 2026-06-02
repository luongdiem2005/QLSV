// ================= MẢNG DỮ LIỆU GIẢ LẬP SINH VIÊN NỢ =================
const debtDatabase = [
    { mssv: "23520112", name: "Lê Hoàng Long", classCode: "HTTT2023", year: "2025-2026", term: "Học kỳ 1", totalPay: "15.000.000", debt: "6.000.000", days: 3, range: "low" },
    { mssv: "23520456", name: "Nguyễn Thị Mai", classCode: "KHMT2023", year: "2025-2026", term: "Học kỳ 1", totalPay: "13.500.000", debt: "13.500.000", days: 12, range: "high" },
    { mssv: "22520089", name: "Trần Minh Quân", classCode: "CNTT2022", year: "2025-2026", term: "Học kỳ 1", totalPay: "18.000.000", debt: "4.500.000", days: 2, range: "low" },
    { mssv: "24520781", name: "Phạm Thanh Sơn", classCode: "MMT2024", year: "2025-2026", term: "Học kỳ 1", totalPay: "16.200.000", debt: "16.200.000", days: 8, range: "high" },
    { mssv: "23520990", name: "Vũ Hải Đăng", classCode: "ATTT2023", year: "2025-2026", term: "Học kỳ 1", totalPay: "15.000.000", debt: "5.000.000", days: 15, range: "high" }
];

// Định vị các phần tử DOM cơ bản
const tableBody = document.getElementById('debt-table-body');
const modalRemind = document.getElementById('reminder-modal');

// 1. Hàm tính toán và cập nhật số liệu lên 3 ô Dashboard phía trên
function updateDashboardStats() {
    const totalSV = debtDatabase.length;
    
    // Tính tổng số tiền nợ lũy kế
    let totalMoney = 0;
    let countLow = 0;
    let countHigh = 0;

    debtDatabase.forEach(sv => {
        // Chuyển chuỗi định dạng "15.000.000" thành số nguyên để cộng dồn
        const numericDebt = parseInt(sv.debt.replace(/\./g, ''));
        totalMoney += numericDebt;

        if (sv.range === "low") countLow++;
        if (sv.range === "high") countHigh++;
    });

    // Điền dữ liệu ra màn hình
    document.getElementById('stat-total-sv').innerText = totalSV + " SV";
    document.getElementById('stat-total-money').innerText = totalMoney.toLocaleString('vi-VN') + " VND";
    document.getElementById('stat-range-low').innerText = countLow + " SV";
    document.getElementById('stat-range-high').innerText = countHigh + " SV";
}

// 2. Hàm đổ dữ liệu sinh viên nợ lên bảng danh sách
function renderDebtTable(data) {
    tableBody.innerHTML = "";
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#64748b;">Không tìm thấy sinh viên nợ phù hợp.</td></tr>`;
        return;
    }

    data.forEach(sv => {
        const tr = document.createElement('tr');
        
        // Thiết lập nhãn thời gian trễ hạn dựa vào số ngày trễ
        const badgeClass = sv.range === "high" ? "delay-high" : "delay-low";
        
        tr.innerHTML = `
            <td><strong>${sv.mssv}</strong></td>
            <td>${sv.name}</td>
            <td>${sv.classCode}</td>
            <td>${sv.year}</td>
            <td>${sv.term}</td>
            <td>${sv.totalPay} VND</td>
            <td style="color:#dc2626; font-weight:700;">${sv.debt} VND</td>
            <td><span class="badge-delay ${badgeClass}">Trễ ${sv.days} ngày</span></td>
            <td style="text-align: center;">
                <button class="btn-action-remind" onclick="openRemindModal('${sv.mssv}')">Nhắc nhở</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 3. Logic tìm kiếm theo MSSV kết hợp bộ lọc khoảng thời gian trễ hạn
function performFilter() {
    const searchText = document.getElementById('search-debt-mssv').value.trim().toLowerCase();
    const statusFilter = document.getElementById('filter-debt-status').value;

    const filteredData = debtDatabase.filter(sv => {
        const matchesSearch = sv.mssv.toLowerCase().includes(searchText);
        const matchesStatus = (statusFilter === "all") || (sv.range === statusFilter);
        return matchesSearch && matchesStatus;
    });

    renderDebtTable(filteredData);
}

document.getElementById('search-debt-mssv').addEventListener('input', performFilter);
document.getElementById('filter-debt-status').addEventListener('change', performFilter);

// 4. Các hàm điều khiển đóng/mở Popup gửi mail nhắc nhở
function openRemindModal(mssv) {
    const student = debtDatabase.find(sv => sv.mssv === mssv);
    if (!student) return;

    // Đổ dữ liệu sinh viên được chọn vào form thông báo
    document.getElementById('remind-name').innerText = student.name;
    document.getElementById('remind-mssv').innerText = student.mssv;
    document.getElementById('remind-amount').value = student.debt + " VND";
    
    modalRemind.classList.add('open');
}

document.getElementById('btn-close-remind').addEventListener('click', () => {
    modalRemind.classList.remove('open');
});

// Xử lý hành động bấm nút "Gửi Mail"
document.getElementById('btn-submit-remind').addEventListener('click', () => {
    const targetName = document.getElementById('remind-name').innerText;
    alert(`Hệ thống đã gửi email cảnh báo nợ học phí thành công đến sinh viên ${targetName}!`);
    modalRemind.classList.remove('open');
});

// Khởi chạy đồng bộ dữ liệu khi tải xong trang web
updateDashboardStats();
renderDebtTable(debtDatabase);
