const db = require('./db');

async function testConnection() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Kết nối Database thành công! Kết quả:', rows[0].solution);
    } catch (err) {
        console.error('Lỗi kết nối:', err);
    }
}

testConnection();