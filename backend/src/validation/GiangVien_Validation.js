const { body, param } = require('express-validator');

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const updateProfileRules = [
    body('ho_ten')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Họ tên không được vượt quá 255 ký tự'),

    body('email')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .isLength({ max: 255 })
        .withMessage('Email không được vượt quá 255 ký tự'),

    body('sdt')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(phoneRegex)
        .withMessage('Số điện thoại không hợp lệ'),

    body('ma_khoa')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 20 })
        .withMessage('Mã khoa không hợp lệ'),
];

const changePasswordRules = [
    body('mat_khau_hien_tai')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu hiện tại không được để trống'),

    body('mat_khau_moi')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu mới không được để trống')
        .isLength({ min: 6, max: 255 })
        .withMessage('Mật khẩu mới phải từ 6 đến 255 ký tự'),

    body('xac_nhan_mat_khau')
        .trim()
        .notEmpty()
        .withMessage('Xác nhận mật khẩu không được để trống')
        .custom((value, { req }) => value === req.body.mat_khau_moi)
        .withMessage('Xác nhận mật khẩu không khớp'),
];

const createSessionRules = [
    param('ma_lop_hp')
        .trim()
        .notEmpty()
        .withMessage('Mã lớp học phần không được để trống'),

    body('ngay_hoc')
        .trim()
        .notEmpty()
        .withMessage('Ngày học không được để trống')
        .isISO8601({ strict: true, strictSeparator: true })
        .withMessage('Ngày học phải đúng định dạng YYYY-MM-DD'),

    body('gio_bat_dau')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(timeRegex)
        .withMessage('Giờ bắt đầu phải đúng định dạng HH:mm hoặc HH:mm:ss'),

    body('gio_ket_thuc')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(timeRegex)
        .withMessage('Giờ kết thúc phải đúng định dạng HH:mm hoặc HH:mm:ss'),

    body('trang_thai')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isIn(['chua_dien_ra', 'dang_dien_ra', 'da_ket_thuc', 'da_huy'])
        .withMessage('Trạng thái buổi học không hợp lệ'),
];

const startAttendanceSessionRules = [
    body('id_buoi')
        .notEmpty()
        .withMessage('id_buoi không được để trống')
        .isInt({ min: 1 })
        .withMessage('id_buoi phải là số nguyên dương'),

    body('camera_url')
        .trim()
        .notEmpty()
        .withMessage('camera_url không được để trống')
        .isLength({ max: 1000 })
        .withMessage('camera_url không được vượt quá 1000 ký tự'),
];

const upsertAttendanceRules = [
    body('id_buoi')
        .notEmpty()
        .withMessage('id_buoi không được để trống')
        .isInt({ min: 1 })
        .withMessage('id_buoi phải là số nguyên dương'),

    body('ma_sv')
        .trim()
        .notEmpty()
        .withMessage('Mã sinh viên không được để trống')
        .isLength({ max: 50 })
        .withMessage('Mã sinh viên không được vượt quá 50 ký tự'),

    body('trang_thai')
        .trim()
        .notEmpty()
        .withMessage('Trạng thái không được để trống')
        .isIn(['co_mat', 'di_muon', 'muon', 'vang', 'vang_co_phep'])
        .withMessage('Trạng thái điểm danh không hợp lệ'),

    body('thoi_gian')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Thời gian điểm danh không hợp lệ'),

    body('do_tin_cay')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 1 })
        .withMessage('Độ tin cậy phải từ 0 đến 1'),

    body('phuong_thuc')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 50 })
        .withMessage('Phương thức không hợp lệ'),

    body('ghi_chu')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được vượt quá 1000 ký tự'),
];

const updateSessionStatusRules = [
    param('id_buoi')
        .isInt({ min: 1 })
        .withMessage('id_buoi phải là số nguyên dương'),

    body('trang_thai')
        .trim()
        .notEmpty()
        .withMessage('Trạng thái buổi học không được để trống')
        .isIn(['chua_dien_ra', 'dang_dien_ra', 'da_ket_thuc', 'da_huy'])
        .withMessage('Trạng thái buổi học không hợp lệ'),
];

module.exports = {
    updateProfileRules,
    changePasswordRules,
    createSessionRules,
    startAttendanceSessionRules,
    upsertAttendanceRules,
    updateSessionStatusRules,
};