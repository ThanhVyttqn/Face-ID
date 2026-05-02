const express = require('express');
const GiangVienController = require('../controllers/GiangVien_Controller');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorizeRoles = require('../middleware/RoleMiddleware');
const validateRequest = require('../middleware/ValidationMiddleware');
const {
  updateProfileRules,
  changePasswordRules,
  upsertAttendanceRules,
  updateSessionStatusRules,
} = require('../validation/GiangVien_Validation');

const router = express.Router();
router.use(authMiddleware, authorizeRoles('giang_vien'));

router.get('/lop-hoc-phan', GiangVienController.getMyClasses);
router.get('/lop-hoc-phan/:ma_lop_hp', GiangVienController.getClassDetail);
router.get('/lop-hoc-phan/:ma_lop_hp/buoi-hoc', GiangVienController.getClassSessions);
router.post('/lop-hoc-phan/:ma_lop_hp/buoi-hoc', GiangVienController.createSession);

router.get('/buoi-hoc/:id_buoi/diem-danh', GiangVienController.getSessionAttendance);
router.post('/diem-danh', upsertAttendanceRules, validateRequest, GiangVienController.upsertAttendance);
router.put('/buoi-hoc/:id_buoi/trang-thai', updateSessionStatusRules, validateRequest, GiangVienController.updateSessionStatus);

router.get('/diem-danh/phien-hien-tai', GiangVienController.getActiveAttendanceSession);
router.get('/diem-danh/phien-log', GiangVienController.getAttendanceSessionLogs);
router.post('/diem-danh/phien-bat-dau', GiangVienController.startAttendanceSession);
router.post('/diem-danh/phien-ket-thuc', GiangVienController.stopAttendanceSession);

router.get('/lich-su-diem-danh', GiangVienController.getAttendanceHistory);
router.get('/lich-su-diem-danh/:id_buoi', GiangVienController.getAttendanceHistoryDetail);

router.get('/tai-khoan', GiangVienController.getProfile);
router.put('/tai-khoan', updateProfileRules, validateRequest, GiangVienController.updateProfile);
router.put('/doi-mat-khau', changePasswordRules, validateRequest, GiangVienController.changePassword);

module.exports = router;
