const {
    requiredCode,
    requiredEnum,
    paramCode,
} = require('./Common_Validation');

const trangThaiValues = ['da_dang_ky', 'da_huy', 'hoan_thanh'];

const createDangKyLopHocValidation = [
    requiredCode('ma_sv', 'Mã sinh viên', 20),
    requiredCode('ma_lop_hp', 'Mã lớp học phần', 20),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),
];

const updateDangKyLopHocStatusValidation = [
    paramCode('ma_sv', 'Mã sinh viên'),
    paramCode('ma_lop_hp', 'Mã lớp học phần'),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),
];

const dangKyLopHocParamValidation = [
    paramCode('ma_sv', 'Mã sinh viên'),
    paramCode('ma_lop_hp', 'Mã lớp học phần'),
];

module.exports = {
    createDangKyLopHocValidation,
    updateDangKyLopHocStatusValidation,
    dangKyLopHocParamValidation,
};