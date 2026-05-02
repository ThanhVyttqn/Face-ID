import axios from "axios";

const resolveBaseUrl = () => {
    const envBase = import.meta.env?.VITE_API_BASE_URL;
    if (envBase && String(envBase).trim()) {
        return String(envBase).trim().replace(/\/$/, "");
    }
    return "http://localhost:8000/api";
};

const API = axios.create({
    baseURL: resolveBaseUrl(),
    headers: {
        "Content-Type": "application/json",
    },
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const loginApi = (data) => API.post("/auth/login", data);
export const getMeApi = () => API.get("/auth/me");

export const getSinhVienDashboardApi = () => API.get("/sinh-vien/dashboard");
export const getGiangVienDashboardApi = () => API.get("/giang-vien/dashboard");

export default API;
