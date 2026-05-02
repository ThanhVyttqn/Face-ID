import { useEffect, useMemo, useState } from "react";
import {
    getSinhViensApi,
    deleteSinhVienApi,
    createSinhVienApi,
    updateSinhVienApi,
    getLopSvApi,
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
    Calendar,
    UserRound,
    Venus,
    Mars,
    AlertTriangle,
    School,
} from "lucide-react";
import { toast } from "sonner";

const initialForm = {
    ma_sv: "",
    ho_ten: "",
    gioi_tinh: "Nam",
    ngay_sinh: "",
    email: "",
    sdt: "",
    ma_lop: "",
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const toDateInputValue = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
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

const GenderBadge = ({ gender }) => {
    if (gender === "Nam") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                <Mars className="h-3.5 w-3.5" />
                Nam
            </span>
        );
    }

    if (gender === "Nữ") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-700">
                <Venus className="h-3.5 w-3.5" />
                Nữ
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            -
        </span>
    );
};

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [lopOptions, setLopOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const loadStudents = async () => {
        try {
            setLoading(true);

            const res = await getSinhViensApi({ search });
            setStudents(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được danh sách sinh viên");
        } finally {
            setLoading(false);
        }
    };

    const loadLopOptions = async () => {
        try {
            const res = await getLopSvApi();
            setLopOptions(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được danh sách lớp");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadStudents();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadLopOptions();
    }, []);

    const stats = useMemo(() => {
        const total = students.length;
        const male = students.filter((item) => item.gioi_tinh === "Nam").length;
        const female = students.filter((item) => item.gioi_tinh === "Nữ").length;
        const classCount = new Set(
            students
                .map((item) => item.ma_lop || item.ten_lop)
                .filter(Boolean)
        ).size;

        return {
            total,
            male,
            female,
            classCount,
        };
    }, [students]);

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

    const openEditModal = (sv) => {
        setForm({
            ma_sv: sv.ma_sv || "",
            ho_ten: sv.ho_ten || "",
            gioi_tinh: sv.gioi_tinh || "Nam",
            ngay_sinh: toDateInputValue(sv.ngay_sinh),
            email: sv.email || "",
            sdt: sv.sdt || "",
            ma_lop: sv.ma_lop || "",
        });

        setEditingId(sv.ma_sv);
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
            !form.ma_sv.trim() ||
            !form.ho_ten.trim() ||
            !form.gioi_tinh ||
            !form.ngay_sinh ||
            !form.email.trim() ||
            !form.sdt.trim() ||
            !form.ma_lop
        ) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                ma_sv: form.ma_sv.trim(),
                ho_ten: form.ho_ten.trim(),
                gioi_tinh: form.gioi_tinh,
                ngay_sinh: form.ngay_sinh,
                email: form.email.trim(),
                sdt: form.sdt.trim(),
                ma_lop: form.ma_lop,
            };

            if (isEditing && editingId) {
                await updateSinhVienApi(editingId, payload);
                toast.success("Cập nhật sinh viên thành công");
            } else {
                await createSinhVienApi(payload);
                toast.success("Thêm sinh viên thành công");
            }

            resetForm();
            await loadStudents();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                (isEditing ? "Cập nhật sinh viên thất bại" : "Thêm sinh viên thất bại")
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (ma_sv) => {
        const ok = window.confirm(`Bạn có chắc muốn xóa sinh viên "${ma_sv}" không?`);
        if (!ok) return;

        try {
            setDeleting(true);

            await deleteSinhVienApi(ma_sv);
            toast.success("Xóa sinh viên thành công");

            await loadStudents();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Xóa sinh viên thất bại");
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
                                        {isEditing ? "Cập nhật sinh viên" : "Thêm sinh viên mới"}
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        {isEditing
                                            ? "Chỉnh sửa thông tin sinh viên trong hệ thống"
                                            : "Nhập thông tin để thêm sinh viên vào hệ thống"}
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
                                        Mã sinh viên
                                    </label>

                                    <input
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-700 disabled:opacity-100"
                                        placeholder="Ví dụ: SV001"
                                        name="ma_sv"
                                        value={form.ma_sv}
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
                                        placeholder="Nhập họ tên sinh viên"
                                        name="ho_ten"
                                        value={form.ho_ten}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Giới tính
                                    </label>

                                    <select
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        name="gioi_tinh"
                                        value={form.gioi_tinh}
                                        onChange={handleChange}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Ngày sinh
                                    </label>

                                    <input
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        type="date"
                                        name="ngay_sinh"
                                        value={form.ngay_sinh}
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
                                        Lớp sinh viên
                                    </label>

                                    <select
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        name="ma_lop"
                                        value={form.ma_lop}
                                        onChange={handleChange}
                                    >
                                        <option value="">Chọn lớp sinh viên</option>

                                        {lopOptions.map((lop) => (
                                            <option key={lop.ma_lop} value={lop.ma_lop}>
                                                {lop.ten_lop || lop.ma_lop}
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
                                            {isEditing ? "Cập nhật sinh viên" : "Lưu sinh viên"}
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
                                        Quản lý sinh viên
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Admin
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Thêm, cập nhật, tìm kiếm và quản lý hồ sơ sinh viên
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                    <div className="lg:col-span-7">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Tìm kiếm sinh viên
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <input
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                placeholder="Tìm theo mã SV, họ tên, email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <button
                                            type="button"
                                            onClick={loadStudents}
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
                                            Thêm sinh viên
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
                        icon={Mars}
                        label="Nam"
                        value={stats.male}
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
                        icon={Venus}
                        label="Nữ"
                        value={stats.female}
                        color={{
                            bg: "bg-pink-50",
                            border: "border-pink-100",
                            iconBg: "bg-pink-100",
                            icon: "text-pink-600",
                            value: "text-pink-700",
                            label: "text-pink-600",
                        }}
                    />

                    <StatCard
                        icon={School}
                        label="Số lớp"
                        value={stats.classCount}
                        color={{
                            bg: "bg-violet-50",
                            border: "border-violet-100",
                            iconBg: "bg-violet-100",
                            icon: "text-violet-600",
                            value: "text-violet-700",
                            label: "text-violet-600",
                        }}
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-950">
                                Danh sách sinh viên
                            </h3>

                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Có {students.length} sinh viên phù hợp với bộ lọc hiện tại
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Mã SV
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Họ tên
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Giới tính
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Ngày sinh
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Email
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        SĐT
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Lớp
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                                <div className="h-9 w-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                                                <p className="font-semibold text-gray-700">
                                                    Đang tải danh sách sinh viên...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((sv, index) => (
                                        <tr
                                            key={sv.ma_sv}
                                            className={`border-b border-gray-100 transition hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                    {sv.ma_sv}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                                                        <UserRound className="h-4 w-4 text-blue-600" />
                                                    </div>

                                                    <p className="font-bold text-gray-950">
                                                        {sv.ho_ten || "-"}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <GenderBadge gender={sv.gioi_tinh} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {formatDate(sv.ngay_sinh)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {sv.email || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    {sv.sdt || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                                                    {sv.ten_lop || sv.ma_lop || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(sv)}
                                                        disabled={submitting || deleting}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                        Sửa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(sv.ma_sv)}
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
                                        <td colSpan={8} className="px-5 py-16 text-center">
                                            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-gray-200" />

                                            <p className="text-lg font-bold text-gray-800">
                                                Không có dữ liệu sinh viên
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                Hãy thử nhập từ khóa tìm kiếm khác hoặc thêm sinh viên mới.
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