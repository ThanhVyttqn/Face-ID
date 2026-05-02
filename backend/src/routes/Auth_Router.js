const express = require('express');
const AuthController = require('../controllers/Auth_Controller');
const validateRequest = require('../middleware/ValidationMiddleware');
const authMiddleware = require('../middleware/AuthMiddleware');
const { registerValidation, loginValidation } = require('../validation/Auth_Validation');

const router = express.Router();

router.post('/register', registerValidation, validateRequest, AuthController.register);
router.post('/login', loginValidation, validateRequest, AuthController.login);
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;
