import { Navigate } from "react-router-dom";

function RoleRoute({ children, allowRole }) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (user?.vai_tro !== allowRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleRoute;