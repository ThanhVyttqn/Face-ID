const {
    requiredCode,
    requiredString,
    requiredInteger,
    optionalInteger,
    optionalString,
    requiredEnum,
    paramCode,
} = require('./Common_Validation');

const trangThaiValues = ['dang_mo', 'da_ket_thuc', 'da_huy'];

const createLopHocPhanValidation = [
    requiredCode('ma_lop_hp', 'Mã lớp học phần', 20),
    requiredCode('ma_mon', 'Mã môn', 10),
    requiredCode('ma_gv', 'Mã giảng viên', 20),
    requiredInteger('hoc_ky', 'Học kỳ', 1),
    requiredString('nam_hoc', 'Năm học', 20),
    optionalString('phong_hoc', 'Phòng học', 50),
    optionalInteger('so_luong_toi_da', 'Số lượng tối đa', 1),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),
];

const updateLopHocPhanValidation = [
    paramCode('ma_lop_hp', 'Mã lớp học phần'),
    requiredCode('ma_mon', 'Mã môn', 10),
    requiredCode('ma_gv', 'Mã giảng viên', 20),
    requiredInteger('hoc_ky', 'Học kỳ', 1),
    requiredString('nam_hoc', 'Năm học', 20),
    optionalString('phong_hoc', 'Phòng học', 50),
    optionalInteger('so_luong_toi_da', 'Số lượng tối đa', 1),
    requiredEnum('trang_thai', trangThaiValues, 'Trạng thái'),
];

const lopHocPhanParamValidation = [
    paramCode('ma_lop_hp', 'Mã lớp học phần'),
];

module.exports = {
    createLopHocPhanValidation,
    updateLopHocPhanValidation,
    lopHocPhanParamValidation,
};