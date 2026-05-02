import { useEffect, useMemo, useState } from "react";
import {
    getLopHocPhansApi,
    getGiangVienLookupApi,
    getSinhVienLookupApi,
    getMonHocLookupApi,
    createLopHocPhanApi,
    assignGiangVienApi,
    getRegistrationsByClassSectionApi,
    registerStudentToClassSectionApi,
    cancelStudentRegistrationApi,
} from "../../api/Admin_api";

import {
    BookOpen,
    Search,
    RefreshCcw,
    Users,
    UserRound,
    GraduationCap,
    ClipboardList,
    UserPlus,
    Save,
    X,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Calendar,
    Plus,
    School,
} from "lucide-react";

import { toast } from "sonner";

const initialCreateForm = {
    ma_lop_hp: "",
    ma_mon: "",
    ma_gv: "",
    hoc_ky: "1",
    nam_hoc: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${active
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`rounded-2xl border p-5 shadow-sm ${color.bg} ${color.border}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className={`text-sm font-semibold ${color.label}`}>{label}</p>
                <p className={`mt-2 text-3xl font-bold ${color.value}`}>{value}</p>
            </div>

            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color.iconBg}`}>
                <Icon className={`h-6 w-6 ${color.icon}`} />
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    if (status === "da_dang_ky") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã đăng ký
            </span>
        );
    }

    if (status === "da_huy") {
        return (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                Đã hủy
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            {status || "-"}
        </span>
    );
};

