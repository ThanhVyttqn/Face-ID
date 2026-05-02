import { useEffect, useMemo, useState } from "react";
import {
    getGiangViensApi,
    deleteGiangVienApi,
    createGiangVienApi,
    updateGiangVienApi,
    getKhoaApi,
} from "../../api/Admin_api";
import {
    Users,
    Search,
    Plus,
    RefreshCcw,
    Edit,
    Trash2,
    X,
    Save,
    Loader2,
    GraduationCap,
    Mail,
    Phone,
    Building,
    UserRound,
    AlertTriangle,
    School,
    BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const initialForm = {
    ma_gv: "",
    ho_ten: "",
    email: "",
    sdt: "",
    ma_khoa: "",
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${color.bg} ${color.border}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm font-semibold ${color.label}`}>
                        {label}
                    </p>

                    <p className={`mt-2 text-3xl font-bold ${color.value}`}>
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

export default function LecturersPage() {
    const [lecturers, setLecturers] = useState([]);
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [khoaOptions, setKhoaOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const loadLecturers = async () => {
        try {
            setLoading(true);

            const res = await getGiangViensApi({ search });
            setLecturers(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được danh sách giảng viên");
        } finally {
            setLoading(false);
        }
    };

    const loadKhoa = async () => {
        try {
            const res = await getKhoaApi();
            setKhoaOptions(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được danh sách khoa");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadLecturers();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadKhoa();
    }, []);

    const stats = useMemo(() => {
        const total = lecturers.length;

        const khoaCount = new Set(
            lecturers
                .map((item) => item.ma_khoa || item.ten_khoa)
                .filter(Boolean)
        ).size;

        const hasEmail = lecturers.filter((item) => item.email).length;
        const hasPhone = lecturers.filter((item) => item.sdt).length;

        return {
            total,
            khoaCount,
            hasEmail,
            hasPhone,
        };
    }, [lecturers]);

    const resetForm = () => {
        setForm(initialForm);
        setIsEditing(false);
        setEditingId(null);
        setShowModal(false);
    };

    const openCreateModal = () => {
        setForm(initialForm);
        setIsEditing(false);
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (gv) => {
        setForm({
            ma_gv: gv.ma_gv || "",
            ho_ten: gv.ho_ten || "",
            email: gv.email || "",
            sdt: gv.sdt || "",
            ma_khoa: gv.ma_khoa || "",
        });

        setEditingId(gv.ma_gv);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();

        if (
            !form.ma_gv.trim() ||
            !form.ho_ten.trim() ||
            !form.email.trim() ||
            !form.sdt.trim() ||
            !form.ma_khoa
        ) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                ma_gv: form.ma_gv.trim(),
                ho_ten: form.ho_ten.trim(),
                email: form.email.trim(),
                sdt: form.sdt.trim(),
                ma_khoa: form.ma_khoa,
            };

            if (isEditing && editingId) {
                await updateGiangVienApi(editingId, payload);
                toast.success("Cập nhật giảng viên thành công");
            } else {
                await createGiangVienApi(payload);
                toast.success("Thêm giảng viên thành công");
            }

            resetForm();
            await loadLecturers();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                (isEditing ? "Cập nhật giảng viên thất bại" : "Thêm giảng viên thất bại")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (ma_gv) => {
        const ok = window.confirm(`Bạn có chắc muốn xóa giảng viên "${ma_gv}" không?`);
        if (!ok) return;

        try {
            setDeleting(true);

            await deleteGiangVienApi(ma_gv);
            toast.success("Xóa giảng viên thành công");

            await loadLecturers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Xóa giảng viên thất bại");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        {isEditing ? "Cập nhật giảng viên" : "Thêm giảng viên mới"}
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        {isEditing
                                            ? "Chỉnh sửa thông tin giảng viên trong hệ thống"
                                            : "Nhập thông tin để thêm giảng viên vào hệ thống"}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={submitting}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdate} className="px-6 py-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Mã giảng viên
                                    </label>

                                    <input
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-700 disabled:opacity-100"
                                        placeholder="Ví dụ: GV001"
                                        name="ma_gv"
                                        value={form.ma_gv}
                                        onChange={handleChange}
                                        disabled={isEditing}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Họ và tên
                                    </label>

                                    <input
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Nhập họ tên giảng viên"
                                        name="ho_ten"
                                        value={form.ho_ten}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Email
                                    </label>

                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                        <input
                                            className="h-11 w-full rounded-xl border border-gray-200 px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            type="email"
                                            placeholder="Nhập email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Số điện thoại
                                    </label>

                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                        <input
                                            className="h-11 w-full rounded-xl border border-gray-200 px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            placeholder="Nhập số điện thoại"
                                            name="sdt"
                                            value={form.sdt}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Khoa / Bộ môn
                                    </label>

                                    <select
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        name="ma_khoa"
                                        value={form.ma_khoa}
                                        onChange={handleChange}
                                    >
                                        <option value="">Chọn khoa</option>

                                        {khoaOptions.map((khoa) => (
                                            <option key={khoa.ma_khoa} value={khoa.ma_khoa}>
                                                {khoa.ten_khoa || khoa.ma_khoa}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    onClick={resetForm}
                                    disabled={submitting}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {isEditing ? "Đang cập nhật..." : "Đang lưu..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {isEditing ? "Cập nhật giảng viên" : "Lưu giảng viên"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="border-b border-gray-100 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-950">
                                        Quản lý giảng viên
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Admin
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Thêm, cập nhật, tìm kiếm và quản lý hồ sơ giảng viên
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                    <div className="lg:col-span-7">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Tìm kiếm giảng viên
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <input
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                placeholder="Tìm theo mã GV, họ tên, email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <button
                                            type="button"
                                            onClick={loadLecturers}
                                            disabled={loading}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                            Tải lại
                                        </button>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <button
                                            type="button"
                                            onClick={openCreateModal}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Thêm giảng viên
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                    <StatCard
                        icon={Users}
                        label="Tổng giảng viên"
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
                        icon={School}
                        label="Số khoa"
                        value={stats.khoaCount}
                        color={{
                            bg: "bg-violet-50",
                            border: "border-violet-100",
                            iconBg: "bg-violet-100",
                            icon: "text-violet-600",
                            value: "text-violet-700",
                            label: "text-violet-600",
                        }}
                    />

                    <StatCard
                        icon={Mail}
                        label="Có email"
                        value={stats.hasEmail}
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
                        icon={Phone}
                        label="Có SĐT"
                        value={stats.hasPhone}
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

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-950">
                                Danh sách giảng viên
                            </h3>

                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Có {lecturers.length} giảng viên phù hợp với bộ lọc hiện tại
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Mã GV
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Họ tên
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Email
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        SĐT
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Khoa
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                                <div className="h-9 w-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                                                <p className="font-semibold text-gray-700">
                                                    Đang tải danh sách giảng viên...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : lecturers.length > 0 ? (
                                    lecturers.map((gv, index) => (
                                        <tr
                                            key={gv.ma_gv}
                                            className={`border-b border-gray-100 transition hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                    {gv.ma_gv}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                                                        <UserRound className="h-4 w-4 text-blue-600" />
                                                    </div>

                                                    <p className="font-bold text-gray-950">
                                                        {gv.ho_ten || "-"}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {gv.email || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    {gv.sdt || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    {gv.ten_khoa || gv.ma_khoa || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(gv)}
                                                        disabled={submitting || deleting}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        Sửa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(gv.ma_gv)}
                                                        disabled={submitting || deleting}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-200" />

                                            <p className="text-lg font-bold text-gray-800">
                                                Không có dữ liệu giảng viên
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                Hãy thử nhập từ khóa tìm kiếm khác hoặc thêm giảng viên mới.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}