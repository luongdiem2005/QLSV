// Khởi tạo Prisma Client dạng singleton (1 instance dùng chung toàn app)
// Tránh tạo nhiều kết nối khi --watch reload.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'], // bật 'query' nếu muốn xem SQL khi debug
});

module.exports = prisma;
