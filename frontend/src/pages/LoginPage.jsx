import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    Lock,
    LogIn,
    ShieldCheck,
    User,
    Loader2,
    GraduationCap,
    ScanFace,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Card,
    CardContent,
} from "../components/ui/card";

import { loginApi } from "../api/Auth_api";

function LoginPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        ma_dang_nhap: "",
        mat_khau: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setIsError(false);

        if (!formData.ma_dang_nhap.trim()) {
            setIsError(true);
            setMessage("Vui lòng nhập mã đăng nhập");
            return;
        }

        if (!formData.mat_khau.trim()) {
            setIsError(true);
            setMessage("Vui lòng nhập mật khẩu");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ma_dang_nhap: formData.ma_dang_nhap.trim(),
                mat_khau: formData.mat_khau,
            };

            const response = await loginApi(payload);

            const token = response.data?.data?.token;
            const user = response.data?.data?.account;
            const vaiTro = user?.vai_tro;

            if (!token) {
                throw new Error("Không nhận được token từ server");
            }

            localStorage.setItem("token", token);

            // Lưu cả user và account để đồng bộ với các file khác
            localStorage.setItem("user", JSON.stringify(user || {}));
            localStorage.setItem("account", JSON.stringify(user || {}));

            setMessage("Đăng nhập thành công");

            if (vaiTro === "admin") {
                navigate("/admin", { replace: true });
            } else if (vaiTro === "sinh_vien") {
                navigate("/sinh-vien", { replace: true });
            } else if (vaiTro === "giang_vien") {
                navigate("/giang-vien", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (error) {
            console.error(error);

            setIsError(true);
            setMessage(
                error.response?.data?.message ||
                error.message ||
                "Đăng nhập thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
                {/* Bên trái */}
                <div className="relative hidden overflow-hidden bg-blue-600 lg:block">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />

                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
                    <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10" />
                    <div className="absolute bottom-32 left-20 h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative z-10 flex min-h-screen flex-col justify-between p-12 text-white">
                        <div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
                                    <ScanFace className="h-9 w-9 text-white" />
                                </div>

                                <div>
                                    <h1 className="text-3xl font-bold">
                                        Face ID Attendance
                                    </h1>

                                    <p className="mt-1 text-sm font-medium text-blue-100">
                                        Hệ thống điểm danh sinh viên
                                    </p>
                                </div>
                            </div>

                            <div className="mt-20">
                                <h2 className="max-w-xl text-5xl font-bold leading-tight">
                                    Quản lý điểm danh nhanh chóng, chính xác và hiện đại
                                </h2>

                                <p className="mt-6 max-w-lg text-lg font-medium leading-8 text-blue-100">
                                    Hỗ trợ admin, giảng viên và sinh viên trong quá trình quản lý lớp học, buổi học và điểm danh bằng nhận diện khuôn mặt.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                                <ShieldCheck className="h-7 w-7 text-white" />
                                <p className="mt-3 text-sm font-bold">
                                    Bảo mật
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    Đăng nhập theo vai trò
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                                <GraduationCap className="h-7 w-7 text-white" />
                                <p className="mt-3 text-sm font-bold">
                                    Quản lý lớp
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    Theo dõi học phần
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                                <ScanFace className="h-7 w-7 text-white" />
                                <p className="mt-3 text-sm font-bold">
                                    Nhận diện
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    Điểm danh khuôn mặt
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bên phải */}
                <div className="flex items-center justify-center px-5 py-10">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center lg:hidden">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
                                <ScanFace className="h-8 w-8 text-white" />
                            </div>

                            <h1 className="mt-4 text-3xl font-bold text-gray-950">
                                Face ID Attendance
                            </h1>

                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Hệ thống điểm danh sinh viên
                            </p>
                        </div>

                        <Card className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                            <CardContent className="p-8">
                                <div className="mb-7">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                                            <LogIn className="h-6 w-6 text-blue-600" />
                                        </div>

                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-950">
                                                Đăng nhập
                                            </h2>

                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                Vui lòng nhập tài khoản để tiếp tục
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-gray-800">
                                            Mã đăng nhập
                                        </label>

                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <Input
                                                type="text"
                                                name="ma_dang_nhap"
                                                placeholder="Ví dụ: admin, SV001 hoặc GV001"
                                                value={formData.ma_dang_nhap}
                                                onChange={handleChange}
                                                className="h-12 rounded-xl pl-10 text-sm font-semibold text-gray-950 placeholder:text-gray-400"
                                                autoComplete="username"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-gray-800">
                                            Mật khẩu
                                        </label>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                name="mat_khau"
                                                placeholder="Nhập mật khẩu"
                                                value={formData.mat_khau}
                                                onChange={handleChange}
                                                className="h-12 rounded-xl pl-10 pr-11 text-sm font-semibold text-gray-950 placeholder:text-gray-400"
                                                autoComplete="current-password"
                                                disabled={loading}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {message && (
                                        <div
                                            className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${isError
                                                    ? "border-red-200 bg-red-50 text-red-700"
                                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                }`}
                                        >
                                            {isError ? (
                                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                            ) : (
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                            )}

                                            <span>{message}</span>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="h-12 w-full rounded-xl bg-blue-600 text-base font-bold hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Đang đăng nhập...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="mr-2 h-5 w-5" />
                                                Đăng nhập
                                            </>
                                        )}
                                    </Button>

                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                                        <p className="text-sm font-medium text-gray-600">
                                            Quên mật khẩu?
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-gray-800">
                                            Vui lòng liên hệ quản trị viên
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <p className="mt-6 text-center text-xs font-medium text-gray-400">
                            © 2026 Face ID Attendance System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;