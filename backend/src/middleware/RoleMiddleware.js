const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn chưa đăng nhập",
                });
            }

            const userRole = req.user.vai_tro;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: "Token không chứa vai trò người dùng",
                });
            }

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập chức năng này",
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Lỗi phân quyền",
                error: error.message,
            });
        }
    };
};

module.exports = authorizeRoles;