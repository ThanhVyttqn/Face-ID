import API from './Auth_api';

export const getMyClassesApi = () => API.get('/giang-vien/lop-hoc-phan');

export const getClassDetailApi = (ma_lop_hp) =>
    API.get(`/giang-vien/lop-hoc-phan/${ma_lop_hp}`);

export const getClassSessionsApi = (ma_lop_hp) =>
    API.get(`/giang-vien/lop-hoc-phan/${ma_lop_hp}/buoi-hoc`);

export const createSessionApi = (ma_lop_hp, payload) =>
    API.post(`/giang-vien/lop-hoc-phan/${ma_lop_hp}/buoi-hoc`, payload);

export const getSessionAttendanceApi = (id_buoi) =>
    API.get(`/giang-vien/buoi-hoc/${id_buoi}/diem-danh`);

export const upsertAttendanceApi = (payload) =>
    API.post('/giang-vien/diem-danh', payload);

export const updateSessionStatusApi = (id_buoi, payload) =>
    API.put(`/giang-vien/buoi-hoc/${id_buoi}/trang-thai`, payload);

export const getAttendanceHistoryApi = (search = '') =>
    API.get('/giang-vien/lich-su-diem-danh', {
        params: search ? { search } : {},
    });

export const getAttendanceHistoryDetailApi = (id_buoi) =>
    API.get(`/giang-vien/lich-su-diem-danh/${id_buoi}`);

export const getProfileApi = () => API.get('/giang-vien/tai-khoan');

export const updateProfileApi = (payload) =>
    API.put('/giang-vien/tai-khoan', payload);

export const changePasswordApi = (payload) =>
    API.put('/giang-vien/doi-mat-khau', payload);

export const startAttendanceSessionApi = (payload) =>
    API.post('/giang-vien/diem-danh/phien-bat-dau', payload);

export const stopAttendanceSessionApi = () =>
    API.post('/giang-vien/diem-danh/phien-ket-thuc');

export const getActiveAttendanceSessionApi = () =>
    API.get('/giang-vien/diem-danh/phien-hien-tai');

export const getAttendanceSessionLogsApi = () =>
    API.get('/giang-vien/diem-danh/phien-log');