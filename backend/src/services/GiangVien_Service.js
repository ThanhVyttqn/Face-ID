const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const GiangVienModel = require('../models/GiangVien_Model');

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const getVietnamNow = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

const mapStudentBasicInfo = (student) => ({
  ma_sv: student.ma_sv,
  ho_ten: student.ho_ten || student.ten_sinh_vien,
  email: student.email || null,
  sdt: student.sdt || null,
  ma_lop: student.ma_lop || null,
  ten_lop: student.ten_lop || null,
  trang_thai_dang_ky: student.trang_thai,
});

const calculateAttendanceStats = (attendanceRows = [], totalStudents = 0) => {
  const stats = {
    tong_sinh_vien: totalStudents,
    da_diem_danh: attendanceRows.length,
    co_mat: 0,
    di_muon: 0,
    vang: 0,
    vang_co_phep: 0,
    chua_diem_danh: Math.max(totalStudents - attendanceRows.length, 0),
  };

  attendanceRows.forEach((row) => {
    if (row.trang_thai === 'co_mat') stats.co_mat += 1;
    else if (row.trang_thai === 'di_muon' || row.trang_thai === 'muon') stats.di_muon += 1;
    else if (row.trang_thai === 'vang') stats.vang += 1;
    else if (row.trang_thai === 'vang_co_phep') stats.vang_co_phep += 1;
  });

  return stats;
};

const sortSessionsAsc = (sessions = []) =>
  [...sessions].sort(
    (a, b) =>
      new Date(`${a.ngay_hoc || ''} ${a.gio_bat_dau || '00:00:00'}`) -
      new Date(`${b.ngay_hoc || ''} ${b.gio_bat_dau || '00:00:00'}`)
  );

const sortSessionsDesc = (sessions = []) =>
  [...sessions].sort(
    (a, b) =>
      new Date(`${b.ngay_hoc || ''} ${b.gio_bat_dau || '00:00:00'}`) -
      new Date(`${a.ngay_hoc || ''} ${a.gio_bat_dau || '00:00:00'}`)
  );

const getNextSession = (sessions = []) => {
  const now = new Date();
  return (
    sortSessionsAsc(sessions).find(
      (item) => new Date(`${item.ngay_hoc || ''} ${item.gio_bat_dau || '00:00:00'}`) >= now
    ) || null
  );
};

const activeAttendanceProcesses = new Map();
const getProcessKey = (ma_gv) => `gv:${ma_gv}`;
const getPythonCommand = () => process.env.PYTHON_BIN || process.env.PYTHON_CMD || 'python';

const getRecognitionScriptPath = () => {
  if (process.env.RECOGNITION_SCRIPT_PATH) {
    return path.resolve(process.env.RECOGNITION_SCRIPT_PATH);
  }
  const pythonDir = process.env.PYTHON_DIR || process.cwd();
  const pythonScript = process.env.PYTHON_SCRIPT || 'recognize_and_log.py';
  return path.resolve(pythonDir, pythonScript);
};

const appendProcessLog = (ma_gv, message) => {
  const key = getProcessKey(ma_gv);
  const current = activeAttendanceProcesses.get(key);
  if (!current || !message) return;

  const lines = String(message)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!lines.length) return;

  current.logs.push(...lines.map((line) => `[${new Date().toISOString()}] ${line}`));
  if (current.logs.length > 200) {
    current.logs = current.logs.slice(-200);
  }
};

const ensureLecturerOwnsClass = async (ma_gv, ma_lop_hp) => {
  const lopHocPhan = await GiangVienModel.findClassById(ma_lop_hp);
  if (!lopHocPhan) throw createError(404, 'Không tìm thấy lớp học phần');
  if (lopHocPhan.ma_gv !== ma_gv) throw createError(403, 'Bạn không có quyền truy cập lớp học phần này');
  return lopHocPhan;
};

const ensureLecturerOwnsSession = async (ma_gv, id_buoi) => {
  const buoiHoc = await GiangVienModel.findSessionById(id_buoi);
  if (!buoiHoc) throw createError(404, 'Không tìm thấy buổi học');
  if (buoiHoc.ma_gv !== ma_gv) throw createError(403, 'Bạn không có quyền truy cập buổi học này');
  return buoiHoc;
};

