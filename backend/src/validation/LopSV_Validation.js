const {
    requiredCode,
    requiredString,
    paramCode,
} = require('./Common_Validation');

const createLopSvValidation = [
    requiredCode('ma_lop', 'Mã lớp', 10),
    requiredString('ten_lop', 'Tên lớp', 100),
    requiredString('khoa_hoc', 'Khóa học', 20),
    requiredCode('ma_khoa', 'Mã khoa', 10),
];

const updateLopSvValidation = [
    paramCode('ma_lop', 'Mã lớp'),
    requiredString('ten_lop', 'Tên lớp', 100),
    requiredString('khoa_hoc', 'Khóa học', 20),
    requiredCode('ma_khoa', 'Mã khoa', 10),
];

const lopSvParamValidation = [
    paramCode('ma_lop', 'Mã lớp'),
];

module.exports = {
    createLopSvValidation,
    updateLopSvValidation,
    lopSvParamValidation,
};