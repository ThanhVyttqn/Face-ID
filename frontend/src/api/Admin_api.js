import API from "./Auth_api";

export const getKhoaApi = () => API.get("/admin/lookups/khoa");
export const getLopSvApi = () => API.get("/admin/lookups/lop-sv");
export const getSinhVienLookupApi = () => API.get("/admin/lookups/sinh-vien");
export const getGiangVienLookupApi = () => API.get("/admin/lookups/giang-vien");
export const getMonHocLookupApi = () => API.get("/admin/lookups/mon-hoc");

/* TÀI KHOẢN */
export const getTaiKhoansApi = (params) => API.get("/admin/tai-khoan", { params });
export const createAdminAccountApi = (data) => API.post("/admin/tai-khoan/admin", data);
export const createStudentAccountApi = (ma_sv, data) => API.post(`/admin/tai-khoan/sinh-vien/${ma_sv}`, data);
export const createLecturerAccountApi = (ma_gv, data) => API.post(`/admin/tai-khoan/giang-vien/${ma_gv}`, data);
export const updateTaiKhoanStatusApi = (id, data) => API.put(`/admin/tai-khoan/${id}/status`, data);
export const changePasswordApi = (id, data) => API.put(`/admin/tai-khoan/${id}/password`, data);
export const deleteTaiKhoanApi = (id) => API.delete(`/admin/tai-khoan/${id}`);

/* SINH VIÊN */
export const getSinhViensApi = (params) => API.get("/admin/sinh-vien", { params });
export const getSinhVienByIdApi = (ma_sv) => API.get(`/admin/sinh-vien/${ma_sv}`);
export const createSinhVienApi = (data) => API.post("/admin/sinh-vien", data);
export const updateSinhVienApi = (ma_sv, data) => API.put(`/admin/sinh-vien/${ma_sv}`, data);
export const deleteSinhVienApi = (ma_sv) => API.delete(`/admin/sinh-vien/${ma_sv}`);

/* GIẢNG VIÊN */
export const getGiangViensApi = (params) => API.get("/admin/giang-vien", { params });
export const getGiangVienByIdApi = (ma_gv) => API.get(`/admin/giang-vien/${ma_gv}`);
export const createGiangVienApi = (data) => API.post("/admin/giang-vien", data);
export const updateGiangVienApi = (ma_gv, data) => API.put(`/admin/giang-vien/${ma_gv}`, data);
export const deleteGiangVienApi = (ma_gv) => API.delete(`/admin/giang-vien/${ma_gv}`);

/* MÔN HỌC */
export const getMonHocsApi = (params) => API.get("/admin/mon-hoc", { params });
export const getMonHocByIdApi = (ma_mon) => API.get(`/admin/mon-hoc/${ma_mon}`);
export const createMonHocApi = (data) => API.post("/admin/mon-hoc", data);
export const updateMonHocApi = (ma_mon, data) => API.put(`/admin/mon-hoc/${ma_mon}`, data);
export const deleteMonHocApi = (ma_mon) => API.delete(`/admin/mon-hoc/${ma_mon}`);

/* LỚP HỌC PHẦN */
export const getLopHocPhansApi = (params) => API.get("/admin/lop-hoc-phan", { params });
export const getLopHocPhanByIdApi = (ma_lop_hp) => API.get(`/admin/lop-hoc-phan/${ma_lop_hp}`);
export const createLopHocPhanApi = (data) => API.post("/admin/lop-hoc-phan", data);
export const updateLopHocPhanApi = (ma_lop_hp, data) => API.put(`/admin/lop-hoc-phan/${ma_lop_hp}`, data);
export const deleteLopHocPhanApi = (ma_lop_hp) => API.delete(`/admin/lop-hoc-phan/${ma_lop_hp}`);

/* PHÂN CÔNG */
export const assignGiangVienApi = (ma_lop_hp, data) => API.put(`/admin/phan-cong/${ma_lop_hp}`, data);
/* ĐĂNG KÝ SINH VIÊN VÀO LỚP HỌC PHẦN */
export const getRegistrationsByClassSectionApi = (ma_lop_hp) =>
    API.get(`/admin/lop-hoc-phan/${ma_lop_hp}/sinh-vien`);

export const registerStudentToClassSectionApi = (ma_lop_hp, data) =>
    API.post(`/admin/lop-hoc-phan/${ma_lop_hp}/sinh-vien`, data);

export const cancelStudentRegistrationApi = (ma_lop_hp, ma_sv) =>
    API.delete(`/admin/lop-hoc-phan/${ma_lop_hp}/sinh-vien/${ma_sv}`);

/* DỮ LIỆU KHUÔN MẶT */
export const getFaceDataDashboardApi = (params) =>
    API.get("/admin/du-lieu-khuon-mat", { params });

export const getFaceDataByStudentApi = (ma_sv) =>
    API.get(`/admin/du-lieu-khuon-mat/${ma_sv}`);

export const collectFaceDataApi = (ma_sv, data) =>
    API.post(`/admin/du-lieu-khuon-mat/${ma_sv}/thu-thap`, data);

export const deleteFaceDataApi = (ma_sv) =>
    API.delete(`/admin/du-lieu-khuon-mat/${ma_sv}`);

export const trainFaceDataApi = () =>
    API.post("/admin/du-lieu-khuon-mat/train");

export const syncFaceDataFromDatasetApi = () =>
    API.post("/admin/du-lieu-khuon-mat/dong-bo");