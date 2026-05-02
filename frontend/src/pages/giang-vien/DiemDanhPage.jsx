import { useEffect, useMemo, useState } from 'react';
import {
    getMyClassesApi,
    getClassSessionsApi,
    getSessionAttendanceApi,
    startAttendanceSessionApi,
    stopAttendanceSessionApi,
    getActiveAttendanceSessionApi,
} from '../../api/GiangVien_api';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';

import {
    BookOpen,
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    ClipboardCheck,
    Play,
    Square,
    Timer,
    Users,
    UserX,
    X,
    Activity,
    Radio,
    AlertCircle,
} from 'lucide-react';

import { toast } from 'sonner';

const formatDateTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const getSessionLabel = (item, index) => {
    const dateText = formatDate(item.ngay_hoc);
    const startText = item.gio_bat_dau || '--';
    const endText = item.gio_ket_thuc || '--';

    return `Buổi ${index + 1} - ${dateText} - ${startText} đến ${endText}`;
};

const getStatusText = (status) => {
    const map = {
        co_mat: 'Có mặt',
        di_muon: 'Đi muộn',
        muon: 'Đi muộn',
        vang: 'Vắng',
        vang_co_phep: 'Vắng có phép',
        chua_diem_danh: 'Chưa điểm danh',
        dang_dien_ra: 'Đang diễn ra',
        da_ket_thuc: 'Đã kết thúc',
        chua_dien_ra: 'Chưa bắt đầu',
        da_huy: 'Đã hủy',
    };

    return map[status] || 'Chưa điểm danh';
};

const getMethodText = (method) => {
    const map = {
        thu_cong: 'Thủ công',
        nhan_dien: 'Nhận diện',
        he_thong: 'Hệ thống',
        camera: 'Camera',
    };

    return map[method] || method || '-';
};