const buildStudentSummaryForClass = async (students = [], sessions = []) => {
  const attendanceBySession = await Promise.all(
    sessions.map(async (session) => ({
      id_buoi: session.id_buoi,
      rows: await GiangVienModel.findAttendanceBySession(session.id_buoi),
    }))
  );

  return students.map((student) => {
    let co_mat = 0;
    let di_muon = 0;
    let vang = 0;
    let vang_co_phep = 0;

    attendanceBySession.forEach((session) => {
      const record = session.rows.find((row) => row.ma_sv === student.ma_sv);
      if (!record) return;
      if (record.trang_thai === 'co_mat') co_mat += 1;
      else if (record.trang_thai === 'di_muon' || record.trang_thai === 'muon') di_muon += 1;
      else if (record.trang_thai === 'vang') vang += 1;
      else if (record.trang_thai === 'vang_co_phep') vang_co_phep += 1;
    });

    return {
      ...mapStudentBasicInfo(student),
      so_buoi_co_mat: co_mat,
      so_buoi_di_muon: di_muon,
      so_buoi_vang: vang,
      so_buoi_vang_co_phep: vang_co_phep,
      tong_buoi_da_co_du_lieu: co_mat + di_muon + vang + vang_co_phep,
    };
  });
};

const autoMarkAbsentWhenClose = async (buoiHoc) => {
  const registrations = await GiangVienModel.findRegistrationsByClass(buoiHoc.ma_lop_hp);
  const students = registrations.filter((item) => item.trang_thai === 'da_dang_ky');
  const attendanceRows = await GiangVienModel.findAttendanceBySession(buoiHoc.id_buoi);
  const attendanceMap = new Map(attendanceRows.map((row) => [row.ma_sv, row]));

  await Promise.all(
    students.map(async (student) => {
      if (attendanceMap.has(student.ma_sv)) return;
      await GiangVienModel.upsertAttendance({
        id_buoi: buoiHoc.id_buoi,
        ma_lop_hp: buoiHoc.ma_lop_hp,
        ma_sv: student.ma_sv,
        trang_thai: 'vang',
        thoi_gian: getVietnamNow(),
        do_tin_cay: null,
        phuong_thuc: 'he_thong',
        ghi_chu: 'Tự động đánh dấu vắng khi kết thúc buổi học',
      });
    })
  );
};

