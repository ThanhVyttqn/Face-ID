const GiangVienService = require('../services/GiangVien_Service');
const { successResponse, errorResponse } = require('../utils/response');

const handle = async (res, fn, successMessage) => {
  try {
    const data = await fn();
    return successResponse(res, successMessage, data);
  } catch (error) {
    return errorResponse(res, error.message || 'Lỗi máy chủ', error.statusCode || 500);
  }
};

const GiangVienController = {
  getMyClasses: (req, res) => handle(res, () => GiangVienService.getMyClasses(req.user.ma_gv), 'Lấy danh sách lớp học phần thành công'),
  getClassDetail: (req, res) => handle(res, () => GiangVienService.getMyClassDetail(req.user.ma_gv, req.params.ma_lop_hp), 'Lấy chi tiết lớp học phần thành công'),
  getClassSessions: (req, res) => handle(res, () => GiangVienService.getMyClassSessions(req.user.ma_gv, req.params.ma_lop_hp), 'Lấy danh sách buổi học thành công'),
  createSession: (req, res) => handle(res, () => GiangVienService.createSession(req.user.ma_gv, {
    ma_lop_hp: req.params.ma_lop_hp,
    ngay_hoc: req.body.ngay_hoc,
    gio_bat_dau: req.body.gio_bat_dau,
    gio_ket_thuc: req.body.gio_ket_thuc,
    trang_thai: req.body.trang_thai || 'chua_dien_ra',
  }), 'Tạo buổi học thành công'),
  getSessionAttendance: (req, res) => handle(res, () => GiangVienService.getSessionAttendance(req.user.ma_gv, Number(req.params.id_buoi)), 'Lấy dữ liệu điểm danh theo buổi học thành công'),
  upsertAttendance: (req, res) => handle(res, () => GiangVienService.upsertAttendance(req.user.ma_gv, Number(req.body.id_buoi), req.body), 'Cập nhật điểm danh thành công'),
  updateSessionStatus: (req, res) => handle(res, async () => {
    const ma_gv = req.user.ma_gv;
    const id_buoi = Number(req.params.id_buoi);
    const { trang_thai } = req.body;
    if (trang_thai === 'dang_dien_ra') return GiangVienService.openAttendance(ma_gv, id_buoi);
    if (trang_thai === 'da_ket_thuc') return GiangVienService.closeAttendance(ma_gv, id_buoi);
    const error = new Error('Trạng thái buổi học không hợp lệ');
    error.statusCode = 400;
    throw error;
  }, 'Cập nhật trạng thái buổi học thành công'),
  getAttendanceHistory: (req, res) => handle(res, () => GiangVienService.getAttendanceHistory(req.user.ma_gv, req.query.search || ''), 'Lấy lịch sử điểm danh thành công'),
  getAttendanceHistoryDetail: (req, res) => handle(res, () => GiangVienService.getAttendanceHistoryBySession(req.user.ma_gv, Number(req.params.id_buoi)), 'Lấy chi tiết lịch sử điểm danh thành công'),
  getProfile: (req, res) => handle(res, () => GiangVienService.getMyProfile(req.user.ma_gv), 'Lấy thông tin tài khoản giảng viên thành công'),
  updateProfile: (req, res) => handle(res, () => GiangVienService.updateMyProfile(req.user.ma_gv, req.body), 'Cập nhật thông tin giảng viên thành công'),
  changePassword: (req, res) => handle(res, () => GiangVienService.changeMyPassword({
    ma_gv: req.user.ma_gv,
    ma_dang_nhap: req.user.ma_dang_nhap,
    mat_khau_cu: req.body.mat_khau_cu,
    mat_khau_moi: req.body.mat_khau_moi,
  }), 'Đổi mật khẩu thành công'),
  startAttendanceSession: (req, res) => handle(res, () => GiangVienService.startAttendanceSession(req.user.ma_gv, req.body || {}), 'Bắt đầu điểm danh thành công'),
  stopAttendanceSession: (req, res) => handle(res, async () => {
    const data = await GiangVienService.stopAttendanceSession(req.user.ma_gv);
    return data || null;
  }, 'Kết thúc điểm danh thành công'),
  getActiveAttendanceSession: (req, res) => handle(res, () => GiangVienService.getActiveAttendanceSession(req.user.ma_gv), 'Lấy phiên điểm danh hiện tại thành công'),
  getAttendanceSessionLogs: (req, res) => handle(res, () => GiangVienService.getAttendanceSessionLogs(req.user.ma_gv), 'Lấy log phiên điểm danh thành công'),
};

module.exports = GiangVienController;
