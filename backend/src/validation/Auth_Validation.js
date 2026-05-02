const { body } = require('express-validator');

const roleValues = ['admin', 'sinh_vien', 'giang_vien'];

const registerValidation = [
    body('vai_tro')
        .notEmpty()
        .withMessage('Vai trò không được để trống')
        .bail()
        .isIn(roleValues)
        .withMessage('Vai trò không hợp lệ'),

    body('ma_dang_nhap')
        .trim()
        .notEmpty()
        .withMessage('Mã đăng nhập không được để trống')
        .bail()
        .isLength({ max: 20 })
        .withMessage('Mã đăng nhập không được vượt quá 20 ký tự')
        .bail()
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Mã đăng nhập không đúng định dạng'),

    body('mat_khau')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .bail()
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6 đến 100 ký tự'),
];

const loginValidation = [
    body('ma_dang_nhap')
        .trim()
        .notEmpty()
        .withMessage('Mã đăng nhập không được để trống')
        .bail()
        .isLength({ max: 20 })
        .withMessage('Mã đăng nhập không được vượt quá 20 ký tự')
        .bail()
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Mã đăng nhập không đúng định dạng'),

    body('mat_khau')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .bail()
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6 đến 100 ký tự'),
];

module.exports = {
    registerValidation,
    loginValidation,
};