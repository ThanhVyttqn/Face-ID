const express = require('express');
const AdminController = require('../controllers/Admin_Controller');
const auth = require('../middleware/AuthMiddleware');
const role = require('../middleware/RoleMiddleware');

const router = express.Router();
router.use(auth, role('admin'));

router.get('/lookups/khoa', AdminController.getKhoa);
router.get('/lookups/lop-sv', AdminController.getLopSv);
router.get('/lookups/sinh-vien', AdminController.getSinhVienLookup);
router.get('/lookups/giang-vien', AdminController.getGiangVienLookup);
router.get('/lookups/mon-hoc', AdminController.getMonHocLookup);

router.get('/tai-khoan', AdminController.getTaiKhoans);
router.post('/tai-khoan/admin', AdminController.createAdminAccount);
router.post('/tai-khoan/sinh-vien/:ma_sv', AdminController.createStudentAccount);
router.post('/tai-khoan/giang-vien/:ma_gv', AdminController.createLecturerAccount);
router.put('/tai-khoan/:id/status', AdminController.updateTaiKhoanStatus);
router.put('/tai-khoan/:id/password', AdminController.changePassword);
router.delete('/tai-khoan/:id', AdminController.deleteTaiKhoan);

router.get('/sinh-vien', AdminController.getSinhViens);
router.get('/sinh-vien/:ma_sv', AdminController.getSinhVienById);
router.post('/sinh-vien', AdminController.createSinhVien);
router.put('/sinh-vien/:ma_sv', AdminController.updateSinhVien);
router.delete('/sinh-vien/:ma_sv', AdminController.deleteSinhVien);

router.get('/giang-vien', AdminController.getGiangViens);
router.get('/giang-vien/:ma_gv', AdminController.getGiangVienById);
router.post('/giang-vien', AdminController.createGiangVien);
router.put('/giang-vien/:ma_gv', AdminController.updateGiangVien);
router.delete('/giang-vien/:ma_gv', AdminController.deleteGiangVien);

router.get('/mon-hoc', AdminController.getMonHocs);
router.get('/mon-hoc/:ma_mon', AdminController.getMonHocById);
router.post('/mon-hoc', AdminController.createMonHoc);
router.put('/mon-hoc/:ma_mon', AdminController.updateMonHoc);
router.delete('/mon-hoc/:ma_mon', AdminController.deleteMonHoc);

router.get('/lop-hoc-phan', AdminController.getLopHocPhans);
router.get('/lop-hoc-phan/:ma_lop_hp', AdminController.getLopHocPhanById);
router.post('/lop-hoc-phan', AdminController.createLopHocPhan);
router.put('/lop-hoc-phan/:ma_lop_hp', AdminController.updateLopHocPhan);
router.delete('/lop-hoc-phan/:ma_lop_hp', AdminController.deleteLopHocPhan);
router.put('/phan-cong/:ma_lop_hp', AdminController.assignGiangVien);
router.get(
    '/lop-hoc-phan/:ma_lop_hp/sinh-vien',
    AdminController.getRegistrationsByClassSection
);

router.post(
    '/lop-hoc-phan/:ma_lop_hp/sinh-vien',
    AdminController.registerStudentToClassSection
);

router.delete(
    '/lop-hoc-phan/:ma_lop_hp/sinh-vien/:ma_sv',
    AdminController.cancelStudentRegistration
);

router.get('/du-lieu-khuon-mat', AdminController.getFaceDataDashboard);
router.get('/du-lieu-khuon-mat/:ma_sv', AdminController.getFaceDataByStudent);
router.post('/du-lieu-khuon-mat/:ma_sv/thu-thap', AdminController.collectFaceData);
router.delete('/du-lieu-khuon-mat/:ma_sv', AdminController.deleteFaceData);
router.post('/du-lieu-khuon-mat/train', AdminController.trainFaceData);
router.post('/du-lieu-khuon-mat/dong-bo', AdminController.syncFaceDataFromDataset);

module.exports = router;
