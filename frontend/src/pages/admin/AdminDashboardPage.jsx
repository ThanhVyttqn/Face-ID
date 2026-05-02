import { useEffect, useMemo, useState } from "react";
import {
    LayoutDashboard,
    Users,
    ScanFace,
    UserRoundX,
    CheckCircle2,
    AlertTriangle,
    Database,
    RefreshCcw,
    BarChart3,
} from "lucide-react";
import { getFaceDataDashboardApi } from "../../api/Admin_api";

const StatCard = ({ icon: Icon, label, value, color }) => {
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${color.bg} ${color.border}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm font-semibold ${color.label}`}>
                        {label}
                    </p>

                    <p className={`mt-2 text-4xl font-bold ${color.value}`}>
                        {value}
                    </p>
                </div>

                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color.iconBg}`}>
                    <Icon className={`h-6 w-6 ${color.icon}`} />
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboardPage() {
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        missing: 0,
        ready: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await getFaceDataDashboardApi({});
            const data = res.data?.data || [];

            const missing = data.filter((item) => item.de_xuat_them_khuon_mat).length;

            setRows(data);
            setStats({
                total: data.length,
                missing,
                ready: data.length - missing,
            });
        } catch (err) {
            console.error(err);
            setError("Không tải được dữ liệu dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const readyPercent = useMemo(() => {
        if (!stats.total) return 0;
        return Math.round((stats.ready / stats.total) * 100);
    }, [stats]);

    const missingStudents = useMemo(() => {
        return rows
            .filter((item) => item.de_xuat_them_khuon_mat)
            .slice(0, 8);
    }, [rows]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-gray-600">
                    <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                    <p className="font-semibold text-gray-800">
                        Đang tải dashboard admin...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                                <LayoutDashboard className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-950">
                                        Dashboard Admin
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Quản lý hệ thống
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Theo dõi dữ liệu sinh viên, khuôn mặt và trạng thái sẵn sàng điểm danh.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Tải lại dữ liệu
                        </button>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
                {error && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-semibold text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard
                        icon={Users}
                        label="Tổng sinh viên"
                        value={stats.total}
                        color={{
                            bg: "bg-blue-50",
                            border: "border-blue-100",
                            iconBg: "bg-blue-100",
                            icon: "text-blue-600",
                            value: "text-blue-700",
                            label: "text-blue-600",
                        }}
                    />

                    <StatCard
                        icon={CheckCircle2}
                        label="Đã có khuôn mặt"
                        value={stats.ready}
                        color={{
                            bg: "bg-emerald-50",
                            border: "border-emerald-100",
                            iconBg: "bg-emerald-100",
                            icon: "text-emerald-600",
                            value: "text-emerald-700",
                            label: "text-emerald-600",
                        }}
                    />

                    <StatCard
                        icon={UserRoundX}
                        label="Chưa có khuôn mặt"
                        value={stats.missing}
                        color={{
                            bg: "bg-amber-50",
                            border: "border-amber-100",
                            iconBg: "bg-amber-100",
                            icon: "text-amber-600",
                            value: "text-amber-700",
                            label: "text-amber-600",
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Tổng quan dữ liệu */}
                    <div className="xl:col-span-7">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                            <div className="p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-950">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                            Tổng quan dữ liệu khuôn mặt
                                        </h3>

                                        <p className="mt-1 text-sm font-medium text-gray-600">
                                            Tỉ lệ sinh viên đã có dữ liệu khuôn mặt trong hệ thống.
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-blue-700">
                                            {readyPercent}%
                                        </p>
                                        <p className="text-xs font-semibold text-gray-500">
                                            Hoàn tất
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-sm font-semibold text-gray-600 mb-2">
                                        <span>Tiến độ dữ liệu</span>
                                        <span>
                                            {stats.ready}/{stats.total} sinh viên
                                        </span>
                                    </div>

                                    <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-blue-600 transition-all"
                                            style={{ width: `${readyPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <ScanFace className="h-5 w-5 text-emerald-600" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-emerald-600">
                                                    Sẵn sàng nhận diện
                                                </p>
                                                <p className="text-2xl font-bold text-emerald-700">
                                                    {stats.ready}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-amber-600">
                                                    Cần bổ sung khuôn mặt
                                                </p>
                                                <p className="text-2xl font-bold text-amber-700">
                                                    {stats.missing}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách cần bổ sung */}
                    <div className="xl:col-span-5">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-red-500" />

                            <div className="p-6">
                                <div className="flex items-center justify-between gap-4 mb-5">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-950">
                                            <UserRoundX className="h-5 w-5 text-amber-600" />
                                            Sinh viên cần bổ sung
                                        </h3>

                                        <p className="mt-1 text-sm font-medium text-gray-600">
                                            Danh sách sinh viên chưa đủ dữ liệu khuôn mặt.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
                                        {stats.missing}
                                    </span>
                                </div>

                                {missingStudents.length > 0 ? (
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {missingStudents.map((student, index) => (
                                            <div
                                                key={`${student.ma_sv || index}`}
                                                className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-950 truncate">
                                                            {student.ho_ten || "Chưa có tên"}
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-gray-600">
                                                            {student.ma_sv || "-"} · {student.ma_lop || student.ten_lop || "-"}
                                                        </p>
                                                    </div>

                                                    <span className="shrink-0 rounded-full bg-white border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                                                        Thiếu ảnh
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 mb-3" />

                                        <p className="text-lg font-bold text-gray-900">
                                            Dữ liệu đã đầy đủ
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-gray-500">
                                            Tất cả sinh viên đã có dữ liệu khuôn mặt.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hướng dẫn nhanh */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-gray-950">
                        <Database className="h-5 w-5 text-blue-600" />
                        Gợi ý quản lý dữ liệu
                    </h3>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                            <p className="font-bold text-gray-900">
                                1. Kiểm tra sinh viên thiếu ảnh
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Vào mục dữ liệu khuôn mặt để xem chi tiết từng sinh viên cần bổ sung.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                            <p className="font-bold text-gray-900">
                                2. Thu thập khuôn mặt
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Thực hiện thu thập ảnh khuôn mặt cho sinh viên chưa có dữ liệu.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                            <p className="font-bold text-gray-900">
                                3. Huấn luyện và đồng bộ
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Sau khi đủ dữ liệu, tiến hành train model và đồng bộ hệ thống điểm danh.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}