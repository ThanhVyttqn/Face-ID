const AssistantService = require('../services/Assistant_Service');
const { successResponse, errorResponse } = require('../utils/response');

const AssistantController = {
  async chat(req, res) {
    try {
      const { message, history = [] } = req.body || {};

      if (!message || !String(message).trim()) {
        return errorResponse(res, 'Vui lòng nhập nội dung cần trợ lý hỗ trợ', 400);
      }

      const result = await AssistantService.chat({
        user: req.user,
        message: String(message).trim(),
        history: Array.isArray(history) ? history : [],
      });

      // Trả về formatted thay vì data thô để frontend render dễ hơn
      const responseData = {
        executed: result.executed,
        action: result.action,
        missing_fields: result.missing_fields,
        payload: result.payload,
        reply: result.reply,
        // formatted: chuỗi markdown/table đẹp để hiển thị trực tiếp
        formatted: result.formatted ?? null,
        // data: vẫn giữ để frontend có thể tự render nếu cần
        data: result.data,
      };

      return successResponse(res, 'Trợ lý phản hồi thành công', responseData);
    } catch (error) {
      return errorResponse(res, error.message || 'Lỗi trợ lý hệ thống', error.statusCode || 500);
    }
  },
};

module.exports = AssistantController;