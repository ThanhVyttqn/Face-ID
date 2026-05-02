import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Clock,
    Users,
    FileSpreadsheet,
    Play,
    Square,
    CheckCircle,
    XCircle,
    AlertCircle,
    UserX,
    CheckCircle2,
    Timer,
    ClipboardCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import {
    getSessionAttendanceApi,
    upsertAttendanceApi,
    updateSessionStatusApi,
} from '../../api/GiangVien_api';
import { toast } from 'sonner';

const formatVietnamTime = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const formatVietnamDate = (value) => {
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

const safeFileName = (value) =>
    String(value || '')
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '_')
        .trim();

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

    if (status === 'muon' || status === 'di_muon') {
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
            label: 'Chưa bắt đầu',
            cls: 'bg-amber-100 text-amber-700 border-amber-200',
        };

    return (
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
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

const AttendanceTodayPage = () => {
    const { id_buoi } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);

            const res = await getSessionAttendanceApi(id_buoi);
            setData(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Không tải được dữ liệu điểm danh buổi học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id_buoi]);

    const mark = async (ma_sv, trang_thai) => {
        if (!data?.buoi_hoc?.id_buoi) {
            toast.error('Không tìm thấy buổi học');
            return;
        }

        try {
            setMarking(true);

            await upsertAttendanceApi({
                id_buoi: data.buoi_hoc.id_buoi,
                ma_sv,
                trang_thai,
                phuong_thuc: 'thu_cong',
            });

            toast.success('Đã cập nhật điểm danh');
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Cập nhật điểm danh thất bại');
        } finally {
            setMarking(false);
        }
    };

    const changeStatus = async (trang_thai) => {
        try {
            setUpdatingStatus(true);

            await updateSessionStatusApi(id_buoi, { trang_thai });

            toast.success('Cập nhật trạng thái buổi học thành công');
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const absentStudents = useMemo(() => {
        if (!data?.danh_sach_sinh_vien) return [];

        return data.danh_sach_sinh_vien.filter(
            (sv) =>
                sv.trang_thai_hom_nay === 'vang' ||
                sv.trang_thai_hom_nay === 'vang_co_phep'
        );
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-medium">Đang tải dữ liệu điểm danh...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Không có dữ liệu buổi học.
            </div>
        );
    }

    const isRunning = data.buoi_hoc?.trang_thai === 'dang_dien_ra';
    const isClosed = data.buoi_hoc?.trang_thai === 'da_ket_thuc';
    const isPending = data.buoi_hoc?.trang_thai === 'chua_dien_ra';
    const isCanceled = data.buoi_hoc?.trang_thai === 'da_huy';

    // Quan trọng: cho phép sửa khi đang diễn ra hoặc đã kết thúc
    const canEditAttendance = isRunning || isClosed;

    const sessionTitle =
        data.buoi_hoc?.ten_buoi ||
        data.buoi_hoc?.ten_buoi_hoc ||
        data.buoi_hoc?.tieu_de ||
        `Buổi học ${data.buoi_hoc?.id_buoi || id_buoi}`;

    const tongSinhVien = data.thong_ke?.tong_sinh_vien || 0;
    const daDiemDanh = data.thong_ke?.da_diem_danh || 0;
    const coMat = data.thong_ke?.co_mat || 0;
    const diMuon = data.thong_ke?.di_muon || 0;
    const vang = (data.thong_ke?.vang || 0) + (data.thong_ke?.vang_co_phep || 0);
    const chuaDiemDanh = data.thong_ke?.chua_diem_danh || 0;

    const progressPercent =
        tongSinhVien > 0 ? Math.round((daDiemDanh / tongSinhVien) * 100) : 0;

    const handleBack = () => {
        const maLopHp = data.lop_hoc_phan?.ma_lop_hp || data.buoi_hoc?.ma_lop_hp;

        if (maLopHp) {
            navigate(`/giang-vien/lop-hoc-phan/${maLopHp}`);
            return;
        }

        navigate('/giang-vien/lop-hoc-phan');
    };

    const exportExcel = () => {
        if (!data?.danh_sach_sinh_vien?.length) {
            toast.error('Không có dữ liệu để xuất Excel');
            return;
        }

        const danhSachRows = data.danh_sach_sinh_vien.map((sv, index) => ({
            STT: index + 1,
            'Mã sinh viên': sv.ma_sv,
            'Họ tên': sv.ho_ten,
            'Lớp': sv.ma_lop || sv.ten_lop || '',
            'Trạng thái': getStatusText(sv.trang_thai_hom_nay),
            'Thời gian điểm danh': formatVietnamTime(sv.thoi_gian_hom_nay),
            'Phương thức': getMethodText(sv.phuong_thuc),
            'Độ tin cậy': sv.do_tin_cay ?? '',
            'Ghi chú': sv.ghi_chu || '',
        }));

        const thongKeRows = [
            {
                'Tên buổi học': sessionTitle,
                'ID buổi': data.buoi_hoc?.id_buoi || '',
                'Mã lớp học phần': data.lop_hoc_phan?.ma_lop_hp || '',
                'Tên môn': data.lop_hoc_phan?.ten_mon || '',
                'Ngày học': formatVietnamDate(data.buoi_hoc?.ngay_hoc),
                'Giờ bắt đầu': data.buoi_hoc?.gio_bat_dau || '',
                'Giờ kết thúc': data.buoi_hoc?.gio_ket_thuc || '',
                'Trạng thái buổi học': getStatusText(data.buoi_hoc?.trang_thai),
                'Tổng sinh viên': tongSinhVien,
                'Đã điểm danh': daDiemDanh,
                'Có mặt': coMat,
                'Đi muộn': diMuon,
                'Vắng': vang,
                'Chưa điểm danh': chuaDiemDanh,
            },
        ];

        const workbook = XLSX.utils.book_new();

        const sheetThongKe = XLSX.utils.json_to_sheet(thongKeRows);
        const sheetDanhSach = XLSX.utils.json_to_sheet(danhSachRows);

        sheetThongKe['!cols'] = [
            { wch: 18 },
            { wch: 10 },
            { wch: 18 },
            { wch: 28 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 16 },
            { wch: 16 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 18 },
        ];

        sheetDanhSach['!cols'] = [
            { wch: 6 },
            { wch: 15 },
            { wch: 28 },
            { wch: 15 },
            { wch: 18 },
            { wch: 22 },
            { wch: 18 },
            { wch: 12 },
            { wch: 35 },
        ];

        XLSX.utils.book_append_sheet(workbook, sheetThongKe, 'Thong ke');
        XLSX.utils.book_append_sheet(workbook, sheetDanhSach, 'Danh sach diem danh');

        XLSX.writeFile(
            workbook,
            `Diem_danh_${safeFileName(data.lop_hoc_phan?.ma_lop_hp || 'lop-hoc')}_${safeFileName(sessionTitle)}.xlsx`
        );

        toast.success('Xuất file Excel thành công');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại lớp học phần
                        </button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportExcel}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Xuất Excel
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-6 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {sessionTitle}
                                    </h1>

                                    <span className="text-gray-300 text-2xl">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        {data.lop_hoc_phan?.ten_mon}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <ClipboardCheck className="w-4 h-4" />
                                        {data.lop_hoc_phan?.ma_lop_hp || '-'}
                                    </span>

                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {formatVietnamDate(data.buoi_hoc?.ngay_hoc)}
                                    </span>

                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {data.buoi_hoc?.gio_bat_dau || '-'} — {data.buoi_hoc?.gio_ket_thuc || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-6">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                            Trạng thái buổi học
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <SessionStatusBadge status={data.buoi_hoc?.trang_thai} />

                                            {isClosed && (
                                                <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold">
                                                    Có thể chỉnh sửa điểm danh
                                                </Badge>
                                            )}

                                            {isCanceled && (
                                                <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 font-semibold">
                                                    Không thể chỉnh sửa
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {isPending && (
                                            <Button
                                                type="button"
                                                onClick={() => changeStatus('dang_dien_ra')}
                                                disabled={updatingStatus}
                                                className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Bắt đầu điểm danh
                                            </Button>
                                        )}

                                        {isRunning && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => changeStatus('da_ket_thuc')}
                                                disabled={updatingStatus}
                                                className="font-semibold"
                                            >
                                                <Square className="w-4 h-4 mr-2" />
                                                Kết thúc điểm danh
                                            </Button>
                                        )}

                                        {isClosed && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled
                                                className="font-semibold"
                                            >
                                                Buổi học đã kết thúc
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
                {/* Thống kê */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        label="Vắng"
                        value={vang}
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

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Bảng sinh viên */}
                    <div className="xl:col-span-8">
                        <Card className="shadow-sm border border-gray-200">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                        <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                        Danh sách điểm danh sinh viên
                                    </CardTitle>

                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                        {data.danh_sach_sinh_vien?.length || 0} SV
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-200">
                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 pl-5">
                                                    MSV
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

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">
                                                    Thời gian
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">
                                                    Phương thức
                                                </TableHead>

                                                <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-right pr-5">
                                                    Hành động
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {data.danh_sach_sinh_vien?.length ? (
                                                data.danh_sach_sinh_vien.map((sv, idx) => (
                                                    <TableRow
                                                        key={sv.ma_sv}
                                                        className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'
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
                                                                {sv.ma_lop || sv.ten_lop || '-'}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <AttendanceStatusBadge status={sv.trang_thai_hom_nay} />
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <span className="text-sm font-semibold text-gray-700">
                                                                {formatVietnamTime(sv.thoi_gian_hom_nay)}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3">
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                {getMethodText(sv.phuong_thuc)}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3 pr-5">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={marking || !canEditAttendance}
                                                                    onClick={() => mark(sv.ma_sv, 'co_mat')}
                                                                    className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40"
                                                                    title={
                                                                        canEditAttendance
                                                                            ? 'Đánh dấu có mặt'
                                                                            : 'Không thể chỉnh sửa khi buổi chưa bắt đầu hoặc đã hủy'
                                                                    }
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={marking || !canEditAttendance}
                                                                    onClick={() => mark(sv.ma_sv, 'vang')}
                                                                    className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 disabled:opacity-40"
                                                                    title={
                                                                        canEditAttendance
                                                                            ? 'Đánh dấu vắng'
                                                                            : 'Không thể chỉnh sửa khi buổi chưa bắt đầu hoặc đã hủy'
                                                                    }
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={marking || !canEditAttendance}
                                                                    onClick={() => mark(sv.ma_sv, 'di_muon')}
                                                                    className="h-8 w-8 p-0 bg-amber-500 hover:bg-amber-600 disabled:opacity-40"
                                                                    title={
                                                                        canEditAttendance
                                                                            ? 'Đánh dấu đi muộn'
                                                                            : 'Không thể chỉnh sửa khi buổi chưa bắt đầu hoặc đã hủy'
                                                                    }
                                                                >
                                                                    <AlertCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-16 text-center">
                                                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-400 font-medium">
                                                            Chưa có sinh viên nào.
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-4 space-y-6">
                        <Card className="shadow-sm border border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    Tổng quan buổi học
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                                        <p className="text-xs font-semibold text-blue-500">
                                            Đã điểm danh
                                        </p>
                                        <p className="text-2xl font-bold text-blue-700 mt-1">
                                            {daDiemDanh}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                        <p className="text-xs font-semibold text-gray-500">
                                            Chưa điểm danh
                                        </p>
                                        <p className="text-2xl font-bold text-gray-700 mt-1">
                                            {chuaDiemDanh}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-gray-600">Có mặt</span>
                                        <span className="text-emerald-600">{coMat}</span>
                                    </div>

                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-gray-600">Đi muộn</span>
                                        <span className="text-amber-600">{diMuon}</span>
                                    </div>

                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-gray-600">Vắng</span>
                                        <span className="text-red-600">{vang}</span>
                                    </div>

                                    <div className="flex justify-between text-sm font-semibold border-t pt-3">
                                        <span className="text-gray-600">Tiến độ</span>
                                        <span className="text-blue-600">{progressPercent}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border border-red-100">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                        <UserX className="w-5 h-5 text-red-500" />
                                        Sinh viên vắng
                                    </CardTitle>

                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-bold">
                                        {absentStudents.length}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 max-h-[360px] overflow-y-auto">
                                {absentStudents.length > 0 ? (
                                    absentStudents.map((sv) => (
                                        <div
                                            key={sv.ma_sv}
                                            className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {sv.ho_ten}
                                                </p>

                                                <p className="text-sm text-gray-500">
                                                    {sv.ma_sv} · {sv.ma_lop || sv.ten_lop || '-'}
                                                </p>
                                            </div>

                                            <div className="flex-shrink-0">
                                                <AttendanceStatusBadge status={sv.trang_thai_hom_nay} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-400 font-medium">
                                        <UserX className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        Không có sinh viên vắng
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTodayPage;