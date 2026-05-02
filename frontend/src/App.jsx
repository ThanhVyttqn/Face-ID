import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import LoginPage from "./pages/LoginPage";
import SinhVienPage from "./pages/SinhVienPage";
import RoleRoute from "./routes/RoleRoute";

/* Admin */
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AccountsPage from "./pages/admin/AccountsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import LecturersPage from "./pages/admin/LecturersPage";
import SubjectsPage from "./pages/admin/SubjectsPage";
import CourseSectionsPage from "./pages/admin/CourseSectionsPage";
import FaceDataPage from "./pages/admin/FaceDataPage";

/* Giảng viên */
import GiangVienDashboard from "./pages/giang-vien/GiangVienDashboard";

/* Assistant */
import AssistantChatBox from "./components/assistant/AssistantChatBox";

function App() {
  const location = useLocation();

  const showAssistant =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/giang-vien");

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <RoleRoute allowRole="admin">
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="lecturers" element={<LecturersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />

          {/* Đã gộp: danh sách lớp HP + phân công GV + đăng ký SV */}
          <Route path="course-sections" element={<CourseSectionsPage />} />

          <Route path="du-lieu-khuon-mat" element={<FaceDataPage />} />
        </Route>

        <Route
          path="/giang-vien/*"
          element={
            <RoleRoute allowRole="giang_vien">
              <GiangVienDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/sinh-vien"
          element={
            <RoleRoute allowRole="sinh_vien">
              <SinhVienPage />
            </RoleRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAssistant && <AssistantChatBox />}

      <Toaster richColors position="bottom-right" />
    </>
  );
}

export default App;