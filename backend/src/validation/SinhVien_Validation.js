const { body } = require('express-validator');
const {
    requiredCode,
    requiredString,
    paramCode,
    optionalEmail,
    optionalPhone,
    optionalDate,
    optionalEnum,
} = require('./Common_Validation');

const gioiTinhValues = ['Nam', 'Nữ', 'Khác'];

const createSinhVienValidation = [
    requiredCode('ma_sv', 'Mã sinh viên', 20),
    requiredString('ho_ten', 'Họ tên', 255),
    optionalEnum('gioi_tinh', gioiTinhValues, 'Giới tính'),
    optionalDate('ngay_sinh', 'Ngày sinh'),
    optionalEmail('email'),
    optionalPhone('sdt'),
    requiredCode('ma_lop', 'Mã lớp', 10),
];

const updateSinhVienValidation = [
    paramCode('ma_sv', 'Mã sinh viên'),
    requiredString('ho_ten', 'Họ tên', 255),
    optionalEnum('gioi_tinh', gioiTinhValues, 'Giới tính'),
    optionalDate('ngay_sinh', 'Ngày sinh'),
    optionalEmail('email'),
    optionalPhone('sdt'),
    requiredCode('ma_lop', 'Mã lớp', 10),
];

const sinhVienParamValidation = [
    paramCode('ma_sv', 'Mã sinh viên'),
];

const createStudentAccountValidation = [
    paramCode('ma_sv', 'Mã sinh viên'),
    body('mat_khau')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6, max: 100 })
        .withMessage('Mật khẩu phải từ 6 đến 100 ký tự'),
];

module.exports = {
    createSinhVienValidation,
    updateSinhVienValidation,
    sinhVienParamValidation,
    createStudentAccountValidation,
};