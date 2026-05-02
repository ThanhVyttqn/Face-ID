const { body, param } = require('express-validator');

const assistantChatValidation = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('message không được để trống')
        .isLength({ max: 4000 })
        .withMessage('message không được vượt quá 4000 ký tự'),

    body('thread_id')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 120 })
        .withMessage('thread_id không được vượt quá 120 ký tự')
        .matches(/^[A-Za-z0-9:_-]+$/)
        .withMessage('thread_id không đúng định dạng'),
];

const assistantThreadParamValidation = [
    param('thread_id')
        .trim()
        .notEmpty()
        .withMessage('thread_id không hợp lệ')
        .isLength({ max: 120 })
        .withMessage('thread_id không được vượt quá 120 ký tự')
        .matches(/^[A-Za-z0-9:_-]+$/)
        .withMessage('thread_id không đúng định dạng'),
];

module.exports = {
    assistantChatValidation,
    assistantThreadParamValidation,
};
