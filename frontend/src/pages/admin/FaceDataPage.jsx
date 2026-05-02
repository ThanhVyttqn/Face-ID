import { useEffect, useMemo, useState } from "react";
import {
    getFaceDataDashboardApi,
    collectFaceDataApi,
    deleteFaceDataApi,
    trainFaceDataApi,
    syncFaceDataFromDatasetApi,
} from "../../api/Admin_api";
import {
    ScanFace,
    Search,
    RefreshCcw,
    Database,
    Camera,
    Image,
    Trash2,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    UserRound,
    Users,
    GraduationCap,
    Building,
    Settings,
    UploadCloud,
    Filter,
    X,
    Save,
} from "lucide-react";
import { toast } from "sonner";

const defaultCameraUrl = "http://192.168.1.6:4747/video";

const getStatusLabel = (status) => {
    switch (status) {
        case "san_sang":
            return "Sẵn sàng";
        case "chua_co":
            return "Chưa có dữ liệu";
        case "da_xoa":
            return "Đã xóa mềm";
        case "mat_thu_muc":
            return "Mất thư mục dataset";
        case "thu_muc_rong":
            return "Thư mục rỗng";
        case "co_thu_muc_chua_db":
            return "Có thư mục, chưa có DB";
        case "da_thu_thap_chua_train":
            return "Đã thu thập, chưa train";
        case "loi_du_lieu":
            return "Lỗi dữ liệu";
        default:
            return status || "-";
    }
};

const StatusBadge = ({ status }) => {
    if (status === "san_sang") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sẵn sàng
            </span>
        );
    }

    if (status === "chua_co") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Chưa có dữ liệu
            </span>
        );
    }

    if (status === "da_thu_thap_chua_train") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                <Image className="h-3.5 w-3.5" />
                Chưa train
            </span>
        );
    }

    if (status === "da_xoa" || status === "loi_du_lieu" || status === "mat_thu_muc") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {getStatusLabel(status)}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            {getStatusLabel(status)}
        </span>
    );
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

