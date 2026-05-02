import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Calendar,
    Clock,
    Users,
    History,
    BookOpen,
    ClipboardCheck,
    CheckCircle2,
    Activity,
    FileText,
    ChevronRight,
    UserX,
    Timer,
} from 'lucide-react';

import { Input } from '../../components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { getAttendanceHistoryApi } from '../../api/GiangVien_api';
import { toast } from 'sonner';

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

const getStatusText = (status) => {
    const map = {
        dang_dien_ra: 'Đang diễn ra',
        da_ket_thuc: 'Đã kết thúc',
        chua_dien_ra: 'Chưa bắt đầu',
        da_huy: 'Đã hủy',
    };

    return map[status] || 'Không xác định';
};

const getSessionTitle = (item, index) => {
    return (
        item?.ten_buoi ||
        item?.ten_buoi_hoc ||
        item?.tieu_de ||
        `Buổi ${index + 1}`
    );
};

const SessionStatusBadge = ({ status }) => {
    const configs = {
        dang_dien_ra: {
            label: 'Đang diễn ra',
            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        },
        da_ket_thuc: {
            label: 'Đã kết thúc',
            cls: 'bg-gray-100 text-gray-600 border-gray-200',
        },
        da_huy: {
            label: 'Đã hủy',
            cls: 'bg-red-100 text-red-600 border-red-200',
        },
        chua_dien_ra: {
            label: 'Chưa bắt đầu',
            cls: 'bg-amber-100 text-amber-700 border-amber-200',
        },
    };

    const cfg =
        configs[status] || {
            label: getStatusText(status),
            cls: 'bg-gray-100 text-gray-600 border-gray-200',
        };

    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
            {cfg.label}
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

const LichSuDiemDanhPage = () => {
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const normalizeHistoryData = (payload) => {
        if (Array.isArray(payload)) return payload;

        if (Array.isArray(payload?.danh_sach)) return payload.danh_sach;
        if (Array.isArray(payload?.items)) return payload.items;
        if (Array.isArray(payload?.xem_truoc)) return payload.xem_truoc;
        if (Array.isArray(payload?.data)) return payload.data;

        return [];
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const res = await getAttendanceHistoryApi(search);
                const items = normalizeHistoryData(res.data?.data);

                setHistory(items);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || 'Không tải được lịch sử điểm danh');
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const totalSessions = history.length;

    const totalAttendance = useMemo(() => {
        return history.reduce(
            (sum, item) => sum + Number(item.tong_luot_diem_danh || 0),
            0
        );
    }, [history]);

    const completedSessions = useMemo(() => {
        return history.filter((item) => item.trang_thai === 'da_ket_thuc').length;
    }, [history]);

    const runningSessions = useMemo(() => {
        return history.filter((item) => item.trang_thai === 'dang_dien_ra').length;
    }, [history]);

    const goToAttendancePage = (id_buoi) => {
        if (!id_buoi) {
            toast.error('Không tìm thấy ID buổi học');
            return;
        }

        navigate(`/giang-vien/buoi-hoc/${id_buoi}/diem-danh`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                                <History className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Lịch sử điểm danh
                                    </h1>

                                    <span className="text-gray-300 text-2xl">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Giảng viên
                                    </h2>
                                </div>

                                <p className="text-sm text-gray-500 font-medium">
                                    Chọn một buổi điểm danh để xem và chỉnh sửa chi tiết
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                    <div className="lg:col-span-4">
                                        <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>

                                            <div>
                                                <p className="text-3xl font-bold text-blue-700">
                                                    {totalSessions}
                                                </p>
                                                <p className="text-xs font-semibold text-blue-500">
                                                    Buổi điểm danh
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
                                            Tìm kiếm lịch sử
                                        </label>

                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                                            <Input
                                                placeholder="Tìm theo mã lớp, tên môn học hoặc ngày..."
                                                className="h-11 pl-10 text-sm font-medium bg-white rounded-xl"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
                {/* Thống kê */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={FileText}
                        label="Tổng buổi"
                        value={totalSessions}
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
                        label="Tổng lượt điểm danh"
                        value={totalAttendance}
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
                        label="Buổi đã kết thúc"
                        value={completedSessions}
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
                        icon={Activity}
                        label="Đang diễn ra"
                        value={runningSessions}
                        color={{
                            bg: 'bg-amber-50',
                            border: 'border-amber-100',
                            iconBg: 'bg-amber-100',
                            icon: 'text-amber-600',
                            value: 'text-amber-700',
                            label: 'text-amber-500',
                        }}
                    />
                </div>

                {/* Danh sách buổi điểm danh */}
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Danh sách buổi điểm danh
                            </CardTitle>

                            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                {totalSessions} buổi
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 text-center text-gray-400 font-medium">
                                Đang tải dữ liệu...
                            </div>
                        ) : history.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {history.map((item, index) => {
                                    const title = getSessionTitle(item, index);
                                    const thongKe = item.thong_ke || {};
                                    const coMat = thongKe.co_mat || 0;
                                    const diMuon = thongKe.di_muon || 0;
                                    const vang = (thongKe.vang || 0) + (thongKe.vang_co_phep || 0);

                                    return (
                                        <button
                                            type="button"
                                            key={item.id_buoi}
                                            onClick={() => goToAttendancePage(item.id_buoi)}
                                            className="w-full text-left p-5 hover:bg-blue-50/60 transition-all group"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                                                <div className="flex items-start gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                                                        <span className="text-sm font-bold text-blue-600 group-hover:text-white transition-colors">
                                                            {index + 1}
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {title}
                                                            </p>

                                                            <SessionStatusBadge status={item.trang_thai} />
                                                        </div>

                                                        <p className="text-sm font-semibold text-gray-700 mt-1">
                                                            {item.ma_lop_hp} - {item.ten_mon}
                                                        </p>

                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(item.ngay_hoc)}
                                                            </span>

                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {item.gio_bat_dau || '-'} - {item.gio_ket_thuc || '-'}
                                                            </span>

                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {item.tong_luot_diem_danh || 0} lượt điểm danh
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold">
                                                        Có mặt {coMat}
                                                    </Badge>

                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold">
                                                        Muộn {diMuon}
                                                    </Badge>

                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200 font-semibold">
                                                        Vắng {vang}
                                                    </Badge>

                                                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                                                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center px-6">
                                <Search className="w-14 h-14 text-gray-200 mx-auto mb-3" />

                                <p className="text-xl font-bold text-gray-700">
                                    Không tìm thấy buổi điểm danh nào
                                </p>

                                <p className="text-gray-500 mt-2">
                                    Hãy thử thay đổi từ khóa tìm kiếm.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LichSuDiemDanhPage;