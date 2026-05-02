import { useEffect, useMemo, useState } from "react";
import {
    getTaiKhoansApi,
    createAdminAccountApi,
    createStudentAccountApi,
    createLecturerAccountApi,
    updateTaiKhoanStatusApi,
    deleteTaiKhoanApi,
} from "../../api/Admin_api";

import {
    Users,
    Search,
    Plus,
    ShieldCheck,
    GraduationCap,
    UserRound,
    Lock,
    Unlock,
    Trash2,
    X,
    KeyRound,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    UserCog,
    Filter,
    UserPlus,
    ChevronRight,
} from "lucide-react";

import { toast } from "sonner";

const roleConfig = {
    admin: {
        label: "Admin",
        className: "bg-violet-100 text-violet-700 border-violet-200",
        icon: ShieldCheck,
    },
    sinh_vien: {
        label: "Sinh viên",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: GraduationCap,
    },
    giang_vien: {
        label: "Giảng viên",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: UserRound,
    },
};

const createTypeConfig = {
    admin: {
        title: "Tạo tài khoản Admin",
        label: "Mã đăng nhập admin",
        placeholder: "Ví dụ: admin01",
        buttonLabel: "Admin",
        color: "bg-violet-600 hover:bg-violet-700",
        softColor: "bg-violet-50 border-violet-100 hover:bg-violet-100",
        textColor: "text-violet-700",
        icon: ShieldCheck,
    },
    sinh_vien: {
        title: "Tạo tài khoản sinh viên",
        label: "Mã sinh viên",
        placeholder: "Ví dụ: SV001",
        buttonLabel: "Sinh viên",
        color: "bg-blue-600 hover:bg-blue-700",
        softColor: "bg-blue-50 border-blue-100 hover:bg-blue-100",
        textColor: "text-blue-700",
        icon: GraduationCap,
    },
    giang_vien: {
        title: "Tạo tài khoản giảng viên",
        label: "Mã giảng viên",
        placeholder: "Ví dụ: GV001",
        buttonLabel: "Giảng viên",
        color: "bg-emerald-600 hover:bg-emerald-700",
        softColor: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100",
        textColor: "text-emerald-700",
        icon: UserRound,
    },
};