export default function FaceDataPage() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [onlyMissing, setOnlyMissing] = useState(false);

    const [loading, setLoading] = useState(false);
    const [training, setTraining] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [collectingId, setCollectingId] = useState("");
    const [deletingId, setDeletingId] = useState("");

    const [collectModal, setCollectModal] = useState({
        open: false,
        row: null,
        replaceOld: false,
    });

    const [collectForm, setCollectForm] = useState({
        camera_url: defaultCameraUrl,
        max_images: 80,
    });

    const loadData = async () => {
        try {
            setLoading(true);

            const res = await getFaceDataDashboardApi({
                search,
                only_missing: onlyMissing,
            });

            setItems(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Không tải được dữ liệu khuôn mặt");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, onlyMissing]);

    const stats = useMemo(() => {
        const total = items.length;
        const ready = items.filter((item) => item.co_du_lieu_khuon_mat).length;
        const missing = items.filter((item) => item.de_xuat_them_khuon_mat).length;
        const trained = items.filter((item) => item.da_train_embedding).length;
        const totalImages = items.reduce(
            (sum, item) => sum + Number(item.so_anh_khuon_mat || 0),
            0
        );

        return {
            total,
            ready,
            missing,
            trained,
            totalImages,
        };
    }, [items]);

    const openCollectModal = (row) => {
        setCollectModal({
            open: true,
            row,
            replaceOld: Boolean(row.co_du_lieu_khuon_mat),
        });

        setCollectForm({
            camera_url: defaultCameraUrl,
            max_images: 80,
        });
    };

    const closeCollectModal = () => {
        if (collectingId) return;

        setCollectModal({
            open: false,
            row: null,
            replaceOld: false,
        });

        setCollectForm({
            camera_url: defaultCameraUrl,
            max_images: 80,
        });
    };

    const handleSubmitCollect = async (e) => {
        e.preventDefault();

        const row = collectModal.row;

        if (!row?.ma_sv) {
            toast.error("Không tìm thấy sinh viên cần thu thập dữ liệu");
            return;
        }

        if (!collectForm.camera_url.trim()) {
            toast.error("Vui lòng nhập Camera URL");
            return;
        }

        if (!collectForm.max_images || Number(collectForm.max_images) <= 0) {
            toast.error("Số ảnh cần chụp phải lớn hơn 0");
            return;
        }

        try {
            setCollectingId(row.ma_sv);

            await collectFaceDataApi(row.ma_sv, {
                camera_url: collectForm.camera_url.trim(),
                max_images: Number(collectForm.max_images),
                replace_old: collectModal.replaceOld,
            });

            toast.success(
                collectModal.replaceOld
                    ? "Chụp lại dữ liệu khuôn mặt thành công"
                    : "Thu thập dữ liệu khuôn mặt thành công"
            );

            closeCollectModal();
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Thu thập dữ liệu thất bại");
        } finally {
            setCollectingId("");
        }
    };

    const handleDelete = async (row) => {
        const ok = window.confirm(
            `Xóa mềm dữ liệu khuôn mặt của ${row.ho_ten}?\nThư mục dataset sẽ bị xóa và DB chuyển sang trạng thái đã xóa.`
        );

        if (!ok) return;

        try {
            setDeletingId(row.ma_sv);

            await deleteFaceDataApi(row.ma_sv);

            toast.success("Đã xóa mềm dữ liệu khuôn mặt");
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Xóa dữ liệu thất bại");
        } finally {
            setDeletingId("");
        }
    };

    const handleTrain = async () => {
        const ok = window.confirm("Train lại toàn bộ dữ liệu khuôn mặt?");
        if (!ok) return;

        try {
            setTraining(true);

            const res = await trainFaceDataApi();

            toast.success(res.data?.data?.message || "Train dữ liệu khuôn mặt thành công");
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Train dữ liệu thất bại");
        } finally {
            setTraining(false);
        }
    };

    const handleSyncDataset = async () => {
        const ok = window.confirm("Đồng bộ các thư mục dataset hiện có vào database?");
        if (!ok) return;

        try {
            setSyncing(true);

            const res = await syncFaceDataFromDatasetApi();

            toast.success(res.data?.data?.message || "Đồng bộ dataset thành công");
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Đồng bộ dataset thất bại");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modal thu thập */}
            {collectModal.open && collectModal.row && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <Camera className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        {collectModal.replaceOld
                                            ? "Chụp lại dữ liệu khuôn mặt"
                                            : "Thu thập dữ liệu khuôn mặt"}
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        {collectModal.row.ma_sv} - {collectModal.row.ho_ten}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeCollectModal}
                                disabled={Boolean(collectingId)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitCollect} className="px-6 py-5">
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500">
                                                Lớp
                                            </p>
                                            <p className="mt-1 font-bold text-gray-900">
                                                {collectModal.row.ten_lop || collectModal.row.ma_lop || "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-gray-500">
                                                Trạng thái hiện tại
                                            </p>
                                            <div className="mt-1">
                                                <StatusBadge status={collectModal.row.trang_thai_du_lieu} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <Camera className="h-4 w-4 text-blue-600" />
                                        Camera URL
                                    </label>

                                    <input
                                        value={collectForm.camera_url}
                                        onChange={(e) =>
                                            setCollectForm({
                                                ...collectForm,
                                                camera_url: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: http://192.168.1.6:4747/video"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                                        <Image className="h-4 w-4 text-blue-600" />
                                        Số ảnh cần chụp
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={collectForm.max_images}
                                        onChange={(e) =>
                                            setCollectForm({
                                                ...collectForm,
                                                max_images: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: 80"
                                    />
                                </div>

                                <label className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                    <input
                                        type="checkbox"
                                        checked={collectModal.replaceOld}
                                        onChange={(e) =>
                                            setCollectModal({
                                                ...collectModal,
                                                replaceOld: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4"
                                    />

                                    <div>
                                        <p className="text-sm font-bold text-blue-700">
                                            Chụp lại và thay dữ liệu cũ
                                        </p>
                                        <p className="mt-0.5 text-xs font-medium text-blue-600">
                                            Nếu bật, hệ thống sẽ xóa dữ liệu ảnh cũ của sinh viên này rồi chụp lại từ đầu.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    onClick={closeCollectModal}
                                    disabled={Boolean(collectingId)}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={Boolean(collectingId)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {collectingId ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {collectModal.replaceOld ? "Chụp lại" : "Bắt đầu thu thập"}
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
                                <ScanFace className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-950">
                                        Dữ liệu khuôn mặt
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Admin
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Quản lý dataset, train dữ liệu và trạng thái nhận diện sinh viên
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                    <div className="lg:col-span-6">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Tìm kiếm sinh viên
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <input
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                placeholder="Tìm mã SV, họ tên, lớp, khoa..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <button
                                            type="button"
                                            onClick={handleSyncDataset}
                                            disabled={syncing}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {syncing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Database className="h-4 w-4" />
                                            )}
                                            Đồng bộ
                                        </button>
                                    </div>

                                    <div className="lg:col-span-3">
                                        <button
                                            type="button"
                                            onClick={handleTrain}
                                            disabled={training}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {training ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UploadCloud className="h-4 w-4" />
                                            )}
                                            Train dữ liệu
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
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
                        label="Sẵn sàng"
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
                        icon={AlertTriangle}
                        label="Thiếu dữ liệu"
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

                    <StatCard
                        icon={Database}
                        label="Đã train"
                        value={stats.trained}
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
                        icon={Image}
                        label="Tổng ảnh"
                        value={stats.totalImages}
                        color={{
                            bg: "bg-cyan-50",
                            border: "border-cyan-100",
                            iconBg: "bg-cyan-100",
                            icon: "text-cyan-600",
                            value: "text-cyan-700",
                            label: "text-cyan-600",
                        }}
                    />
                </div>



                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-950">
                                Danh sách dữ liệu khuôn mặt
                            </h3>

                            <p className="mt-1 text-sm font-medium text-gray-600">
                                Có {items.length} sinh viên phù hợp với bộ lọc hiện tại
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
                                        Lớp
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Khoa
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Trạng thái
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Số ảnh
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                        Face ID
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
                                                    Đang tải dữ liệu khuôn mặt...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.length > 0 ? (
                                    items.map((row, index) => (
                                        <tr
                                            key={row.ma_sv}
                                            className={`border-b border-gray-100 transition hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                    {row.ma_sv}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                                                        <UserRound className="h-4 w-4 text-blue-600" />
                                                    </div>

                                                    <p className="font-bold text-gray-950">
                                                        {row.ho_ten || "-"}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <GraduationCap className="h-4 w-4 text-gray-400" />
                                                    {row.ten_lop || row.ma_lop || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                    <Building className="h-4 w-4 text-gray-400" />
                                                    {row.ten_khoa || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={row.trang_thai_du_lieu} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-700">
                                                    <Image className="h-3.5 w-3.5" />
                                                    {row.so_anh_khuon_mat || 0} ảnh
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                    {row.face_id || "-"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={Boolean(collectingId) || deletingId === row.ma_sv}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                                        onClick={() => openCollectModal(row)}
                                                    >
                                                        {collectingId === row.ma_sv ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Camera className="h-3.5 w-3.5" />
                                                        )}
                                                        {row.co_du_lieu_khuon_mat ? "Chụp lại" : "Thu thập"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={Boolean(collectingId) || deletingId === row.ma_sv}
                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                                        onClick={() => handleDelete(row)}
                                                    >
                                                        {deletingId === row.ma_sv ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        )}
                                                        Xóa mềm
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center">
                                            <ScanFace className="mx-auto mb-3 h-14 w-14 text-gray-200" />

                                            <p className="text-lg font-bold text-gray-800">
                                                Không có dữ liệu khuôn mặt
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex gap-3">
                        <Settings className="h-5 w-5 text-blue-600 mt-0.5" />

                        <div>
                            <p className="font-bold text-blue-700">
                                Gợi ý sử dụng
                            </p>

                            <p className="mt-1 text-sm font-medium text-blue-600">
                                Sau khi thu thập hoặc chụp lại dữ liệu khuôn mặt, hãy bấm “Train dữ liệu” để cập nhật embedding nhận diện. Nếu đã có thư mục dataset sẵn, dùng “Đồng bộ” trước rồi train lại.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}