import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Giang_Vien/Sidebar';
import LopHocPhanPage from './LopHocPhanPage';
import ClassDetailPage from './ClassDetailPage';
import AttendanceTodayPage from './AttendanceTodayPage';
import LichSuDiemDanhPage from './LichSuDiemDanhPage';
import ProfilePage from './ProfilePage';
import DiemDanhPage from './DiemDanhPage';

const GiangVienDashboard = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <Routes>
                    <Route index element={<Navigate to="lop-hoc-phan" replace />} />
                    <Route path="lop-hoc-phan" element={<LopHocPhanPage />} />
                    <Route path="lop-hoc-phan/:ma_lop_hp" element={<ClassDetailPage />} />
                    <Route path="buoi-hoc/:id_buoi/diem-danh" element={<AttendanceTodayPage />} />
                    <Route path="diem-danh" element={<DiemDanhPage />} />
                    <Route path="lich-su-diem-danh" element={<LichSuDiemDanhPage />} />
                    <Route path="tai-khoan" element={<ProfilePage />} />
                </Routes>
            </div>
        </div>
    );
};

export default GiangVienDashboard;