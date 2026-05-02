const AuthService = require('../services/Auth_Service');

const AuthController = {
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async me(req, res) {
    try {
      const result = await AuthService.getMe(req.user.ma_dang_nhap);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },
};

module.exports = AuthController;
