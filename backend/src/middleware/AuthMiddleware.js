const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Thiếu token đăng nhập',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
        });
    }
};

module.exports = authMiddleware;