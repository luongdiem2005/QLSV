let currentId = null;

async function loadKhoa() {

    const ds = await EduFeeAPI.get('/khoa');

    const tbody = document.getElementById('tblKhoa');

    tbody.innerHTML = ds.map(k => `
        <tr>
            <td>${k.MaKhoa}</td>
            <td>${k.TenKhoa}</td>

            <td>

                <button onclick="editKhoa('${k.MaKhoa}')">
                    Sửa
                </button>

                <button onclick="deleteKhoa('${k.MaKhoa}')">
                    Xóa
                </button>

            </td>
        </tr>
    `).join('');
}

async function deleteKhoa(id) {

    if (!confirm('Xóa khoa?')) return;

    await EduFeeAPI.del('/khoa/' + id);

    await loadKhoa();
}

async function editKhoa(id) {

    const khoa = await EduFeeAPI.get('/khoa/' + id);

    currentId = id;

    document.getElementById('maKhoa').value = khoa.MaKhoa;
    document.getElementById('tenKhoa').value = khoa.TenKhoa;
}

document.getElementById('btnSave').addEventListener('click', async () => {

    const body = {
        MaKhoa: document.getElementById('maKhoa').value,
        TenKhoa: document.getElementById('tenKhoa').value
    };

    if (currentId) {
        await EduFeeAPI.put('/khoa/' + currentId, body);
    } else {
        await EduFeeAPI.post('/khoa', body);
    }

    currentId = null;

    loadKhoa();
});

loadKhoa();