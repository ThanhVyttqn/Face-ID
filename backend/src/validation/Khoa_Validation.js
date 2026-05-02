const {
    requiredCode,
    requiredString,
    paramCode,
} = require('./Common_Validation');

const createKhoaValidation = [
    requiredCode('ma_khoa', 'Mã khoa', 10),
    requiredString('ten_khoa', 'Tên khoa', 255),
];

const updateKhoaValidation = [
    paramCode('ma_khoa', 'Mã khoa'),
    requiredString('ten_khoa', 'Tên khoa', 255),
];

const khoaParamValidation = [
    paramCode('ma_khoa', 'Mã khoa'),
];

module.exports = {
    createKhoaValidation,
    updateKhoaValidation,
    khoaParamValidation,
};