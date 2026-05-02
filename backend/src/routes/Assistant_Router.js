const express = require('express');
const AssistantController = require('../controllers/Assistant_Controller');
const auth = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(auth);

router.use((req, res, next) => {
  const vaiTro = req.user?.vai_tro;
  if (!['admin', 'giang_vien'].includes(vaiTro)) {
    return res.status(403).json({
      success: false,
      message: 'Trợ lý hiện chỉ hỗ trợ vai trò admin và giảng viên',
    });
  }
  next();
});

router.post('/chat', AssistantController.chat);

module.exports = router;