const RoleBadge = ({ role }) => {
    const config = roleConfig[role] || {
        label: role || "-",
        className: "bg-gray-100 text-gray-700 border-gray-200",
        icon: UserCog,
    };

    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    if (status === "hoat_dong") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Hoạt động
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
            <Lock className="h-3.5 w-3.5" />
            Đã khóa
        </span>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    return (
        <div className={`rounded-2xl border p-5 shadow-sm ${color.bg} ${color.border}`}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className={`text-sm font-semibold ${color.label}`}>{label}</p>
                    <p className={`mt-2 text-3xl font-bold ${color.value}`}>{value}</p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color.iconBg}`}>
                    <Icon className={`h-6 w-6 ${color.icon}`} />
                </div>
            </div>
        </div>
    );
};

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [vaiTro, setVaiTro] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [typeModalOpen, setTypeModalOpen] = useState(false);

    const [createModal, setCreateModal] = useState({
        open: false,
        type: "admin",
    });

    const [createForm, setCreateForm] = useState({
        ma_dang_nhap: "",
        mat_khau: "",
    });

    const resetCreateForm = () => {
        setCreateForm({
            ma_dang_nhap: "",
            mat_khau: "",
        });
    };

    const loadData = async () => {
        try {
            setLoading(true);

            const res = await getTaiKhoansApi({
                search,
                vai_tro: vaiTro,
            });

            setAccounts(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Không tải được danh sách tài khoản");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, vaiTro]);

    const stats = useMemo(() => {
        const total = accounts.length;
        const admin = accounts.filter((item) => item.vai_tro === "admin").length;
        const sinhVien = accounts.filter((item) => item.vai_tro === "sinh_vien").length;
        const giangVien = accounts.filter((item) => item.vai_tro === "giang_vien").length;
        const locked = accounts.filter((item) => item.trang_thai === "khoa").length;
        const active = accounts.filter((item) => item.trang_thai === "hoat_dong").length;

        return {
            total,
            admin,
            sinhVien,
            giangVien,
            active,
            locked,
        };
    }, [accounts]);

    const openTypeModal = () => {
        setTypeModalOpen(true);
    };

    const closeTypeModal = () => {
        if (actionLoading) return;
        setTypeModalOpen(false);
    };

    const openCreateModal = (type) => {
        resetCreateForm();

        setCreateModal({
            open: true,
            type,
        });
    };

    const chooseCreateType = (type) => {
        setTypeModalOpen(false);
        openCreateModal(type);
    };

    const closeCreateModal = (force = false) => {
        if (actionLoading && !force) return;

        setCreateModal({
            open: false,
            type: "admin",
        });

        resetCreateForm();
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();

        const type = createModal.type;
        const maDangNhap = createForm.ma_dang_nhap.trim();
        const matKhau = createForm.mat_khau.trim();

        if (!maDangNhap) {
            toast.error("Vui lòng nhập mã đăng nhập");
            return;
        }

        if (!matKhau) {
            toast.error("Vui lòng nhập mật khẩu");
            return;
        }

        if (matKhau.length < 6) {
            toast.error("Mật khẩu nên có ít nhất 6 ký tự");
            return;
        }

        try {
            setActionLoading(true);

            if (type === "admin") {
                await createAdminAccountApi({
                    ma_dang_nhap: maDangNhap,
                    mat_khau: matKhau,
                });
            }

            if (type === "sinh_vien") {
                await createStudentAccountApi(maDangNhap, {
                    mat_khau: matKhau,
                });
            }

            if (type === "giang_vien") {
                await createLecturerAccountApi(maDangNhap, {
                    mat_khau: matKhau,
                });
            }

            toast.success("Tạo tài khoản thành công");

            resetCreateForm();
            closeCreateModal(true);
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Tạo tài khoản thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (row) => {
        const nextStatus = row.trang_thai === "hoat_dong" ? "khoa" : "hoat_dong";

        try {
            setActionLoading(true);

            await updateTaiKhoanStatusApi(row.id, {
                trang_thai: nextStatus,
            });

            toast.success(
                nextStatus === "hoat_dong"
                    ? "Đã mở khóa tài khoản"
                    : "Đã khóa tài khoản"
            );

            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Cập nhật trạng thái thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (row) => {
        const ok = window.confirm(
            `Bạn có chắc muốn xóa tài khoản "${row.ma_dang_nhap}" không?`
        );

        if (!ok) return;

        try {
            setActionLoading(true);

            await deleteTaiKhoanApi(row.id);

            toast.success("Xóa tài khoản thành công");
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Xóa tài khoản thất bại");
        } finally {
            setActionLoading(false);
        }
    };

    const currentCreateConfig =
        createTypeConfig[createModal.type] || createTypeConfig.admin;

    const CurrentCreateIcon = currentCreateConfig.icon;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modal chọn loại tài khoản */}
            {typeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        Chọn loại tài khoản
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        Vui lòng chọn loại tài khoản bạn muốn tạo
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeTypeModal}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                            {Object.entries(createTypeConfig).map(([type, config]) => {
                                const Icon = config.icon;

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => chooseCreateType(type)}
                                        className={`group rounded-2xl border p-5 text-left transition-all ${config.softColor}`}
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                            <Icon className={`h-6 w-6 ${config.textColor}`} />
                                        </div>

                                        <h3 className={`text-lg font-bold ${config.textColor}`}>
                                            {config.buttonLabel}
                                        </h3>

                                        <p className="mt-2 text-sm font-medium text-gray-600">
                                            {type === "admin" && "Tạo tài khoản quản trị hệ thống"}
                                            {type === "sinh_vien" && "Tạo tài khoản đăng nhập cho sinh viên"}
                                            {type === "giang_vien" && "Tạo tài khoản đăng nhập cho giảng viên"}
                                        </p>

                                        <div className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${config.textColor}`}>
                                            Chọn
                                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo tài khoản */}
            {createModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <CurrentCreateIcon className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        {currentCreateConfig.title}
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        Nhập thông tin để tạo tài khoản mới
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => closeCreateModal()}
                                disabled={actionLoading}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateAccount}
                            className="space-y-5 px-6 py-5"
                            autoComplete="off"
                        >
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-800">
                                    {currentCreateConfig.label}
                                </label>

                                <input
                                    value={createForm.ma_dang_nhap}
                                    autoComplete="off"
                                    name={`ma_dang_nhap_${createModal.type}`}
                                    onChange={(e) =>
                                        setCreateForm({
                                            ...createForm,
                                            ma_dang_nhap: e.target.value,
                                        })
                                    }
                                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder={currentCreateConfig.placeholder}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-800">
                                    Mật khẩu
                                </label>

                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                    <input
                                        type="password"
                                        value={createForm.mat_khau}
                                        autoComplete="new-password"
                                        name={`mat_khau_moi_${createModal.type}`}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                mat_khau: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Nhập mật khẩu"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    onClick={() => closeCreateModal()}
                                    disabled={actionLoading}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4" />
                                            Tạo tài khoản
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
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-center">
                        <div className="xl:col-span-5 flex items-center gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
                                <Users className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-950">
                                        Quản lý tài khoản
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Admin
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Tạo, khóa, mở khóa và quản lý tài khoản đăng nhập hệ thống
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 gap-3 items-end lg:grid-cols-12">
                                    <div className="lg:col-span-6">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Tìm kiếm tài khoản
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <input
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                placeholder="Tìm theo mã đăng nhập..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-700">
                                            <Filter className="h-3.5 w-3.5 text-blue-600" />
                                            Vai trò
                                        </label>

                                        <select
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            value={vaiTro}
                                            onChange={(e) => setVaiTro(e.target.value)}
                                        >
                                            <option value="">Tất cả vai trò</option>
                                            <option value="admin">Admin</option>
                                            <option value="sinh_vien">Sinh viên</option>
                                            <option value="giang_vien">Giảng viên</option>
                                        </select>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <button
                                            type="button"
                                            onClick={openTypeModal}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tạo tài khoản
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        icon={Users}
                        label="Tổng tài khoản"
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
                        label="Hoạt động"
                        value={stats.active}
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
                        icon={Lock}
                        label="Đã khóa"
                        value={stats.locked}
                        color={{
                            bg: "bg-red-50",
                            border: "border-red-100",
                            iconBg: "bg-red-100",
                            icon: "text-red-600",
                            value: "text-red-700",
                            label: "text-red-600",
                        }}
                    />

                    <StatCard
                        icon={ShieldCheck}
                        label="Admin"
                        value={stats.admin}
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
                        icon={GraduationCap}
                        label="Sinh viên"
                        value={stats.sinhVien}
                        color={{
                            bg: "bg-cyan-50",
                            border: "border-cyan-100",
                            iconBg: "bg-cyan-100",
                            icon: "text-cyan-600",
                            value: "text-cyan-700",
                            label: "text-cyan-600",
                        }}
                    />

                    <StatCard
                        icon={UserRound}
                        label="Giảng viên"
                        value={stats.giangVien}
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
                    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-950">
                                Danh sách tài khoản
                            </h3>

                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Có {accounts.length} tài khoản phù hợp với bộ lọc hiện tại
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200">
                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        ID
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Mã đăng nhập
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Vai trò
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Mã liên kết
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Trạng thái
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
                                                    Đang tải danh sách tài khoản...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : accounts.length > 0 ? (
                                    accounts.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-gray-100 transition hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                    #{row.id}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-bold text-gray-950">
                                                    {row.ma_dang_nhap || "-"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <RoleBadge role={row.vai_tro} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        {row.ma_sv || row.ma_gv || "-"}
                                                    </span>

                                                    {row.ma_sv && (
                                                        <span className="text-xs font-medium text-gray-500">
                                                            Mã sinh viên
                                                        </span>
                                                    )}

                                                    {row.ma_gv && (
                                                        <span className="text-xs font-medium text-gray-500">
                                                            Mã giảng viên
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={row.trang_thai} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => handleToggleStatus(row)}
                                                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-50 ${row.trang_thai === "hoat_dong"
                                                                ? "bg-amber-500 hover:bg-amber-600"
                                                                : "bg-emerald-600 hover:bg-emerald-700"
                                                            }`}
                                                    >
                                                        {row.trang_thai === "hoat_dong" ? (
                                                            <>
                                                                <Lock className="h-3.5 w-3.5" />
                                                                Khóa
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock className="h-3.5 w-3.5" />
                                                                Mở
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => handleDelete(row)}
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
                                                Không tìm thấy tài khoản
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                Hãy thử thay đổi từ khóa tìm kiếm hoặc vai trò.
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