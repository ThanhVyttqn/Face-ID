import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Users,
    Clock,
    ChevronRight,
    Search,
    Layers,
    AlertTriangle,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { getMyClassesApi } from '../../api/GiangVien_api';
import { toast } from 'sonner';

const formatDate = (value) => {
    if (!value) return '';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    return d.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatTime = (value) => {
    if (!value) return '';

    return String(value).slice(0, 5);
};

const formatSessionDateTime = (session) => {
    if (!session) return '';

    const date = formatDate(session.ngay_hoc);
    const start = formatTime(session.gio_bat_dau);
    const end = formatTime(session.gio_ket_thuc);

    if (date && start && end) {
        return `${date} • ${start} - ${end}`;
    }

    if (date && start) {
        return `${date} • ${start}`;
    }

    return date || start || '';
};

const LopHocPhanPage = () => {
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadClasses = async () => {
        try {
            setLoading(true);

            const res = await getMyClassesApi();
            setClasses(res.data?.data || []);
        } catch (err) {
            console.error(err);
            toast.error(
                err.response?.data?.message ||
                'Không tải được danh sách lớp học phần'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
    }, []);

    const filteredClasses = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return classes;

        return classes.filter((item) => {
            return (
                item.ma_lop_hp?.toLowerCase().includes(keyword) ||
                item.ten_mon?.toLowerCase().includes(keyword)
            );
        });
    }, [classes, searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-base font-medium">
                        Đang tải danh sách lớp học phần...
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
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Lớp học phần
                                    </h1>

                                    <span className="text-gray-300 text-2xl">
                                        •
                                    </span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Giảng viên
                                    </h2>
                                </div>

                                <p className="text-sm text-gray-500 font-medium">
                                    Quản lý các lớp học phần được phân công phụ trách
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                    <div className="lg:col-span-4">
                                        <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-blue-600" />
                                            </div>

                                            <div>
                                                <p className="text-3xl font-bold text-blue-700">
                                                    {classes.length}
                                                </p>
                                                <p className="text-xs font-semibold text-blue-500">
                                                    Tổng lớp phụ trách
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
                                            Tìm kiếm lớp học phần
                                        </label>

                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                                            <Input
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(e.target.value)
                                                }
                                                placeholder="Nhập mã lớp hoặc tên môn học..."
                                                className="h-11 pl-10 text-sm font-medium bg-white rounded-xl"
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
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
                {classes.length === 0 ? (
                    <Card className="shadow-sm border border-gray-200">
                        <CardContent className="py-20 text-center">
                            <BookOpen className="mx-auto h-16 w-16 text-gray-200 mb-4" />

                            <h3 className="text-xl font-bold text-gray-800">
                                Chưa có lớp học phần
                            </h3>

                            <p className="text-gray-500 mt-2">
                                Bạn chưa được phân công lớp học phần nào.
                            </p>
                        </CardContent>
                    </Card>
                ) : filteredClasses.length === 0 ? (
                    <Card className="shadow-sm border border-gray-200">
                        <CardContent className="py-20 text-center">
                            <Search className="mx-auto h-16 w-16 text-gray-200 mb-4" />

                            <h3 className="text-xl font-bold text-gray-800">
                                Không tìm thấy lớp phù hợp
                            </h3>

                            <p className="text-gray-500 mt-2">
                                Hãy thử nhập mã lớp hoặc tên môn học khác.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClasses.map((cls) => {
                            const hasCredit =
                                cls.so_tin_chi !== null &&
                                cls.so_tin_chi !== undefined &&
                                cls.so_tin_chi !== '';

                            const hasNextSession = Boolean(
                                cls.buoi_hoc_tiep_theo
                            );

                            const hasSessions =
                                Number(cls.tong_buoi_hoc || 0) > 0;

                            return (
                                <Card
                                    key={cls.ma_lop_hp}
                                    className="group overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 cursor-pointer bg-white"
                                    onClick={() =>
                                        navigate(
                                            `/giang-vien/lop-hoc-phan/${cls.ma_lop_hp}`
                                        )
                                    }
                                >
                                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                                                    <BookOpen className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                                                </div>

                                                <div className="min-w-0">
                                                    <CardTitle className="text-2xl font-bold text-gray-900 truncate">
                                                        {cls.ma_lop_hp}
                                                    </CardTitle>

                                                    <p className="text-base font-semibold text-gray-700 mt-1 line-clamp-1">
                                                        {cls.ten_mon || 'Chưa có tên môn'}
                                                    </p>
                                                </div>
                                            </div>

                                            {hasCredit && (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200">
                                                    {cls.so_tin_chi} tín chỉ
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-5">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                                                <div className="flex items-center gap-2 text-blue-600 mb-2">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">
                                                        Sinh viên
                                                    </span>
                                                </div>

                                                <p className="text-2xl font-bold text-blue-700">
                                                    {cls.tong_sinh_vien || 0}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
                                                <div className="flex items-center gap-2 text-violet-600 mb-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">
                                                        Buổi học
                                                    </span>
                                                </div>

                                                <p className="text-2xl font-bold text-violet-700">
                                                    {cls.tong_buoi_hoc || 0}
                                                </p>
                                            </div>
                                        </div>

                                        {hasNextSession && (
                                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <Clock className="w-5 h-5 text-emerald-600" />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-bold text-emerald-700">
                                                            Buổi học tiếp theo
                                                        </p>

                                                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                                                            {formatSessionDateTime(
                                                                cls.buoi_hoc_tiep_theo
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {hasSessions ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                                    Đã có buổi học
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">
                                                    Chưa có buổi học
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>

                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 group-hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">
                                                Xem chi tiết lớp
                                            </span>

                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}


            </div>
        </div>
    );
};

export default LopHocPhanPage;