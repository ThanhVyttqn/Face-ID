const AdminService = require('../services/Admin_Service');
const { successResponse, errorResponse } = require('../utils/response');

const handle = async (res, fn, successMessage = 'Success') => {
  try {
    const data = await fn();
    return successResponse(res, successMessage, data);
  } catch (err) {
    return errorResponse(res, err.message, err.statusCode || 500);
  }
};

const AdminController = {
  getKhoa: (req, res) => handle(res, () => AdminService.getKhoa()),
  getLopSv: (req, res) => handle(res, () => AdminService.getLopSv()),
  getSinhVienLookup: (req, res) => handle(res, () => AdminService.getSinhVienLookup()),
  getGiangVienLookup: (req, res) => handle(res, () => AdminService.getGiangVienLookup()),
  getMonHocLookup: (req, res) => handle(res, () => AdminService.getMonHocLookup()),

  getTaiKhoans: (req, res) => handle(res, () => AdminService.getTaiKhoans(req.query)),
  createAdminAccount: (req, res) => handle(res, () => AdminService.createAdminAccount(req.body)),
  createStudentAccount: (req, res) => handle(res, () => AdminService.createStudentAccount(req.params.ma_sv, req.body)),
  createLecturerAccount: (req, res) => handle(res, () => AdminService.createLecturerAccount(req.params.ma_gv, req.body)),
  updateTaiKhoanStatus: (req, res) => handle(res, () => AdminService.updateTaiKhoanStatus(req.params.id, req.body)),
  changePassword: (req, res) => handle(res, () => AdminService.changePassword(req.params.id, req.body)),
  deleteTaiKhoan: (req, res) => handle(res, () => AdminService.deleteTaiKhoan(req.params.id)),

  getSinhViens: (req, res) => handle(res, () => AdminService.getSinhViens(req.query)),
  getSinhVienById: (req, res) => handle(res, () => AdminService.getSinhVienById(req.params.ma_sv)),
  createSinhVien: (req, res) => handle(res, () => AdminService.createSinhVien(req.body)),
  updateSinhVien: (req, res) => handle(res, () => AdminService.updateSinhVien(req.params.ma_sv, req.body)),
  deleteSinhVien: (req, res) => handle(res, () => AdminService.deleteSinhVien(req.params.ma_sv)),

  getGiangViens: (req, res) => handle(res, () => AdminService.getGiangViens(req.query)),
  getGiangVienById: (req, res) => handle(res, () => AdminService.getGiangVienById(req.params.ma_gv)),
  createGiangVien: (req, res) => handle(res, () => AdminService.createGiangVien(req.body)),
  updateGiangVien: (req, res) => handle(res, () => AdminService.updateGiangVien(req.params.ma_gv, req.body)),
  deleteGiangVien: (req, res) => handle(res, () => AdminService.deleteGiangVien(req.params.ma_gv)),

  getMonHocs: (req, res) => handle(res, () => AdminService.getMonHocs(req.query)),
  getMonHocById: (req, res) => handle(res, () => AdminService.getMonHocById(req.params.ma_mon)),
  createMonHoc: (req, res) => handle(res, () => AdminService.createMonHoc(req.body)),
  updateMonHoc: (req, res) => handle(res, () => AdminService.updateMonHoc(req.params.ma_mon, req.body)),
  deleteMonHoc: (req, res) => handle(res, () => AdminService.deleteMonHoc(req.params.ma_mon)),

  getLopHocPhans: (req, res) => handle(res, () => AdminService.getLopHocPhans(req.query)),
  getLopHocPhanById: (req, res) => handle(res, () => AdminService.getLopHocPhanById(req.params.ma_lop_hp)),
  createLopHocPhan: (req, res) => handle(res, () => AdminService.createLopHocPhan(req.body)),
  updateLopHocPhan: (req, res) => handle(res, () => AdminService.updateLopHocPhan(req.params.ma_lop_hp, req.body)),
  deleteLopHocPhan: (req, res) => handle(res, () => AdminService.deleteLopHocPhan(req.params.ma_lop_hp)),
  assignGiangVien: (req, res) => handle(res, () => AdminService.assignGiangVien(req.params.ma_lop_hp, req.body.ma_gv)),
  getRegistrationsByClassSection: (req, res) =>
    handle(
      res,
      () => AdminService.getRegistrationsByClassSection(req.params.ma_lop_hp),
      'Lấy danh sách sinh viên đăng ký lớp học phần thành công'
    ),

  registerStudentToClassSection: (req, res) =>
    handle(
      res,
      () => AdminService.registerStudentToClassSection(req.params.ma_lop_hp, req.body),
      'Đăng ký sinh viên vào lớp học phần thành công'
    ),

  cancelStudentRegistration: (req, res) =>
    handle(
      res,
      () => AdminService.cancelStudentRegistration(req.params.ma_lop_hp, req.params.ma_sv),
      'Hủy đăng ký sinh viên khỏi lớp học phần thành công'
    ),

  getFaceDataDashboard: (req, res) => handle(res, () => AdminService.getFaceDataDashboard(req.query)),
  getFaceDataByStudent: (req, res) => handle(res, () => AdminService.getFaceDataByStudent(req.params.ma_sv)),
  collectFaceData: (req, res) => handle(res, () => AdminService.collectFaceData(req.params.ma_sv, req.body)),
  deleteFaceData: (req, res) => handle(res, () => AdminService.deleteFaceData(req.params.ma_sv)),
  trainFaceData: (req, res) => handle(res, () => AdminService.trainFaceData()),
  syncFaceDataFromDataset: (req, res) => handle(res, () => AdminService.syncFaceDataFromDataset()),
};

module.exports = AdminController;
