const express = require('express');
const router  = express.Router();
const studentController = require('../controllers/studentController');
const protect = require('../middlewares/authMiddleware');

// Danh sách sinh viên (có filter)
router.get('/',                         protect, studentController.getAllStudents);

// Tra cứu hồ sơ đầy đủ kèm lịch sử
router.get('/:student_id/profile',      protect, studentController.getStudentProfile);

// Thêm mới
router.post('/',                        protect, studentController.createStudent);

// Cập nhật
router.put('/:student_id',              protect, studentController.updateStudent);

// Xóa
router.delete('/:student_id',           protect, studentController.deleteStudent);

module.exports = router;