const { body, param } = require('express-validator');
const {
    requiredCode,
    requiredEnum,
    optionalString,
} = require('./Common_Validation');

const trangThaiValues = ['co_mat', 'di_muon', 'vang', 'vang_co_phep'];
const phuongThucValues = ['thu_cong', 'khuon_mat', 'qr', 'rfid'];

const createDiemDanhValidation = [
    body('id_buoi')
        .notEmpty()
        .withMessage('ID buổi học không được để trống')
        .isInt({ min: 1 })
        .withMessage('ID buổi học phải là số nguyên dương'),

    requiredCode('ma_lop_hp', 'Mã lớp học phần', 20),
    requiredCode('ma_sv', 'Mã sinh viên', 20),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái điểm danh'),
    requiredEnum('phuong_thuc', phuongThucValues, 'Phương thức điểm danh'),

    body('thoi_gian')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Thời gian phải đúng định dạng ngày giờ ISO'),

    body('do_tin_cay')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0, max: 1 })
        .withMessage('Độ tin cậy phải nằm trong khoảng từ 0 đến 1'),

    optionalString('ghi_chu', 'Ghi chú', 1000),
];

const updateDiemDanhValidation = [
    param('id_diem_danh')
        .isInt({ min: 1 })
        .withMessage('ID điểm danh phải là số nguyên dương'),

    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái điểm danh'),
    requiredEnum('phuong_thuc', phuongThucValues, 'Phương thức điểm danh'),

    body('thoi_gian')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Thời gian phải đúng định dạng ngày giờ ISO'),

    body('do_tin_cay')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0, max: 1 })
        .withMessage('Độ tin cậy phải nằm trong khoảng từ 0 đến 1'),

    optionalString('ghi_chu', 'Ghi chú', 1000),
];

const diemDanhParamValidation = [
    param('id_diem_danh')
        .isInt({ min: 1 })
        .withMessage('ID điểm danh phải là số nguyên dương'),
];

module.exports = {
    createDiemDanhValidation,
    updateDiemDanhValidation,
    diemDanhParamValidation,
};