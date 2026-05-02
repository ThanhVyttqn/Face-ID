import { BookOpen, Clock, User, LogOut, Camera, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menu = [
        {
            icon: BookOpen,
            label: 'Lớp học phần',
            path: '/giang-vien/lop-hoc-phan',
            activePaths: ['/giang-vien/lop-hoc-phan'],
        },
        {
            icon: Camera,
            label: 'Điểm danh',
            path: '/giang-vien/diem-danh',
            activePaths: ['/giang-vien/diem-danh', '/giang-vien/buoi-hoc'],
        },
        {
            icon: Clock,
            label: 'Lịch sử điểm danh',
            path: '/giang-vien/lich-su-diem-danh',
            activePaths: ['/giang-vien/lich-su-diem-danh'],
        },
        {
            icon: User,
            label: 'Tài khoản cá nhân',
            path: '/giang-vien/tai-khoan',
            activePaths: ['/giang-vien/tai-khoan'],
        },
    ];

    const isActiveMenu = (item) => {
        return item.activePaths.some((path) =>
            location.pathname.startsWith(path)
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('account');

        navigate('/', {
            replace: true,
        });
    };

    return (
        <aside className="sticky top-0 h-screen w-72 shrink-0 border-r border-gray-200 bg-white shadow-sm">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="border-b border-gray-100 px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-md">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-blue-600">
                                Giảng Viên
                            </h1>

                            <p className="mt-0.5 text-sm font-medium text-gray-500">
                                Quản lý điểm danh
                            </p>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto px-4 py-5">
                    <div className="space-y-2">
                        {menu.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveMenu(item);

                            return (
                                <button
                                    key={item.path}
                                    type="button"
                                    onClick={() => navigate(item.path)}
                                    className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${active
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                >
                                    <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${active
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout cố định dưới cùng */}
                <div className="shrink-0 border-t border-gray-100 bg-white p-4">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:bg-red-100">
                            <LogOut className="h-5 w-5" />
                        </div>

                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;