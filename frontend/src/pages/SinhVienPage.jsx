import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
    CalendarDays,
    Clock3,
    MapPin,
    BookOpen,
    ScanFace,
    Bell,
    CheckCircle2,
    XCircle,
    AlertCircle,
    GraduationCap,
    LogOut,
} from "lucide-react";
import { getSinhVienDashboardApi } from "../api/Auth_api";

function SinhVienPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dashboardData, setDashboardData] = useState({
        student: null,
        nextClass: null,
        attendanceSummary: null,
        todaySchedule: [],
        recentAttendance: [],
        notifications: [],
    });

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getSinhVienDashboardApi();
                const data = response.data?.data || {};

                setDashboardData({
                    student: data.student || null,
                    nextClass: data.nextClass || null,
                    attendanceSummary: data.attendanceSummary || null,
                    todaySchedule: data.todaySchedule || [],
                    recentAttendance: data.recentAttendance || [],
                    notifications: data.notifications || [],
                });
            } catch (err) {
                setError(
                    err.response?.data?.message || "Không tải được dữ liệu sinh viên"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const getAttendanceBadge = (status) => {
        if (status === "Có mặt") {
            return (
                <Badge className="rounded-full bg-emerald-500 hover:bg-emerald-500">
                    Có mặt
                </Badge>
            );
        }
        if (status === "Đi muộn") {
            return (
                <Badge className="rounded-full bg-amber-500 hover:bg-amber-500">
                    Đi muộn
                </Badge>
            );
        }
        if (status === "Vắng") {
            return (
                <Badge className="rounded-full bg-rose-500 hover:bg-rose-500">
                    Vắng
                </Badge>
            );
        }
        return <Badge variant="secondary">{status}</Badge>;
    };

    const getScheduleBadge = (status) => {
        if (status === "Đã học") {
            return (
                <Badge className="rounded-full bg-slate-700 hover:bg-slate-700">
                    Đã học
                </Badge>
            );
        }
        if (status === "Sắp diễn ra") {
            return (
                <Badge className="rounded-full bg-blue-600 hover:bg-blue-600">
                    Sắp diễn ra
                </Badge>
            );
        }
        return <Badge variant="outline">{status || "Chưa tới giờ"}</Badge>;
    };

    const currentDate = useMemo(() => {
        return new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
                Đang tải dữ liệu sinh viên...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-600 font-semibold">{error}</p>
                <Button onClick={handleLogout}>Quay lại đăng nhập</Button>
            </div>
        );
    }

    const student = dashboardData.student || {};
    const nextClass = dashboardData.nextClass || {};
    const attendanceSummary = dashboardData.attendanceSummary || {
        coMat: 0,
        diMuon: 0,
        vang: 0,
        tiLe: "0%",
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
                    <div className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-2xl md:p-10">
                        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sm text-slate-200 md:text-lg">
                                    <CalendarDays className="h-5 w-5" />
                                    <span className="capitalize">{currentDate}</span>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-lg text-slate-200">Xin chào,</p>
                                    <div>
                                        <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                                            {student.hoTen || "Sinh viên"}
                                        </h1>
                                        <p className="mt-3 text-lg text-slate-200 md:text-2xl">
                                            Mã SV:{" "}
                                            <span className="font-semibold text-white">
                                                {student.maSv || "---"}
                                            </span>
                                            <span className="mx-2">·</span>
                                            {student.lop || "---"}
                                            <span className="mx-2">·</span>
                                            {student.khoa || "---"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    <Button className="h-12 rounded-full bg-white px-6 text-base font-semibold text-slate-900 hover:bg-slate-100">
                                        <ScanFace className="mr-2 h-5 w-5" />
                                        Xem trạng thái điểm danh
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-full border-slate-400 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/20"
                                    >
                                        <BookOpen className="mr-2 h-5 w-5" />
                                        Lịch học hôm nay
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleLogout}
                                        className="h-12 rounded-full border-slate-400 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/20"
                                    >
                                        <LogOut className="mr-2 h-5 w-5" />
                                        Đăng xuất
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
                                <p className="text-lg text-slate-200">Buổi học tiếp theo</p>
                                <h2 className="mt-4 text-3xl font-bold">
                                    {nextClass.tenMon || "Chưa có dữ liệu"}
                                </h2>

                                <div className="mt-6 space-y-3 text-lg text-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Clock3 className="h-5 w-5" />
                                        <span>{nextClass.gio || "---"}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5" />
                                        <span>{nextClass.phong || "---"}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <GraduationCap className="h-5 w-5" />
                                        <span>{nextClass.giangVien || "---"}</span>
                                    </div>
                                </div>

                                <Badge className="mt-6 rounded-full bg-blue-500 px-4 py-1 text-sm hover:bg-blue-500">
                                    {nextClass.trangThai || "Chưa có lịch"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <Card className="rounded-[2rem] border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Tỷ lệ điểm danh</p>
                                        <h3 className="mt-2 text-4xl font-bold text-slate-900">
                                            {attendanceSummary.tiLe}
                                        </h3>
                                    </div>
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2rem] border-0 shadow-lg">
                            <CardContent className="grid grid-cols-3 gap-3 p-6 text-center">
                                <div className="rounded-2xl bg-emerald-50 p-4">
                                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                                        {attendanceSummary.coMat}
                                    </p>
                                    <p className="text-sm text-slate-500">Có mặt</p>
                                </div>

                                <div className="rounded-2xl bg-amber-50 p-4">
                                    <AlertCircle className="mx-auto h-6 w-6 text-amber-600" />
                                    <p className="mt-2 text-2xl font-bold text-amber-700">
                                        {attendanceSummary.diMuon}
                                    </p>
                                    <p className="text-sm text-slate-500">Đi muộn</p>
                                </div>

                                <div className="rounded-2xl bg-rose-50 p-4">
                                    <XCircle className="mx-auto h-6 w-6 text-rose-600" />
                                    <p className="mt-2 text-2xl font-bold text-rose-700">
                                        {attendanceSummary.vang}
                                    </p>
                                    <p className="text-sm text-slate-500">Vắng</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-[2rem] border-0 shadow-lg">
                        <CardContent className="p-6 md:p-8">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">
                                        Lịch học hôm nay
                                    </h3>
                                    <p className="text-slate-500">
                                        Theo dõi các buổi học và trạng thái điểm danh trong ngày.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {dashboardData.todaySchedule.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-semibold text-slate-900">
                                                {item.tenMon}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                                                <span className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4" />
                                                    {item.gio}
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    {item.phong}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {getScheduleBadge(item.trangThai)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        <Card className="rounded-[2rem] border-0 shadow-lg">
                            <CardContent className="p-6 md:p-8">
                                <div className="mb-5 flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Thông báo nhanh
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {dashboardData.notifications.map((note, index) => (
                                        <div
                                            key={index}
                                            className="rounded-2xl bg-slate-50 p-4 text-slate-700"
                                        >
                                            {note}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2rem] border-0 shadow-lg">
                            <CardContent className="p-6 md:p-8">
                                <div className="mb-5 flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-slate-700" />
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Điểm danh gần đây
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {dashboardData.recentAttendance.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {item.mon}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {item.ngay} · {item.tiet}
                                                </p>
                                            </div>
                                            {getAttendanceBadge(item.trangThai)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SinhVienPage;