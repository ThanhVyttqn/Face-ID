import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Clock,
    Users,
    Camera,
    FileSpreadsheet,
    Plus,
    GraduationCap,
    BarChart3,
    CheckCircle2,
    ClipboardList,
    X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '../../components/ui/button';
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
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
    getClassDetailApi,
    createSessionApi,
    getAttendanceHistoryDetailApi,
} from '../../api/GiangVien_api';
import { toast } from 'sonner';

const formatDate = (value) => {
    if (!value) return '-';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatTime = (value) => {
    if (!value) return '-';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
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

const getSessionName = (session, index) =>
    session?.ten_buoi ||
    session?.ten_buoi_hoc ||
    session?.tieu_de ||
    `Buổi ${index + 1}`;

const safeFileName = (value) =>
    String(value || '')
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '_')
        .trim();

const safeSheetName = (value) =>
    String(value || 'Sheet')
        .replace(/[\\/?*\[\]:]/g, '-')
        .slice(0, 31);

const getUniqueSheetName = (workbook, baseName) => {
    let name = safeSheetName(baseName);

    if (!workbook.SheetNames.includes(name)) {
        return name;
    }

    let count = 2;

    while (workbook.SheetNames.includes(name)) {
        const suffix = `_${count}`;
        name = `${safeSheetName(baseName).slice(0, 31 - suffix.length)}${suffix}`;
        count += 1;
    }

    return name;
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
    };

    const cfg =
        configs[status] || {
            label: 'Chưa diễn ra',
            cls: 'bg-amber-100 text-amber-700 border-amber-200',
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

const ClassDetailPage = () => {
    const { ma_lop_hp } = useParams();
    const navigate = useNavigate();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [sessionForm, setSessionForm] = useState({
        ngay_hoc: '',
        gio_bat_dau: '07:00:00',
        gio_ket_thuc: '09:30:00',
    });

    const loadDetail = async () => {
        try {
            setLoading(true);

            const res = await getClassDetailApi(ma_lop_hp);
            setDetail(res.data.data);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Không tải được chi tiết lớp học phần');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [ma_lop_hp]);

    const sessions = useMemo(() => detail?.danh_sach_buoi_hoc || [], [detail]);

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => Number(a.id_buoi) - Number(b.id_buoi));
    }, [sessions]);

    useEffect(() => {
        if (!sortedSessions.length) {
            setSelectedSessionId('');
            return;
        }

        const exists = sortedSessions.some(
            (session) => String(session.id_buoi) === String(selectedSessionId)
        );

        if (selectedSessionId && !exists) {
            setSelectedSessionId('');
        }
    }, [sortedSessions, selectedSessionId]);

    const selectedSession = useMemo(() => {
        return sortedSessions.find(
            (session) => String(session.id_buoi) === String(selectedSessionId)
        );
    }, [sortedSessions, selectedSessionId]);

    const selectedSessionIndex = useMemo(() => {
        return sortedSessions.findIndex(
            (session) => String(session.id_buoi) === String(selectedSessionId)
        );
    }, [sortedSessions, selectedSessionId]);

    const resetSessionForm = () => {
        setSessionForm({
            ngay_hoc: '',
            gio_bat_dau: '07:00:00',
            gio_ket_thuc: '09:30:00',
        });
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();

        if (!sessionForm.ngay_hoc) {
            toast.error('Vui lòng chọn ngày học');
            return;
        }

        try {
            setCreating(true);

            await createSessionApi(ma_lop_hp, sessionForm);

            toast.success('Tạo buổi học thành công');

            resetSessionForm();
            setShowCreateModal(false);
            setSelectedSessionId('');

            await loadDetail();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Tạo buổi học thất bại');
        } finally {
            setCreating(false);
        }
    };

    const exportAllSessionsExcel = async () => {
        if (!detail?.danh_sach_buoi_hoc?.length) {
            toast.error('Lớp học phần này chưa có buổi học để xuất Excel');
            return;
        }

        try {
            setExportingExcel(true);

            const lopHocPhan = detail.lop_hoc_phan;
            const danhSachBuoiHoc = [...sessions].sort(
                (a, b) => Number(a.id_buoi) - Number(b.id_buoi)
            );
            const danhSachSinhVien = detail.danh_sach_sinh_vien || [];

            const sessionDetails = await Promise.all(
                danhSachBuoiHoc.map(async (session, index) => {
                    const res = await getAttendanceHistoryDetailApi(session.id_buoi);

                    return {
                        index,
                        session,
                        detail: res.data.data,
                    };
                })
            );

            const workbook = XLSX.utils.book_new();
            const tongBuoiHoc = danhSachBuoiHoc.length;

            const tongHopSinhVienRows = danhSachSinhVien.map((sv, index) => {
                const soBuoiCoMat = sv.so_buoi_co_mat || 0;
                const soBuoiDiMuon = sv.so_buoi_di_muon || 0;
                const soBuoiVang = sv.so_buoi_vang || 0;
                const soBuoiVangCoPhep = sv.so_buoi_vang_co_phep || 0;
                const tongBuoiDaCoDuLieu = sv.tong_buoi_da_co_du_lieu || 0;
                const soBuoiChuaCoDuLieu = Math.max(tongBuoiHoc - tongBuoiDaCoDuLieu, 0);

                const tiLeChuyenCan =
                    tongBuoiHoc > 0
                        ? `${(((soBuoiCoMat + soBuoiDiMuon) / tongBuoiHoc) * 100).toFixed(1)}%`
                        : '0%';

                return {
                    STT: index + 1,
                    'Mã sinh viên': sv.ma_sv,
                    'Họ tên': sv.ho_ten,
                    'Lớp': sv.ma_lop || sv.ten_lop || '',
                    'Số buổi có mặt': soBuoiCoMat,
                    'Số buổi đi muộn': soBuoiDiMuon,
                    'Số buổi vắng': soBuoiVang,
                    'Số buổi vắng có phép': soBuoiVangCoPhep,
                    'Số buổi chưa có dữ liệu': soBuoiChuaCoDuLieu,
                    'Tổng buổi học': tongBuoiHoc,
                    'Tỉ lệ chuyên cần': tiLeChuyenCan,
                };
            });

            const danhSachBuoiHocRows = sessionDetails.map(({ session, detail: sd, index }) => {
                const thongKe = sd?.thong_tin_buoi_hoc?.thong_ke || {};

                return {
                    STT: index + 1,
                    'Tên buổi học': getSessionName(session, index),
                    'ID buổi': session.id_buoi,
                    'Mã lớp học phần': lopHocPhan?.ma_lop_hp || '',
                    'Tên môn': lopHocPhan?.ten_mon || '',
                    'Ngày học': formatDate(session.ngay_hoc),
                    'Giờ bắt đầu': session.gio_bat_dau || '',
                    'Giờ kết thúc': session.gio_ket_thuc || '',
                    'Trạng thái': getStatusText(session.trang_thai),
                    'Tổng sinh viên': thongKe.tong_sinh_vien || 0,
                    'Đã điểm danh': thongKe.da_diem_danh || 0,
                    'Có mặt': thongKe.co_mat || 0,
                    'Đi muộn': thongKe.di_muon || 0,
                    'Vắng': thongKe.vang || 0,
                    'Vắng có phép': thongKe.vang_co_phep || 0,
                    'Chưa điểm danh': thongKe.chua_diem_danh || 0,
                };
            });

            const sheetTongHop = XLSX.utils.json_to_sheet(tongHopSinhVienRows);
            const sheetBuoiHoc = XLSX.utils.json_to_sheet(danhSachBuoiHocRows);

            sheetTongHop['!cols'] = [
                { wch: 6 },
                { wch: 15 },
                { wch: 28 },
                { wch: 15 },
                { wch: 16 },
                { wch: 16 },
                { wch: 14 },
                { wch: 20 },
                { wch: 22 },
                { wch: 15 },
                { wch: 16 },
            ];

            sheetBuoiHoc['!cols'] = [
                { wch: 6 },
                { wch: 16 },
                { wch: 10 },
                { wch: 18 },
                { wch: 28 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
                { wch: 18 },
                { wch: 16 },
                { wch: 16 },
                { wch: 12 },
                { wch: 12 },
                { wch: 12 },
                { wch: 16 },
                { wch: 18 },
            ];

            XLSX.utils.book_append_sheet(workbook, sheetTongHop, 'Tong hop sinh vien');
            XLSX.utils.book_append_sheet(workbook, sheetBuoiHoc, 'Danh sach buoi hoc');

            sessionDetails.forEach(({ session, detail: sd, index }) => {
                const students = sd?.danh_sach_sinh_vien || [];
                const thongKe = sd?.thong_tin_buoi_hoc?.thong_ke || {};
                const tenBuoi = getSessionName(session, index);

                const summaryRows = [
                    {
                        STT: '',
                        'Tên buổi học': 'THÔNG TIN BUỔI HỌC',
                        'ID buổi': '',
                        'Mã lớp học phần': '',
                        'Tên môn': '',
                        'Ngày học': '',
                        'Giờ bắt đầu': '',
                        'Giờ kết thúc': '',
                        'Mã sinh viên': '',
                        'Họ tên': '',
                        'Lớp': '',
                        'Trạng thái': '',
                        'Thời gian điểm danh': '',
                        'Phương thức': '',
                        'Độ tin cậy': '',
                        'Ghi chú': '',
                    },
                    {
                        STT: '',
                        'Tên buổi học': tenBuoi,
                        'ID buổi': session.id_buoi,
                        'Mã lớp học phần': lopHocPhan?.ma_lop_hp || '',
                        'Tên môn': lopHocPhan?.ten_mon || '',
                        'Ngày học': formatDate(session.ngay_hoc),
                        'Giờ bắt đầu': session.gio_bat_dau || '',
                        'Giờ kết thúc': session.gio_ket_thuc || '',
                        'Mã sinh viên': '',
                        'Họ tên': '',
                        'Lớp': '',
                        'Trạng thái': getStatusText(session.trang_thai),
                        'Thời gian điểm danh': '',
                        'Phương thức': '',
                        'Độ tin cậy': '',
                        'Ghi chú': '',
                    },
                    {
                        STT: '',
                        'Tên buổi học': 'THỐNG KÊ',
                        'ID buổi': '',
                        'Mã lớp học phần': `Tổng SV: ${thongKe.tong_sinh_vien || 0}`,
                        'Tên môn': `Đã điểm danh: ${thongKe.da_diem_danh || 0}`,
                        'Ngày học': `Có mặt: ${thongKe.co_mat || 0}`,
                        'Giờ bắt đầu': `Đi muộn: ${thongKe.di_muon || 0}`,
                        'Giờ kết thúc': `Vắng: ${thongKe.vang || 0}`,
                        'Mã sinh viên': `Vắng phép: ${thongKe.vang_co_phep || 0}`,
                        'Họ tên': `Chưa điểm danh: ${thongKe.chua_diem_danh || 0}`,
                        'Lớp': '',
                        'Trạng thái': '',
                        'Thời gian điểm danh': '',
                        'Phương thức': '',
                        'Độ tin cậy': '',
                        'Ghi chú': '',
                    },
                    {},
                ];

                const studentRows = students.map((sv, si) => ({
                    STT: si + 1,
                    'Tên buổi học': tenBuoi,
                    'ID buổi': session.id_buoi,
                    'Mã lớp học phần': lopHocPhan?.ma_lop_hp || '',
                    'Tên môn': lopHocPhan?.ten_mon || '',
                    'Ngày học': formatDate(session.ngay_hoc),
                    'Giờ bắt đầu': session.gio_bat_dau || '',
                    'Giờ kết thúc': session.gio_ket_thuc || '',
                    'Mã sinh viên': sv.ma_sv,
                    'Họ tên': sv.ho_ten,
                    'Lớp': sv.ma_lop || sv.ten_lop || '',
                    'Trạng thái': getStatusText(sv.trang_thai),
                    'Thời gian điểm danh': formatTime(sv.thoi_gian),
                    'Phương thức': sv.phuong_thuc || '',
                    'Độ tin cậy': sv.do_tin_cay ?? '',
                    'Ghi chú': sv.ghi_chu || '',
                }));

                const sheetRows = [...summaryRows, ...studentRows];
                const sheet = XLSX.utils.json_to_sheet(sheetRows);

                sheet['!cols'] = [
                    { wch: 6 },
                    { wch: 18 },
                    { wch: 10 },
                    { wch: 18 },
                    { wch: 28 },
                    { wch: 14 },
                    { wch: 14 },
                    { wch: 14 },
                    { wch: 15 },
                    { wch: 28 },
                    { wch: 15 },
                    { wch: 18 },
                    { wch: 20 },
                    { wch: 18 },
                    { wch: 12 },
                    { wch: 35 },
                ];

                const sheetName = getUniqueSheetName(workbook, tenBuoi);
                XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
            });

            XLSX.writeFile(
                workbook,
                `Diem_danh_toan_bo_${safeFileName(lopHocPhan?.ma_lop_hp || ma_lop_hp)}_${safeFileName(lopHocPhan?.ten_mon || 'mon-hoc')}.xlsx`
            );

            toast.success('Xuất file Excel toàn bộ buổi học thành công');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Xuất file Excel thất bại');
        } finally {
            setExportingExcel(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-medium">Đang tải chi tiết lớp...</p>
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Không có dữ liệu lớp học phần.
            </div>
        );
    }

    const lhp = detail.lop_hoc_phan;

    return (
        <div className="min-h-screen bg-gray-50">
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between px-6 py-5 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Tạo buổi học mới
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {lhp?.ma_lop_hp} - {lhp?.ten_mon}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!creating) setShowCreateModal(false);
                                }}
                                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="px-6 py-5 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">
                                    Ngày học
                                </label>

                                <Input
                                    type="date"
                                    value={sessionForm.ngay_hoc}
                                    onChange={(e) =>
                                        setSessionForm({
                                            ...sessionForm,
                                            ngay_hoc: e.target.value,
                                        })
                                    }
                                    className="h-11 text-sm font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">
                                        Giờ bắt đầu
                                    </label>

                                    <Input
                                        type="time"
                                        value={sessionForm.gio_bat_dau.slice(0, 5)}
                                        onChange={(e) =>
                                            setSessionForm({
                                                ...sessionForm,
                                                gio_bat_dau: `${e.target.value}:00`,
                                            })
                                        }
                                        className="h-11 text-sm font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-2">
                                        Giờ kết thúc
                                    </label>

                                    <Input
                                        type="time"
                                        value={sessionForm.gio_ket_thuc.slice(0, 5)}
                                        onChange={(e) =>
                                            setSessionForm({
                                                ...sessionForm,
                                                gio_ket_thuc: `${e.target.value}:00`,
                                            })
                                        }
                                        className="h-11 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={creating}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Hủy
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {creating ? 'Đang tạo...' : 'Tạo buổi học'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigate('/giang-vien/lop-hoc-phan')}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Quay lại danh sách lớp
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {lhp?.ma_lop_hp}
                                    </h1>

                                    <span className="text-gray-300 text-2xl">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        {lhp?.ten_mon}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4" />
                                        {lhp?.so_tin_chi || 0} tín chỉ
                                    </span>

                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(lhp?.ngay_bat_dau)} — {formatDate(lhp?.ngay_ket_thuc)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                    <Button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        className="lg:col-span-3 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo buổi học
                                    </Button>

                                    <div className="lg:col-span-5">


                                        <select
                                            value={selectedSessionId}
                                            onChange={(e) => setSelectedSessionId(e.target.value)}
                                            disabled={!sortedSessions.length}
                                            className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                -- Chọn buổi học --
                                            </option>

                                            {sortedSessions.length ? (
                                                sortedSessions.map((session, index) => (
                                                    <option
                                                        key={session.id_buoi}
                                                        value={String(session.id_buoi)}
                                                    >
                                                        {getSessionName(session, index)} - {formatDate(session.ngay_hoc)} - {session.gio_bat_dau} đến {session.gio_ket_thuc}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">Chưa có buổi học</option>
                                            )}
                                        </select>
                                    </div>

                                    <Button
                                        type="button"
                                        disabled={!selectedSession}
                                        onClick={() =>
                                            navigate(`/giang-vien/buoi-hoc/${selectedSession?.id_buoi}/diem-danh`)
                                        }
                                        className="lg:col-span-2 h-11 bg-gray-900 hover:bg-gray-800 font-semibold mt-auto"
                                    >
                                        Xem
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={exportAllSessionsExcel}
                                        disabled={exportingExcel || sessions.length === 0}
                                        className="lg:col-span-1 h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold mt-auto px-3"
                                        title="Xuất Excel"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        onClick={() => navigate('/giang-vien/diem-danh')}
                                        className="lg:col-span-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold mt-auto px-3"
                                        title="Mở camera điểm danh"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </Button>
                                </div>

                                {selectedSession && (
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                        <span className="font-semibold text-gray-900">
                                            {getSessionName(selectedSession, selectedSessionIndex)}
                                        </span>

                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(selectedSession.ngay_hoc)}
                                        </span>

                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {selectedSession.gio_bat_dau} - {selectedSession.gio_ket_thuc}
                                        </span>

                                        <SessionStatusBadge status={selectedSession.trang_thai} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard
                        icon={Users}
                        label="Tổng sinh viên"
                        value={detail.tong_sinh_vien || 0}
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
                        label="Tổng buổi học"
                        value={detail.tong_buoi_hoc || 0}
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
                        icon={BarChart3}
                        label="Tín chỉ"
                        value={lhp?.so_tin_chi || 0}
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
                        icon={Calendar}
                        label="Số ngày còn lại"
                        value={
                            lhp?.ngay_ket_thuc
                                ? Math.max(
                                    0,
                                    Math.ceil((new Date(lhp.ngay_ket_thuc) - new Date()) / 86400000)
                                )
                                : '-'
                        }
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

                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
                                <Users className="w-5 h-5 text-blue-600" />
                                Danh sách sinh viên & chuyên cần
                            </CardTitle>

                            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                {detail.danh_sach_sinh_vien?.length || 0} SV
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

                                        <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-center">
                                            <span className="text-emerald-600">✓ Có mặt</span>
                                        </TableHead>

                                        <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-center">
                                            <span className="text-amber-500">⏰ Muộn</span>
                                        </TableHead>

                                        <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-center">
                                            <span className="text-red-500">✗ Vắng</span>
                                        </TableHead>

                                        <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-center pr-5">
                                            <span className="text-orange-500">📋 Phép</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {detail.danh_sach_sinh_vien?.length ? (
                                        detail.danh_sach_sinh_vien.map((sv, idx) => {
                                            const tongBuoi = sessions.length;
                                            const coMat = sv.so_buoi_co_mat || 0;
                                            const muon = sv.so_buoi_di_muon || 0;

                                            const tiLe =
                                                tongBuoi > 0
                                                    ? Math.round(((coMat + muon) / tongBuoi) * 100)
                                                    : null;

                                            return (
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
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {sv.ho_ten}
                                                            </p>

                                                            {tiLe !== null && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                                                                        <div
                                                                            className={`h-full rounded-full ${tiLe >= 80
                                                                                ? 'bg-emerald-500'
                                                                                : tiLe >= 60
                                                                                    ? 'bg-amber-400'
                                                                                    : 'bg-red-500'
                                                                                }`}
                                                                            style={{ width: `${tiLe}%` }}
                                                                        />
                                                                    </div>

                                                                    <span
                                                                        className={`text-xs font-semibold ${tiLe >= 80
                                                                            ? 'text-emerald-600'
                                                                            : tiLe >= 60
                                                                                ? 'text-amber-600'
                                                                                : 'text-red-600'
                                                                            }`}
                                                                    >
                                                                        {tiLe}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3">
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {sv.ma_lop || sv.ten_lop || '-'}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="py-3 text-center">
                                                        <span className="text-base font-bold text-emerald-600">
                                                            {sv.so_buoi_co_mat || 0}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="py-3 text-center">
                                                        <span className="text-base font-bold text-amber-500">
                                                            {sv.so_buoi_di_muon || 0}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="py-3 text-center">
                                                        <span className="text-base font-bold text-red-500">
                                                            {sv.so_buoi_vang || 0}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="py-3 text-center pr-5">
                                                        <span className="text-base font-bold text-orange-500">
                                                            {sv.so_buoi_vang_co_phep || 0}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
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
        </div>
    );
};

export default ClassDetailPage;