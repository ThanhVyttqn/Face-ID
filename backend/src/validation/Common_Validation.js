const { body, param } = require('express-validator');

const codeRegex = /^[A-Za-z0-9_-]+$/;
const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

const requiredString = (field, label, max = 255) =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(`${label} không được để trống`)
        .isLength({ max })
        .withMessage(`${label} không được vượt quá ${max} ký tự`);

const optionalString = (field, label, max = 255) =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max })
        .withMessage(`${label} không được vượt quá ${max} ký tự`);

const requiredCode = (field, label, max = 20) =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(`${label} không được để trống`)
        .isLength({ max })
        .withMessage(`${label} không được vượt quá ${max} ký tự`)
        .matches(codeRegex)
        .withMessage(`${label} chỉ được chứa chữ, số, gạch dưới hoặc gạch ngang`);

const paramCode = (field, label = 'Mã') =>
    param(field)
        .trim()
        .notEmpty()
        .withMessage(`${label} không hợp lệ`)
        .matches(codeRegex)
        .withMessage(`${label} chỉ được chứa chữ, số, gạch dưới hoặc gạch ngang`);

const requiredInteger = (field, label, min = 0) =>
    body(field)
        .notEmpty()
        .withMessage(`${label} không được để trống`)
        .isInt({ min })
        .withMessage(`${label} phải là số nguyên >= ${min}`);

const optionalInteger = (field, label, min = 0) =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min })
        .withMessage(`${label} phải là số nguyên >= ${min}`);

const requiredEnum = (field, values, label) =>
    body(field)
        .notEmpty()
        .withMessage(`${label} không được để trống`)
        .isIn(values)
        .withMessage(`${label} không hợp lệ`);

const optionalEnum = (field, values, label) =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .isIn(values)
        .withMessage(`${label} không hợp lệ`);

const optionalEmail = (field = 'email') =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail();

const optionalPhone = (field = 'sdt') =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .matches(phoneRegex)
        .withMessage('Số điện thoại không hợp lệ');

const optionalDate = (field, label) =>
    body(field)
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage(`${label} phải có định dạng YYYY-MM-DD`);

module.exports = {
    requiredString,
    optionalString,
    requiredCode,
    paramCode,
    requiredInteger,
    optionalInteger,
    requiredEnum,
    optionalEnum,
    optionalEmail,
    optionalPhone,
    optionalDate,
};