export default function CourseSectionsPage() {
    const [activeTab, setActiveTab] = useState("sections");

    const [sections, setSections] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [createModal, setCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState(initialCreateForm);
    const [creating, setCreating] = useState(false);

    const [assignModal, setAssignModal] = useState(false);
    const [selectedAssignSection, setSelectedAssignSection] = useState(null);
    const [selectedLecturer, setSelectedLecturer] = useState("");
    const [assigning, setAssigning] = useState(false);

    const [selectedLopHp, setSelectedLopHp] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const [registrations, setRegistrations] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [registering, setRegistering] = useState(false);

    const selectedSection = useMemo(() => {
        return sections.find((item) => item.ma_lop_hp === selectedLopHp) || null;
    }, [sections, selectedLopHp]);

    const activeRegistrations = useMemo(() => {
        return registrations.filter((item) => item.trang_thai === "da_dang_ky");
    }, [registrations]);

    const availableStudents = useMemo(() => {
        const registeredSet = new Set(activeRegistrations.map((item) => item.ma_sv));
        return students.filter((sv) => !registeredSet.has(sv.ma_sv));
    }, [students, activeRegistrations]);

    const filteredSections = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return sections;

        return sections.filter((item) => {
            return (
                item.ma_lop_hp?.toLowerCase().includes(keyword) ||
                item.ten_mon?.toLowerCase().includes(keyword) ||
                item.ten_giang_vien?.toLowerCase().includes(keyword) ||
                String(item.hoc_ky || "").toLowerCase().includes(keyword) ||
                String(item.nam_hoc || "").toLowerCase().includes(keyword)
            );
        });
    }, [sections, search]);

    const stats = useMemo(() => {
        const total = sections.length;
        const assigned = sections.filter((item) => item.ma_gv || item.ten_giang_vien).length;
        const notAssigned = total - assigned;

        return {
            total,
            assigned,
            notAssigned,
            totalRegistered: activeRegistrations.length,
        };
    }, [sections, activeRegistrations]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [sectionsRes, lecturersRes, studentsRes, subjectsRes] = await Promise.all([
                getLopHocPhansApi({}),
                getGiangVienLookupApi(),
                getSinhVienLookupApi(),
                getMonHocLookupApi(),
            ]);

            setSections(sectionsRes.data?.data || []);
            setLecturers(lecturersRes.data?.data || []);
            setStudents(studentsRes.data?.data || []);
            setSubjects(subjectsRes.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được dữ liệu lớp học phần");
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrations = async (ma_lop_hp) => {
        if (!ma_lop_hp) {
            setRegistrations([]);
            return;
        }

        try {
            setLoadingRegistrations(true);

            const res = await getRegistrationsByClassSectionApi(ma_lop_hp);
            setRegistrations(res.data?.data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Không tải được danh sách sinh viên đăng ký");
        } finally {
            setLoadingRegistrations(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadRegistrations(selectedLopHp);
        setSelectedStudent("");
    }, [selectedLopHp]);

    const openCreateModal = () => {
        setCreateForm(initialCreateForm);
        setCreateModal(true);
    };

    const closeCreateModal = () => {
        if (creating) return;
        setCreateForm(initialCreateForm);
        setCreateModal(false);
    };

    const handleCreateSection = async (e) => {
        e.preventDefault();

        if (!createForm.ma_lop_hp.trim()) {
            toast.error("Vui lòng nhập mã lớp học phần");
            return;
        }

        if (!createForm.ma_mon) {
            toast.error("Vui lòng chọn môn học");
            return;
        }

        if (!createForm.hoc_ky.trim()) {
            toast.error("Vui lòng nhập học kỳ");
            return;
        }

        if (!createForm.nam_hoc.trim()) {
            toast.error("Vui lòng nhập năm học");
            return;
        }

        try {
            setCreating(true);

            const payload = {
                ma_lop_hp: createForm.ma_lop_hp.trim(),
                ma_mon: createForm.ma_mon,
                ma_gv: createForm.ma_gv || null,
                hoc_ky: createForm.hoc_ky.trim(),
                nam_hoc: createForm.nam_hoc.trim(),
                ngay_bat_dau: createForm.ngay_bat_dau || null,
                ngay_ket_thuc: createForm.ngay_ket_thuc || null,
                trang_thai: "dang_mo",
            };

            await createLopHocPhanApi(payload);

            toast.success("Tạo lớp học phần thành công");

            closeCreateModal();
            await loadData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Tạo lớp học phần thất bại");
        } finally {
            setCreating(false);
        }
    };

    const openAssignModal = (section) => {
        setSelectedAssignSection(section);
        setSelectedLecturer(section.ma_gv || "");
        setAssignModal(true);
    };

    const closeAssignModal = () => {
        if (assigning) return;

        setAssignModal(false);
        setSelectedAssignSection(null);
        setSelectedLecturer("");
    };

    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selectedAssignSection?.ma_lop_hp) {
            toast.error("Không tìm thấy lớp học phần");
            return;
        }

        if (!selectedLecturer) {
            toast.error("Vui lòng chọn giảng viên");
            return;
        }

        try {
            setAssigning(true);

            await assignGiangVienApi(selectedAssignSection.ma_lop_hp, {
                ma_gv: selectedLecturer,
            });

            toast.success("Phân công giảng viên thành công");

            closeAssignModal();
            await loadData();

            if (selectedLopHp) {
                await loadRegistrations(selectedLopHp);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Phân công giảng viên thất bại");
        } finally {
            setAssigning(false);
        }
    };

    const handleRegister = async () => {
        if (!selectedLopHp) {
            toast.error("Vui lòng chọn lớp học phần");
            return;
        }

        if (!selectedStudent) {
            toast.error("Vui lòng chọn sinh viên");
            return;
        }

        try {
            setRegistering(true);

            await registerStudentToClassSectionApi(selectedLopHp, {
                ma_sv: selectedStudent,
            });

            toast.success("Đăng ký sinh viên vào lớp học phần thành công");

            setSelectedStudent("");
            await loadRegistrations(selectedLopHp);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Đăng ký sinh viên thất bại");
        } finally {
            setRegistering(false);
        }
    };

    const handleCancelRegistration = async (row) => {
        const ok = window.confirm(
            `Bạn có chắc muốn hủy đăng ký sinh viên "${row.ho_ten}" khỏi lớp "${row.ma_lop_hp}" không?`
        );

        if (!ok) return;

        try {
            await cancelStudentRegistrationApi(row.ma_lop_hp, row.ma_sv);

            toast.success("Đã hủy đăng ký sinh viên");
            await loadRegistrations(selectedLopHp);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Hủy đăng ký thất bại");
        }
    };

    const goToRegistrationTab = (section) => {
        setSelectedLopHp(section.ma_lop_hp);
        setActiveTab("registrations");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modal tạo lớp học phần */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        Tạo lớp học phần mới
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        Chọn môn học, học kỳ, năm học và giảng viên phụ trách nếu có
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateModal}
                                disabled={creating}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSection} className="px-6 py-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Mã lớp học phần
                                    </label>

                                    <input
                                        value={createForm.ma_lop_hp}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                ma_lop_hp: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: LHP004"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Môn học
                                    </label>

                                    <select
                                        value={createForm.ma_mon}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                ma_mon: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">-- Chọn môn học --</option>

                                        {subjects.map((mon) => (
                                            <option key={mon.ma_mon} value={mon.ma_mon}>
                                                {mon.ma_mon} - {mon.ten_mon}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Giảng viên phụ trách
                                    </label>

                                    <select
                                        value={createForm.ma_gv}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                ma_gv: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">-- Chưa phân công --</option>

                                        {lecturers.map((gv) => (
                                            <option key={gv.ma_gv} value={gv.ma_gv}>
                                                {gv.ma_gv} - {gv.ho_ten}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Học kỳ
                                    </label>

                                    <select
                                        value={createForm.hoc_ky}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                hoc_ky: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="1">Học kỳ 1</option>
                                        <option value="2">Học kỳ 2</option>
                                        <option value="3">Học kỳ hè</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Năm học
                                    </label>

                                    <input
                                        value={createForm.nam_hoc}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                nam_hoc: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: 2025-2026 hoặc 2026"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Ngày bắt đầu
                                    </label>

                                    <input
                                        type="date"
                                        value={createForm.ngay_bat_dau}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                ngay_bat_dau: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-800">
                                        Ngày kết thúc
                                    </label>

                                    <input
                                        type="date"
                                        value={createForm.ngay_ket_thuc}
                                        onChange={(e) =>
                                            setCreateForm({
                                                ...createForm,
                                                ngay_ket_thuc: e.target.value,
                                            })
                                        }
                                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={creating}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Tạo lớp học phần
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal phân công */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                        <div className="flex items-center justify-between border-b px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <UserRound className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-950">
                                        Phân công giảng viên
                                    </h2>

                                    <p className="mt-1 text-sm font-medium text-gray-600">
                                        Lớp học phần: {selectedAssignSection?.ma_lop_hp}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeAssignModal}
                                disabled={assigning}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssign} className="space-y-5 px-6 py-5">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Môn học</p>
                                <p className="mt-1 text-lg font-bold text-gray-950">
                                    {selectedAssignSection?.ten_mon || "-"}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-800">
                                    Chọn giảng viên
                                </label>

                                <select
                                    value={selectedLecturer}
                                    onChange={(e) => setSelectedLecturer(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">-- Chọn giảng viên --</option>

                                    {lecturers.map((gv) => (
                                        <option key={gv.ma_gv} value={gv.ma_gv}>
                                            {gv.ma_gv} - {gv.ho_ten}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-5">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    disabled={assigning}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={assigning}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {assigning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Lưu phân công
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
                                <BookOpen className="h-8 w-8 text-white" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-950">
                                        Lớp học phần
                                    </h1>

                                    <span className="text-2xl text-gray-300">•</span>

                                    <h2 className="text-3xl font-semibold text-gray-800">
                                        Admin
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Quản lý lớp học phần, phân công giảng viên và đăng ký sinh viên
                                </p>
                            </div>
                        </div>

                        <div className="xl:col-span-7">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                    <div className="lg:col-span-7">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Tìm kiếm lớp học phần
                                        </label>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                            <input
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pl-10 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                placeholder="Tìm theo mã lớp, môn học, giảng viên..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <button
                                            type="button"
                                            onClick={loadData}
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
                                            Tạo lớp HP
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                    <StatCard
                        icon={BookOpen}
                        label="Tổng lớp học phần"
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
                        icon={UserRound}
                        label="Đã phân công"
                        value={stats.assigned}
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
                        label="Chưa phân công"
                        value={stats.notAssigned}
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
                        icon={Users}
                        label="SV đang đăng ký"
                        value={stats.totalRegistered}
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

                <div className="flex flex-wrap gap-3">
                    <TabButton
                        active={activeTab === "sections"}
                        onClick={() => setActiveTab("sections")}
                        icon={ClipboardList}
                        label="Danh sách lớp học phần"
                    />

                    <TabButton
                        active={activeTab === "assignments"}
                        onClick={() => setActiveTab("assignments")}
                        icon={UserRound}
                        label="Phân công giảng viên"
                    />

                    <TabButton
                        active={activeTab === "registrations"}
                        onClick={() => setActiveTab("registrations")}
                        icon={UserPlus}
                        label="Đăng ký sinh viên"
                    />
                </div>

                {(activeTab === "sections" || activeTab === "assignments") && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-950">
                                    {activeTab === "sections"
                                        ? "Danh sách lớp học phần"
                                        : "Phân công giảng viên cho lớp học phần"}
                                </h3>

                                <p className="mt-1 text-sm font-medium text-gray-600">
                                    Có {filteredSections.length} lớp học phần phù hợp với bộ lọc hiện tại
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Tạo lớp HP
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                            Mã lớp HP
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                            Môn học
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                            Giảng viên
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                            Học kỳ
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                            Năm học
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
                                                        Đang tải danh sách lớp học phần...
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredSections.length > 0 ? (
                                        filteredSections.map((section, index) => (
                                            <tr
                                                key={section.ma_lop_hp}
                                                className={`border-b border-gray-100 transition hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                                    }`}
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                                                        {section.ma_lop_hp}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                                                            <BookOpen className="h-4 w-4 text-blue-600" />
                                                        </div>

                                                        <p className="font-bold text-gray-950">
                                                            {section.ten_mon || "-"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {section.ten_giang_vien ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                            <UserRound className="h-3.5 w-3.5" />
                                                            {section.ten_giang_vien}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                                                            Chưa phân công
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        {section.hoc_ky || "-"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {section.nam_hoc || "-"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignModal(section)}
                                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                                                        >
                                                            <UserRound className="h-3.5 w-3.5" />
                                                            Phân công
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => goToRegistrationTab(section)}
                                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                            Đăng ký SV
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
                                                    Không có dữ liệu lớp học phần
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-gray-500">
                                                    Hãy thử nhập từ khóa khác hoặc tạo lớp học phần mới.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "registrations" && (
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />

                            <div className="p-5">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                    <div className="lg:col-span-7">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Chọn lớp học phần
                                        </label>

                                        <select
                                            value={selectedLopHp}
                                            onChange={(e) => setSelectedLopHp(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">-- Chọn lớp học phần --</option>

                                            {sections.map((section) => (
                                                <option key={section.ma_lop_hp} value={section.ma_lop_hp}>
                                                    {section.ma_lop_hp} - {section.ten_mon}
                                                    {section.ten_giang_vien
                                                        ? ` - GV: ${section.ten_giang_vien}`
                                                        : " - Chưa phân công"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="lg:col-span-5">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                                            Thêm sinh viên
                                        </label>

                                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                                            <select
                                                value={selectedStudent}
                                                onChange={(e) => setSelectedStudent(e.target.value)}
                                                disabled={!selectedLopHp}
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-100"
                                            >
                                                <option value="">-- Chọn sinh viên --</option>

                                                {availableStudents.map((sv) => (
                                                    <option key={sv.ma_sv} value={sv.ma_sv}>
                                                        {sv.ma_sv} - {sv.ho_ten}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={handleRegister}
                                                disabled={!selectedLopHp || !selectedStudent || registering}
                                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {registering ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <UserPlus className="h-4 w-4" />
                                                )}
                                                Thêm
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {selectedSection && (
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                            <p className="text-xs font-semibold text-blue-600">
                                                Mã lớp HP
                                            </p>
                                            <p className="mt-1 font-bold text-blue-700">
                                                {selectedSection.ma_lop_hp}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:col-span-2">
                                            <p className="text-xs font-semibold text-emerald-600">
                                                Môn học
                                            </p>
                                            <p className="mt-1 font-bold text-emerald-700">
                                                {selectedSection.ten_mon}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 md:col-span-2">
                                            <p className="text-xs font-semibold text-violet-600">
                                                Giảng viên
                                            </p>
                                            <p className="mt-1 font-bold text-violet-700">
                                                {selectedSection.ten_giang_vien || "Chưa phân công"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedLopHp ? (
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b px-5 py-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-950">
                                            Danh sách sinh viên đã đăng ký
                                        </h3>

                                        <p className="mt-1 text-sm font-medium text-gray-600">
                                            Có {activeRegistrations.length} sinh viên đang đăng ký hoạt động
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
                                                    Lớp sinh hoạt
                                                </th>
                                                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600">
                                                    Email
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
                                            {loadingRegistrations ? (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-gray-500">
                                                            <div className="h-9 w-9 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                                                            <p className="font-semibold text-gray-700">
                                                                Đang tải danh sách đăng ký...
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : registrations.length > 0 ? (
                                                registrations.map((row, index) => (
                                                    <tr
                                                        key={`${row.ma_lop_hp}-${row.ma_sv}-${index}`}
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
                                                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                                                </div>

                                                                <p className="font-bold text-gray-950">
                                                                    {row.ho_ten || "-"}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="font-semibold text-gray-700">
                                                                {row.ma_lop || row.ten_lop || "-"}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="font-semibold text-gray-700">
                                                                {row.email || "-"}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge status={row.trang_thai} />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-end">
                                                                {row.trang_thai === "da_dang_ky" ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCancelRegistration(row)}
                                                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                        Hủy đăng ký
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-sm font-semibold text-gray-400">
                                                                        Không khả dụng
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-16 text-center">
                                                        <Users className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                                                        <p className="text-lg font-bold text-gray-800">
                                                            Chưa có sinh viên nào đăng ký
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-gray-500">
                                                            Hãy chọn sinh viên ở phía trên để thêm vào lớp học phần.
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
                                <School className="mx-auto mb-3 h-14 w-14 text-gray-200" />
                                <p className="text-xl font-bold text-gray-800">
                                    Chưa chọn lớp học phần
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-500">
                                    Chọn một lớp học phần để đăng ký sinh viên.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}