const GiangVienService = {
  async getMyProfile(ma_gv) {
    const giangVien = await GiangVienModel.findLecturerProfile(ma_gv);
    if (!giangVien) throw createError(404, 'Không tìm thấy thông tin giảng viên');
    return giangVien;
  },

  async updateMyProfile(ma_gv, payload) {
    const current = await GiangVienModel.findLecturerProfile(ma_gv);
    if (!current) throw createError(404, 'Không tìm thấy thông tin giảng viên');

    return GiangVienModel.updateLecturerProfile(ma_gv, {
      ho_ten: payload.ho_ten,
      email: payload.email === undefined ? current.email : (payload.email || null),
      sdt: payload.sdt === undefined ? current.sdt : (payload.sdt || null),
      ma_khoa: current.ma_khoa,
    });
  },

  async changeMyPassword({ ma_gv, ma_dang_nhap, mat_khau_cu, mat_khau_moi }) {
    const loginCode = ma_dang_nhap || ma_gv;
    const taiKhoan = await GiangVienModel.findAccountByLoginCode(loginCode);
    if (!taiKhoan) throw createError(404, 'Không tìm thấy tài khoản đăng nhập');

    const isMatched = await bcrypt.compare(mat_khau_cu, taiKhoan.mat_khau_hash);
    if (!isMatched) throw createError(400, 'Mật khẩu cũ không chính xác');

    const isSamePassword = await bcrypt.compare(mat_khau_moi, taiKhoan.mat_khau_hash);
    if (isSamePassword) throw createError(400, 'Mật khẩu mới không được trùng với mật khẩu cũ');

    const mat_khau_hash = await bcrypt.hash(mat_khau_moi, 10);
    return GiangVienModel.updateAccountPassword(taiKhoan.id, mat_khau_hash);
  },

  async getMyClasses(ma_gv) {
    const classes = await GiangVienModel.findClassesByLecturer(ma_gv);

    return Promise.all(
      classes.map(async (item) => {
        const [tong_sinh_vien, danhSachBuoiHoc] = await Promise.all([
          GiangVienModel.countRegisteredStudents(item.ma_lop_hp),
          GiangVienModel.findSessionsByClass(item.ma_lop_hp),
        ]);

        const sortedSessions = sortSessionsAsc(danhSachBuoiHoc);
        const nextSession = getNextSession(sortedSessions);

        return {
          ...item,
          tong_sinh_vien,
          tong_buoi_hoc: sortedSessions.length,
          buoi_hoc_tiep_theo: nextSession,
          buoi_hoc_gan_nhat: sortedSessions.length ? sortedSessions[sortedSessions.length - 1] : null,
        };
      })
    );
  },

  async getMyClassDetail(ma_gv, ma_lop_hp) {
    const lop_hoc_phan = await ensureLecturerOwnsClass(ma_gv, ma_lop_hp);

    const [tong_sinh_vien, danhSachBuoiHoc, registrations] = await Promise.all([
      GiangVienModel.countRegisteredStudents(ma_lop_hp),
      GiangVienModel.findSessionsByClass(ma_lop_hp),
      GiangVienModel.findRegistrationsByClass(ma_lop_hp),
    ]);

    const students = registrations.filter((item) => item.trang_thai === 'da_dang_ky');
    const danh_sach_buoi_hoc = sortSessionsAsc(danhSachBuoiHoc);
    const danh_sach_sinh_vien = await buildStudentSummaryForClass(students, danh_sach_buoi_hoc);

    return {
      lop_hoc_phan,
      tong_sinh_vien,
      tong_buoi_hoc: danh_sach_buoi_hoc.length,
      buoi_hoc_tiep_theo: getNextSession(danh_sach_buoi_hoc),
      danh_sach_buoi_hoc,
      danh_sach_sinh_vien,
    };
  },

  async getMyClassSessions(ma_gv, ma_lop_hp) {
    const lop_hoc_phan = await ensureLecturerOwnsClass(ma_gv, ma_lop_hp);
    const danh_sach_buoi_hoc = await GiangVienModel.findSessionsByClass(ma_lop_hp);

    return {
      lop_hoc_phan,
      tong_buoi_hoc: danh_sach_buoi_hoc.length,
      danh_sach_buoi_hoc,
    };
  },

  async createSession(ma_gv, payload) {
    await ensureLecturerOwnsClass(ma_gv, payload.ma_lop_hp);
    return GiangVienModel.insertSession({
      ma_lop_hp: payload.ma_lop_hp,
      ngay_hoc: payload.ngay_hoc,
      gio_bat_dau: payload.gio_bat_dau || '07:00:00',
      gio_ket_thuc: payload.gio_ket_thuc || '09:30:00',
      trang_thai: payload.trang_thai || 'chua_dien_ra',
    });
  },

  async getSessionAttendance(ma_gv, id_buoi) {
    const buoi_hoc = await ensureLecturerOwnsSession(ma_gv, id_buoi);

    const [lop_hoc_phan, registrations, attendanceRows] = await Promise.all([
      GiangVienModel.findClassById(buoi_hoc.ma_lop_hp),
      GiangVienModel.findRegistrationsByClass(buoi_hoc.ma_lop_hp),
      GiangVienModel.findAttendanceBySession(id_buoi),
    ]);

    const students = registrations.filter((item) => item.trang_thai === 'da_dang_ky');
    const attendanceMap = new Map(attendanceRows.map((row) => [row.ma_sv, row]));

    const danh_sach_sinh_vien = students.map((student) => {
      const attendance = attendanceMap.get(student.ma_sv);
      return {
        ...mapStudentBasicInfo(student),
        trang_thai_hom_nay: attendance?.trang_thai || null,
        thoi_gian_hom_nay: attendance?.thoi_gian || null,
        do_tin_cay: attendance?.do_tin_cay || null,
        phuong_thuc: attendance?.phuong_thuc || null,
        ghi_chu: attendance?.ghi_chu || null,
      };
    });

    const latestAttendanceByStudent = new Map();
    [...attendanceRows]
      .sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian))
      .forEach((row) => {
        if (!latestAttendanceByStudent.has(row.ma_sv)) latestAttendanceByStudent.set(row.ma_sv, row);
      });

    const diem_danh_gan_day = [...latestAttendanceByStudent.values()]
      .sort((a, b) => new Date(b.thoi_gian) - new Date(a.thoi_gian))
      .slice(0, 10)
      .map((row) => {
        const student = students.find((item) => item.ma_sv === row.ma_sv);
        return {
          id_diem_danh: row.id_diem_danh,
          ma_sv: row.ma_sv,
          ho_ten: student?.ho_ten || student?.ten_sinh_vien || row.ma_sv,
          ma_lop: student?.ma_lop || null,
          ten_lop: student?.ten_lop || null,
          trang_thai: row.trang_thai,
          thoi_gian: row.thoi_gian,
          do_tin_cay: row.do_tin_cay,
          phuong_thuc: row.phuong_thuc,
          ghi_chu: row.ghi_chu || null,
        };
      });

    return {
      lop_hoc_phan,
      buoi_hoc,
      thong_ke: calculateAttendanceStats(attendanceRows, students.length),
      danh_sach_sinh_vien,
      diem_danh_gan_day,
    };
  },

  async upsertAttendance(ma_gv, id_buoi, payload) {
    const buoiHoc = await ensureLecturerOwnsSession(ma_gv, id_buoi);
    if (buoiHoc.trang_thai === 'chua_dien_ra') {
      throw createError(400, 'Buổi học chưa mở điểm danh');
    }

    if (buoiHoc.trang_thai === 'da_huy') {
      throw createError(400, 'Buổi học đã hủy, không thể cập nhật điểm danh');
    }

    const isRegistered = await GiangVienModel.isStudentRegistered(payload.ma_sv, buoiHoc.ma_lop_hp);
    if (!isRegistered) {
      throw createError(400, 'Sinh viên không thuộc lớp học phần này hoặc đã hủy đăng ký');
    }

    return GiangVienModel.upsertAttendance({
      id_buoi,
      ma_lop_hp: buoiHoc.ma_lop_hp,
      ma_sv: payload.ma_sv,
      trang_thai: payload.trang_thai,
      thoi_gian: payload.thoi_gian || getVietnamNow(),
      do_tin_cay: toNumberOrNull(payload.do_tin_cay),
      phuong_thuc: payload.phuong_thuc || 'thu_cong',
      ghi_chu: payload.ghi_chu ?? null,
    });
  },

  async openAttendance(ma_gv, id_buoi) {
    const buoiHoc = await ensureLecturerOwnsSession(ma_gv, id_buoi);

    if (buoiHoc.trang_thai === 'da_huy') {
      throw createError(400, 'Buổi học đã bị hủy, không thể mở điểm danh');
    }
    if (buoiHoc.trang_thai === 'da_ket_thuc') {
      throw createError(400, 'Buổi học đã kết thúc, không thể mở lại điểm danh');
    }
    if (buoiHoc.trang_thai === 'dang_dien_ra') return buoiHoc;

    return GiangVienModel.updateSession(id_buoi, {
      ma_lop_hp: buoiHoc.ma_lop_hp,
      ngay_hoc: buoiHoc.ngay_hoc,
      gio_bat_dau: buoiHoc.gio_bat_dau,
      gio_ket_thuc: buoiHoc.gio_ket_thuc,
      trang_thai: 'dang_dien_ra',
    });
  },

  async closeAttendance(ma_gv, id_buoi) {
    const buoiHoc = await ensureLecturerOwnsSession(ma_gv, id_buoi);
    if (buoiHoc.trang_thai === 'da_ket_thuc') return buoiHoc;

    await autoMarkAbsentWhenClose(buoiHoc);

    return GiangVienModel.updateSession(id_buoi, {
      ma_lop_hp: buoiHoc.ma_lop_hp,
      ngay_hoc: buoiHoc.ngay_hoc,
      gio_bat_dau: buoiHoc.gio_bat_dau,
      gio_ket_thuc: buoiHoc.gio_ket_thuc,
      trang_thai: 'da_ket_thuc',
    });
  },

  async getAttendanceHistory(ma_gv, search = '') {
    const classes = await GiangVienModel.findClassesByLecturer(ma_gv);
    const rows = [];

    for (const lopHocPhan of classes) {
      const matched =
        !search
        || lopHocPhan.ma_lop_hp?.toLowerCase().includes(search.toLowerCase())
        || lopHocPhan.ten_mon?.toLowerCase().includes(search.toLowerCase());
      if (!matched) continue;

      const sessions = await GiangVienModel.findSessionsByClass(lopHocPhan.ma_lop_hp);
      for (const buoiHoc of sessions) {
        const attendanceRows = await GiangVienModel.findAttendanceBySession(buoiHoc.id_buoi);
        const stats = calculateAttendanceStats(
          attendanceRows,
          await GiangVienModel.countRegisteredStudents(lopHocPhan.ma_lop_hp)
        );

        rows.push({
          id_buoi: buoiHoc.id_buoi,
          ma_lop_hp: lopHocPhan.ma_lop_hp,
          ten_mon: lopHocPhan.ten_mon,
          ngay_hoc: buoiHoc.ngay_hoc,
          gio_bat_dau: buoiHoc.gio_bat_dau,
          gio_ket_thuc: buoiHoc.gio_ket_thuc,
          trang_thai: buoiHoc.trang_thai,
          tong_luot_diem_danh: attendanceRows.length,
          thong_ke: stats,
        });
      }
    }

    return sortSessionsDesc(rows);
  },

  async getAttendanceHistoryBySession(ma_gv, id_buoi) {
    const buoiHoc = await ensureLecturerOwnsSession(ma_gv, id_buoi);

    const [lopHocPhan, registrations, attendanceRows] = await Promise.all([
      GiangVienModel.findClassById(buoiHoc.ma_lop_hp),
      GiangVienModel.findRegistrationsByClass(buoiHoc.ma_lop_hp),
      GiangVienModel.findAttendanceBySession(id_buoi),
    ]);

    const students = registrations.filter((item) => item.trang_thai === 'da_dang_ky');
    const attendanceMap = new Map(attendanceRows.map((row) => [row.ma_sv, row]));

    const danh_sach_sinh_vien = students.map((student) => {
      const attendance = attendanceMap.get(student.ma_sv);
      return {
        ...mapStudentBasicInfo(student),
        trang_thai: attendance?.trang_thai || null,
        thoi_gian: attendance?.thoi_gian || null,
        phuong_thuc: attendance?.phuong_thuc || null,
        do_tin_cay: attendance?.do_tin_cay || null,
        ghi_chu: attendance?.ghi_chu || null,
        ngay_diem_danh: attendance?.thoi_gian ? normalizeDate(attendance.thoi_gian) : buoiHoc.ngay_hoc,
      };
    });

    return {
      thong_tin_buoi_hoc: {
        id_buoi: buoiHoc.id_buoi,
        ma_lop_hp: lopHocPhan.ma_lop_hp,
        ten_mon: lopHocPhan.ten_mon,
        ngay_hoc: buoiHoc.ngay_hoc,
        gio_bat_dau: buoiHoc.gio_bat_dau,
        gio_ket_thuc: buoiHoc.gio_ket_thuc,
        trang_thai: buoiHoc.trang_thai,
        tong_luot_diem_danh: attendanceRows.length,
        thong_ke: calculateAttendanceStats(attendanceRows, students.length),
      },
      danh_sach_sinh_vien,
    };
  },

  async startAttendanceSession(ma_gv, { id_buoi, camera_url }) {
    if (!id_buoi || !camera_url) {
      throw createError(400, 'Vui lòng chọn buổi học và nhập camera_url');
    }

    const key = getProcessKey(ma_gv);
    const existingProcess = activeAttendanceProcesses.get(key);
    if (existingProcess && existingProcess.process && !existingProcess.process.killed) {
      throw createError(400, 'Hiện đang có một phiên điểm danh chạy rồi');
    }

    const buoiHoc = await this.openAttendance(ma_gv, Number(id_buoi));
    const pythonCmd = getPythonCommand();
    const scriptPath = getRecognitionScriptPath();

    if (!fs.existsSync(scriptPath)) {
      throw createError(500, `Không tìm thấy file Python nhận diện: ${scriptPath}`);
    }

    const child = spawn(
      pythonCmd,
      [scriptPath, '--camera-url', camera_url, '--id-buoi', String(buoiHoc.id_buoi)],
      {
        cwd: process.env.PYTHON_DIR || path.dirname(scriptPath),
        env: {
          ...process.env,
          PYTHONUNBUFFERED: process.env.PYTHONUNBUFFERED || '1',
          PYTHONIOENCODING: process.env.PYTHONIOENCODING || 'utf-8',
          PYTHONUTF8: process.env.PYTHONUTF8 || '1',
        },
        windowsHide: true,
      }
    );

    activeAttendanceProcesses.set(key, {
      process: child,
      ma_gv,
      ma_lop_hp: buoiHoc.ma_lop_hp,
      id_buoi: buoiHoc.id_buoi,
      camera_url,
      started_at: new Date().toISOString(),
      logs: [
        `[${new Date().toISOString()}] Bắt đầu tiến trình Python`,
        `[${new Date().toISOString()}] PYTHON_BIN=${pythonCmd}`,
        `[${new Date().toISOString()}] SCRIPT=${scriptPath}`,
        `[${new Date().toISOString()}] ID_BUOI=${buoiHoc.id_buoi}`,
      ],
    });

    child.stdout.on('data', (data) => appendProcessLog(ma_gv, data.toString()));
    child.stderr.on('data', (data) => appendProcessLog(ma_gv, `ERROR: ${data.toString()}`));
    child.on('error', (error) => appendProcessLog(ma_gv, `SPAWN ERROR: ${error.message}`));
    child.on('close', (code, signal) => {
      appendProcessLog(ma_gv, `Tiến trình Python kết thúc. code=${code}, signal=${signal || 'none'}`);
      activeAttendanceProcesses.delete(key);
    });

    return {
      active: true,
      ma_lop_hp: buoiHoc.ma_lop_hp,
      camera_url,
      buoi_hoc: buoiHoc,
      id_buoi: buoiHoc.id_buoi,
      started_at: new Date().toISOString(),
    };
  },

  async stopAttendanceSession(ma_gv) {
    const key = getProcessKey(ma_gv);
    const current = activeAttendanceProcesses.get(key);
    if (!current) return null;

    if (current.process && !current.process.killed) {
      current.process.kill('SIGTERM');
      appendProcessLog(ma_gv, 'Đã gửi tín hiệu dừng tiến trình Python');
    }

    if (current.id_buoi) {
      try {
        await this.closeAttendance(ma_gv, current.id_buoi);
      } catch (err) {
        appendProcessLog(ma_gv, `Lỗi đóng buổi học: ${err.message}`);
      }
    }

    return {
      id_buoi: current.id_buoi,
      ma_lop_hp: current.ma_lop_hp,
    };
  },

  async getActiveAttendanceSession(ma_gv) {
    const key = getProcessKey(ma_gv);
    const current = activeAttendanceProcesses.get(key);
    if (!current) return { active: false };

    const realtimeData = await this.getSessionAttendance(ma_gv, current.id_buoi);
    return {
      active: true,
      ma_lop_hp: current.ma_lop_hp,
      id_buoi: current.id_buoi,
      camera_url: current.camera_url,
      started_at: current.started_at,
      diem_danh_gan_day: realtimeData.diem_danh_gan_day,
      thong_ke: realtimeData.thong_ke,
      danh_sach_sinh_vien: realtimeData.danh_sach_sinh_vien,
      buoi_hoc: realtimeData.buoi_hoc,
      lop_hoc_phan: realtimeData.lop_hoc_phan,
    };
  },

  getAttendanceSessionLogs(ma_gv) {
    const key = getProcessKey(ma_gv);
    const current = activeAttendanceProcesses.get(key);
    return {
      active: !!current,
      logs: current?.logs || [],
    };
  },
};

module.exports = GiangVienService;
