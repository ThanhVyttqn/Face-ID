const {
    requiredCode,
    requiredString,
    requiredInteger,
    paramCode,
} = require('./Common_Validation');

const createMonHocValidation = [
    requiredCode('ma_mon', 'Mã môn', 10),
    requiredString('ten_mon', 'Tên môn', 255),
    requiredInteger('so_tin_chi', 'Số tín chỉ', 1),
    requiredInteger('so_tiet', 'Số tiết', 1),
];

const updateMonHocValidation = [
    paramCode('ma_mon', 'Mã môn'),
    requiredString('ten_mon', 'Tên môn', 255),
    requiredInteger('so_tin_chi', 'Số tín chỉ', 1),
    requiredInteger('so_tiet', 'Số tiết', 1),
];

const monHocParamValidation = [
    paramCode('ma_mon', 'Mã môn'),
];

module.exports = {
    createMonHocValidation,
    updateMonHocValidation,
    monHocParamValidation,
};