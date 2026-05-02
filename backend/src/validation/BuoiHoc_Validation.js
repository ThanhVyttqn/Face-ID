const { body, param } = require('express-validator');
const {
    requiredCode,
    requiredEnum,
} = require('./Common_Validation');

const trangThaiValues = ['chua_dien_ra', 'dang_dien_ra', 'da_ket_thuc', 'da_huy'];

const timeValidator = (field, label) =>
    body(field)
        .notEmpty()
        .withMessage(`${label} không được để trống`)
        .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/)
        .withMessage(`${label} phải có định dạng HH:mm hoặc HH:mm:ss`);

const createBuoiHocValidation = [
    requiredCode('ma_lop_hp', 'Mã lớp học phần', 20),

    body('ngay_hoc')
        .notEmpty()
        .withMessage('Ngày học không được để trống')
        .isISO8601()
        .withMessage('Ngày học phải có định dạng YYYY-MM-DD'),

    timeValidator('gio_bat_dau', 'Giờ bắt đầu'),
    timeValidator('gio_ket_thuc', 'Giờ kết thúc'),

    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),

    body('gio_ket_thuc')
        .custom((value, { req }) => {
            if (!req.body.gio_bat_dau || !value) return true;
            return value > req.body.gio_bat_dau;
        })
        .withMessage('Giờ kết thúc phải lớn hơn giờ bắt đầu'),
];

const updateBuoiHocValidation = [
    param('id_buoi')
        .isInt({ min: 1 })
        .withMessage('ID buổi học phải là số nguyên dương'),

    requiredCode('ma_lop_hp', 'Mã lớp học phần', 20),

    body('ngay_hoc')
        .notEmpty()
        .withMessage('Ngày học không được để trống')
        .isISO8601()
        .withMessage('Ngày học phải có định dạng YYYY-MM-DD'),

    timeValidator('gio_bat_dau', 'Giờ bắt đầu'),
    timeValidator('gio_ket_thuc', 'Giờ kết thúc'),

    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),

    body('gio_ket_thuc')
        .custom((value, { req }) => {
            if (!req.body.gio_bat_dau || !value) return true;
            return value > req.body.gio_bat_dau;
        })
        .withMessage('Giờ kết thúc phải lớn hơn giờ bắt đầu'),
];

const buoiHocParamValidation = [
    param('id_buoi')
        .isInt({ min: 1 })
        .withMessage('ID buổi học phải là số nguyên dương'),
];

module.exports = {
    createBuoiHocValidation,
    updateBuoiHocValidation,
    buoiHocParamValidation,
};