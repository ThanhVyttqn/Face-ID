const { body, param } = require('express-validator');
const {
    requiredCode,
    requiredEnum,
} = require('./Common_Validation');

const vaiTroValues = ['admin', 'sinh_vien', 'giang_vien'];
const trangThaiValues = ['hoat_dong', 'khoa'];

const createAdminAccountValidation = [
    requiredCode('ma_dang_nhap', 'Mã đăng nhập', 20),

    body('mat_khau')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6 đến 100 ký tự'),
];

const createTaiKhoanValidation = [
    requiredCode('ma_dang_nhap', 'Mã đăng nhập', 20),

    body('mat_khau')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6 đến 100 ký tự'),

    requiredEnum('vai_tro', vaiTroValues, 'Vai trò'),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),

    body('ma_sv')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 20 })
        .withMessage('Mã sinh viên không được vượt quá 20 ký tự'),

    body('ma_gv')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 20 })
        .withMessage('Mã giảng viên không được vượt quá 20 ký tự'),
];

const updateTaiKhoanStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID tài khoản phải là số nguyên dương'),

    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),
];

const changePasswordValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID tài khoản phải là số nguyên dương'),

    body('mat_khau_moi')
        .notEmpty()
        .withMessage('Mật khẩu mới không được để trống')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu mới phải từ 6 đến 100 ký tự'),
];

module.exports = {
    createAdminAccountValidation,
    createTaiKhoanValidation,
    updateTaiKhoanStatusValidation,
    changePasswordValidation,
};