const AttendanceStatusBadge = ({ status }) => {
    if (status === 'co_mat') {
        return (
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold">
                Có mặt
            </Badge>
        );
    }

    if (status === 'di_muon' || status === 'muon') {
        return (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold">
                Đi muộn
            </Badge>
        );
    }

    if (status === 'vang') {
        return (
            <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 font-semibold">
                Vắng
            </Badge>
        );
    }

    if (status === 'vang_co_phep') {
        return (
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-100 font-semibold">
                Vắng có phép
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-gray-500 font-semibold">
            Chưa điểm danh
        </Badge>
    );
};

const SessionStatusBadge = ({ active }) => {
    if (active) {
        return (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                Đang chạy
            </span>
        );
    }

    return (
        <span className="text-sm font-semibold px-3 py-1.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
            Chưa chạy
        </span>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${color.bg} ${color.border}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.iconBg}`}>
            <Icon className={`w-5 h-5 ${color.icon}`} />
        </div>

        <div>
            <p className={`text-2xl font-bold ${color.value}`}>{value}</p>
            <p className={`text-xs font-medium ${color.label}`}>{label}</p>
        </div>
    </div>
);

const DiemDanhPage = () => {
    const [classes, setClasses] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    const [cameraUrl, setCameraUrl] = useState('');

    const [activeSession, setActiveSession] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [starting, setStarting] = useState(false);
    const [stopping, setStopping] = useState(false);

    const recentAttendance = useMemo(
        () => realtimeData?.diem_danh_gan_day || activeSession?.diem_danh_gan_day || [],
        [realtimeData, activeSession]
    );

    const studentList = useMemo(
        () => realtimeData?.danh_sach_sinh_vien || activeSession?.danh_sach_sinh_vien || [],
        [realtimeData, activeSession]
    );

    const stats = realtimeData?.thong_ke || activeSession?.thong_ke || null;

    const fetchClasses = async () => {
        try {
            setLoadingClasses(true);

            const res = await getMyClassesApi();
            setClasses(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách lớp học phần');
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchSessions = async (ma_lop_hp) => {
        if (!ma_lop_hp) {
            setSessions([]);
            return;
        }

        try {
            setLoadingSessions(true);

            const res = await getClassSessionsApi(ma_lop_hp);
            setSessions(res.data?.data?.danh_sach_buoi_hoc || []);
        } catch (error) {
            console.error(error);
            toast.error('Không tải được danh sách buổi học');
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const fetchActiveSession = async () => {
        try {
            const res = await getActiveAttendanceSessionApi();
            const data = res.data?.data;

            if (data?.active) {
                setActiveSession(data);
                setSelectedClass(data.ma_lop_hp || '');
                setSelectedSession(String(data.id_buoi || ''));
                setCameraUrl(data.camera_url || '');
            } else {
                setActiveSession(null);
                setRealtimeData(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRealtimeData = async (id_buoi) => {
        if (!id_buoi) return;

        try {
            const res = await getSessionAttendanceApi(id_buoi);
            setRealtimeData(res.data?.data || null);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchActiveSession();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSessions(selectedClass);
        } else {
            setSessions([]);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (!activeSession?.id_buoi) return;

        fetchRealtimeData(activeSession.id_buoi);

        const interval = setInterval(() => {
            fetchRealtimeData(activeSession.id_buoi);
        }, 3000);

        return () => clearInterval(interval);
    }, [activeSession?.id_buoi]);

    const handleOpenModal = async () => {
        setShowModal(true);

        if (!classes.length) {
            await fetchClasses();
        }
    };

    const handleCloseModal = () => {
        if (starting) return;
        setShowModal(false);
    };

    const handleStart = async () => {
        if (!selectedClass) {
            toast.error('Vui lòng chọn lớp học phần');
            return;
        }

        if (!selectedSession) {
            toast.error('Vui lòng chọn buổi học');
            return;
        }

        if (!cameraUrl.trim()) {
            toast.error('Vui lòng nhập camera_url');
            return;
        }

        try {
            setStarting(true);

            const res = await startAttendanceSessionApi({
                id_buoi: Number(selectedSession),
                camera_url: cameraUrl.trim(),
            });

            const data = res.data?.data;

            setActiveSession({
                active: true,
                ma_lop_hp: data.ma_lop_hp,
                id_buoi: data.id_buoi,
                camera_url: data.camera_url,
                buoi_hoc: data.buoi_hoc,
                started_at: data.started_at,
                thong_ke: data.thong_ke || null,
                danh_sach_sinh_vien: data.danh_sach_sinh_vien || [],
                diem_danh_gan_day: data.diem_danh_gan_day || [],
            });

            await fetchRealtimeData(data.id_buoi);

            setShowModal(false);
            toast.success('Đã bắt đầu điểm danh');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Bắt đầu điểm danh thất bại');
        } finally {
            setStarting(false);
        }
    };

    const handleStop = async () => {
        try {
            setStopping(true);

            await stopAttendanceSessionApi();

            setActiveSession(null);
            setRealtimeData(null);
            setSelectedSession('');

            toast.success('Đã kết thúc điểm danh');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Kết thúc điểm danh thất bại');
        } finally {
            setStopping(false);
        }
    };

    const tongSinhVien = stats?.tong_sinh_vien || 0;
    const daDiemDanh = stats?.da_diem_danh || 0;
    const coMat = stats?.co_mat || 0;
    const diMuon = stats?.di_muon || 0;
    const vang = (stats?.vang || 0) + (stats?.vang_co_phep || 0);
    const chuaDiemDanh = stats?.chua_diem_danh || 0;

    const progressPercent =
        tongSinhVien > 0 ? Math.round((daDiemDanh / tongSinhVien) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                                <Camera className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Điểm danh camera
                                    </h1>

                                    <span className="text-gray-300 text-2xl">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Giảng viên
                                    </h2>
                                </div>

                                <p className="text-sm text-gray-500 font-medium">
                                    Bắt đầu phiên điểm danh nhận diện khuôn mặt và theo dõi kết quả realtime
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Phiên điểm danh hiện tại
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <SessionStatusBadge active={!!activeSession} />

                                            {activeSession?.ma_lop_hp && (
                                                <Badge variant="outline" className="font-semibold">
                                                    Lớp: {activeSession.ma_lop_hp}
                                                </Badge>
                                            )}

                                            {activeSession?.id_buoi && (
                                                <Badge variant="outline" className="font-semibold">
                                                    Buổi: {activeSession.id_buoi}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            type="button"
                                            onClick={handleOpenModal}
                                            disabled={!!activeSession || starting}
                                            className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            {starting ? 'Đang bắt đầu...' : 'Bắt đầu điểm danh'}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleStop}
                                            disabled={!activeSession || stopping}
                                            className="font-semibold"
                                        >
                                            <Square className="w-4 h-4 mr-2" />
                                            {stopping ? 'Đang kết thúc...' : 'Kết thúc điểm danh'}
                                        </Button>
                                    </div>
                                </div>

                                {activeSession && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                Bắt đầu: {formatDateTime(activeSession.started_at)}
                                            </span>

                                            <span className="flex items-center gap-1.5 break-all">
                                                <Radio className="w-4 h-4" />
                                                Camera URL: {activeSession.camera_url}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                                                <span>Tiến độ điểm danh</span>
                                                <span>{progressPercent}%</span>
                                            </div>

                                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
                {/* Thống kê */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        icon={Users}
                        label="Tổng sinh viên"
                        value={tongSinhVien}
                        color={{
                            bg: 'bg-blue-50',
                            border: 'border-blue-100',
                            iconBg: 'bg-blue-100',
                            icon: 'text-blue-600',
                            value: 'text-blue-700',
                            label: 'text-blue-500',
                        }}
                    />

                    <StatCard
                        icon={ClipboardCheck}
                        label="Đã điểm danh"
                        value={daDiemDanh}
                        color={{
                            bg: 'bg-violet-50',
                            border: 'border-violet-100',
                            iconBg: 'bg-violet-100',
                            icon: 'text-violet-600',
                            value: 'text-violet-700',
                            label: 'text-violet-500',
                        }}
                    />

                    <StatCard
                        icon={CheckCircle2}
                        label="Có mặt"
                        value={coMat}
                        color={{
                            bg: 'bg-emerald-50',
                            border: 'border-emerald-100',
                            iconBg: 'bg-emerald-100',
                            icon: 'text-emerald-600',
                            value: 'text-emerald-700',
                            label: 'text-emerald-500',
                        }}
                    />

                    <StatCard
                        icon={Timer}
                        label="Đi muộn"
                        value={diMuon}
                        color={{
                            bg: 'bg-amber-50',
                            border: 'border-amber-100',
                            iconBg: 'bg-amber-100',
                            icon: 'text-amber-600',
                            value: 'text-amber-700',
                            label: 'text-amber-500',
                        }}
                    />

                    <StatCard
                        icon={UserX}
                        label="Vắng / Chưa điểm danh"
                        value={`${vang}/${chuaDiemDanh}`}
                        color={{
                            bg: 'bg-red-50',
                            border: 'border-red-100',
                            iconBg: 'bg-red-100',
                            icon: 'text-red-600',
                            value: 'text-red-700',
                            label: 'text-red-500',
                        }}
                    />
                </div>

                {!activeSession && (
                    <Card className="shadow-sm border border-gray-200">
                        <CardContent className="py-16 text-center">
                            <Activity className="mx-auto h-16 w-16 text-gray-200 mb-4" />

                            <h3 className="text-xl font-bold text-gray-800">
                                Chưa có phiên điểm danh nào đang chạy
                            </h3>

                            <p className="text-gray-500 mt-2">
                                Nhấn “Bắt đầu điểm danh” để chọn lớp học phần, buổi học và nhập camera_url.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Bảng sinh viên */}
                    <div className="xl:col-span-8">
                        <Card className="shadow-sm border border-gray-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                        <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                        Danh sách sinh viên của buổi đang chạy
                                    </CardTitle>

                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                        {studentList.length} SV
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-200">
                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 pl-5">
                                                    Mã SV
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">
                                                    Họ tên
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">
                                                    Lớp
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">
                                                    Trạng thái
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 pr-5">
                                                    Thời gian
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {studentList.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-16 text-center">
                                                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-400 font-medium">
                                                            Chưa có dữ liệu sinh viên.
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                studentList.map((sv, index) => (
                                                    <TableRow
                                                        key={sv.ma_sv}
                                                        className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${index % 2 === 0 ? '' : 'bg-gray-50/40'
                                                            }`}
                                                    >
                                                        <TableCell className="py-3 pl-5">
                                                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                {sv.ma_sv}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {sv.ho_ten}
                                                            </p>
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                {sv.ten_lop || sv.ma_lop || '-'}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <AttendanceStatusBadge status={sv.trang_thai_hom_nay} />
                                                        </TableCell>

                                                        <TableCell className="py-3 pr-5">
                                                            <span className="text-sm font-semibold text-gray-700">
                                                                {formatDateTime(sv.thoi_gian_hom_nay)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gần đây */}
                    <div className="xl:col-span-4">
                        <Card className="shadow-sm border border-gray-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        Điểm danh gần đây
                                    </CardTitle>

                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                        {recentAttendance.length}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 max-h-[540px] overflow-y-auto">
                                {recentAttendance.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-medium">
                                        <Activity className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        Chưa có sinh viên nào được ghi nhận.
                                    </div>
                                ) : (
                                    recentAttendance.map((item) => (
                                        <div
                                            key={`${item.ma_sv}-${item.thoi_gian}-${item.id_diem_danh || ''}`}
                                            className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {item.ho_ten || '-'}
                                                    </p>

                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {item.ma_sv} · {item.ten_lop || item.ma_lop || '-'}
                                                    </p>
                                                </div>

                                                <AttendanceStatusBadge status={item.trang_thai} />
                                            </div>

                                            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDateTime(item.thoi_gian)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modal bắt đầu điểm danh */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between px-6 py-5 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Bắt đầu điểm danh
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Chọn lớp học phần, buổi học và nhập camera_url
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={starting}
                                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">
                                    Lớp học phần
                                </label>

                                <select
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        setSelectedSession('');
                                    }}
                                    disabled={loadingClasses || starting}
                                >
                                    <option value="">-- Chọn lớp học phần --</option>

                                    {classes.map((item) => (
                                        <option key={item.ma_lop_hp} value={item.ma_lop_hp}>
                                            {item.ma_lop_hp} - {item.ten_mon}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">
                                    Buổi học
                                </label>

                                <select
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                                    value={selectedSession}
                                    onChange={(e) => setSelectedSession(e.target.value)}
                                    disabled={!selectedClass || loadingSessions || starting}
                                >
                                    <option value="">-- Chọn buổi học --</option>

                                    {sessions.map((item, index) => (
                                        <option key={item.id_buoi} value={item.id_buoi}>
                                            {getSessionLabel(item, index)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">
                                    Camera URL
                                </label>

                                <Input
                                    type="text"
                                    className="h-11 text-sm font-medium"
                                    placeholder="Ví dụ: http://192.168.1.10:4747/video"
                                    value={cameraUrl}
                                    onChange={(e) => setCameraUrl(e.target.value)}
                                    disabled={starting}
                                />
                            </div>

                            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                                    <div>
                                        <p className="text-sm font-semibold text-blue-700">
                                            Lưu ý
                                        </p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            Camera được xử lý bởi tiến trình Python. Trang web sẽ không hiển thị khung video, chỉ hiển thị kết quả điểm danh realtime.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-5 border-t bg-gray-50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseModal}
                                disabled={starting}
                            >
                                Hủy
                            </Button>

                            <Button
                                type="button"
                                onClick={handleStart}
                                disabled={starting || loadingClasses || loadingSessions}
                                className="bg-blue-600 hover:bg-blue-700 font-semibold"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {starting ? 'Đang bắt đầu...' : 'Xác nhận bắt đầu'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiemDanhPage;