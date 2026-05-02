const AdminService = require('./Admin_Service');
const GiangVienService = require('./GiangVien_Service');

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getTodayVietnam = () => {
  const now = new Date();
  const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, '0');
  const dd = String(vn.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const compactList = (items = [], mapper, max = 80) =>
  items.slice(0, max).map(mapper).filter(Boolean);

const normalizeTime = (value) => {
  if (!value) return value;
  const text = String(value).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [h, m] = text.split(':');
    return `${String(h).padStart(2, '0')}:${m}:00`;
  }
  if (/^\d{1,2}h(\d{1,2})?$/.test(text.toLowerCase())) {
    const [h, m = '00'] = text.toLowerCase().split('h');
    return `${String(h).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}:00`;
  }
  return text;
};

const normalizePayload = (payload = {}) => {
  const clone = { ...payload };
  if (clone.gio_bat_dau) clone.gio_bat_dau = normalizeTime(clone.gio_bat_dau);
  if (clone.gio_ket_thuc) clone.gio_ket_thuc = normalizeTime(clone.gio_ket_thuc);
  if (clone.id_buoi !== undefined && clone.id_buoi !== null)
    clone.id_buoi = Number(clone.id_buoi);
  if (clone.max_images !== undefined && clone.max_images !== null && clone.max_images !== '')
    clone.max_images = Number(clone.max_images);
  return clone;
};

// ─── FORMAT HELPERS ────────────────────────────────────────────────────────────

const fmtDate = (value) => {
  if (!value) return '—';

  // Nếu ngày có dạng YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }

  // Nếu là Date object hoặc chuỗi dạng Tue Apr 28...
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const fmtTime = (value) => {
  if (!value) return '—';

  const text = String(value).trim();

  // Nếu giờ dạng 07:00:00 hoặc 07:00
  if (/^\d{1,2}:\d{2}/.test(text)) {
    const [h, m] = text.split(':');
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  // Nếu là Date object hoặc ISO datetime
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const TRANG_THAI_LABEL = {
  co_mat: '✅ Có mặt',
  di_muon: '⏰ Đi muộn',
  vang: '❌ Vắng',
  vang_co_phep: '📋 Vắng có phép',
  chua_diem_danh: '⬜ Chưa điểm danh',
  dang_dien_ra: '🟢 Đang diễn ra',
  da_ket_thuc: '🔴 Đã kết thúc',
  chua_dien_ra: '⚪ Chưa diễn ra',
  dang_mo: '🟢 Đang mở',
  da_dong: '🔴 Đã đóng',
  hoat_dong: '🟢 Hoạt động',
  khoa: '🔴 Khóa',
};

const labelOf = (val) => TRANG_THAI_LABEL[val] || val || '—';

/**
 * Render a markdown-style table.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {number} [maxRows=50]
 */
const mdTable = (headers, rows, maxRows = 50) => {
  if (!rows.length) return '_Không có dữ liệu._';
  const truncated = rows.length > maxRows;
  const display = rows.slice(0, maxRows);

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...display.map((r) => String(r[i] ?? '').length))
  );

  const pad = (s, w) => String(s ?? '').padEnd(w);
  const sep = widths.map((w) => '-'.repeat(w)).join(' | ');
  const head = headers.map((h, i) => pad(h, widths[i])).join(' | ');

  const body = display.map((r) => r.map((c, i) => pad(c, widths[i])).join(' | ')).join('\n');

  return [`| ${head} |`, `| ${sep} |`, ...display.map((r) => `| ${r.map((c, i) => pad(c, widths[i])).join(' | ')} |`)]
    .join('\n')
    .concat(truncated ? `\n\n_... và ${rows.length - maxRows} hàng khác._` : '');
};

// ─── DATA FORMATTERS ───────────────────────────────────────────────────────────

const formatters = {
  // Danh sách lớp học phần
  ADMIN_GET_CLASS_SECTIONS(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Không có lớp học phần nào.';
    const rows = items.map((l) => [
      l.ma_lop_hp,
      l.ten_mon || '—',
      l.ten_giang_vien || '—',
      `HK${l.hoc_ky} / ${l.nam_hoc}`,
      l.phong_hoc || '—',
      labelOf(l.trang_thai),
    ]);
    return `📚 **Danh sách lớp học phần** (${items.length} lớp)\n\n` +
      mdTable(['Mã lớp HP', 'Môn học', 'Giảng viên', 'Học kỳ / Năm', 'Phòng', 'Trạng thái'], rows);
  },

  ADMIN_GET_STUDENTS(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Không có sinh viên nào.';
    const rows = items.map((s) => [
      s.ma_sv,
      s.ho_ten || '—',
      s.ten_lop || s.ma_lop || '—',
      s.email || '—',
      s.sdt || '—',
    ]);
    return `🎓 **Danh sách sinh viên** (${items.length} SV)\n\n` +
      mdTable(['Mã SV', 'Họ tên', 'Lớp', 'Email', 'SĐT'], rows);
  },

  ADMIN_GET_LECTURERS(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Không có giảng viên nào.';
    const rows = items.map((g) => [
      g.ma_gv,
      g.ho_ten || '—',
      g.ten_khoa || g.ma_khoa || '—',
      g.email || '—',
      g.sdt || '—',
    ]);
    return `👨‍🏫 **Danh sách giảng viên** (${items.length} GV)\n\n` +
      mdTable(['Mã GV', 'Họ tên', 'Khoa', 'Email', 'SĐT'], rows);
  },

  ADMIN_GET_SUBJECTS(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Không có môn học nào.';
    const rows = items.map((m) => [
      m.ma_mon,
      m.ten_mon || '—',
      m.so_tin_chi ?? '—',
      m.so_tiet ?? '—',
    ]);
    return `📖 **Danh sách môn học** (${items.length} môn)\n\n` +
      mdTable(['Mã môn', 'Tên môn', 'Tín chỉ', 'Số tiết'], rows);
  },

  ADMIN_GET_KHOA(data) {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) return '📭 Không có khoa nào.';
    const rows = items.map((k) => [k.ma_khoa, k.ten_khoa || '—']);
    return `🏛️ **Danh sách khoa** (${items.length} khoa)\n\n` +
      mdTable(['Mã khoa', 'Tên khoa'], rows);
  },

  ADMIN_GET_LOP_SV(data) {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) return '📭 Không có lớp sinh viên nào.';
    const rows = items.map((l) => [l.ma_lop, l.ten_lop || '—', l.ten_khoa || '—']);
    return `🏫 **Danh sách lớp sinh viên** (${items.length} lớp)\n\n` +
      mdTable(['Mã lớp', 'Tên lớp', 'Khoa'], rows);
  },

  GV_GET_MY_CLASSES(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Bạn chưa được phân công lớp nào.';
    const rows = items.map((l) => [
      l.ma_lop_hp,
      l.ten_mon || '—',
      `HK${l.hoc_ky} / ${l.nam_hoc}`,
      l.phong_hoc || '—',
      l.tong_sinh_vien ?? '—',
      l.tong_buoi_hoc ?? '—',
    ]);
    return `📚 **Lớp học phần của bạn** (${items.length} lớp)\n\n` +
      mdTable(['Mã lớp HP', 'Môn học', 'Học kỳ / Năm', 'Phòng', 'Sĩ số', 'Số buổi'], rows);
  },

  GV_GET_CLASS_DETAIL(data) {
    if (!data) return '📭 Không tìm thấy lớp học phần.';
    const info = data.thong_tin_lop || data;
    const svList = data.danh_sach_sinh_vien || [];
    let out = `📋 **Chi tiết lớp: ${info.ma_lop_hp}**\n\n`;
    out += `- **Môn học:** ${info.ten_mon || '—'} (${info.ma_mon || '—'})\n`;
    out += `- **Học kỳ / Năm:** HK${info.hoc_ky} / ${info.nam_hoc}\n`;
    out += `- **Phòng học:** ${info.phong_hoc || '—'}\n`;
    out += `- **Sĩ số:** ${svList.length} sinh viên\n`;
    out += `- **Tổng buổi:** ${info.tong_buoi_hoc ?? '—'}\n\n`;
    if (svList.length) {
      const rows = svList.map((s, i) => [String(i + 1), s.ma_sv, s.ho_ten || '—', s.ten_lop || '—']);
      out += `**Danh sách sinh viên:**\n\n` + mdTable(['#', 'Mã SV', 'Họ tên', 'Lớp'], rows);
    }
    return out;
  },

  GV_GET_CLASS_SESSIONS(data) {
    if (!data) return '📭 Không có dữ liệu buổi học.';
    const lop = data.lop_hoc_phan || {};
    const items = data.danh_sach_buoi_hoc || [];
    if (!items.length) return `📭 Lớp **${lop.ma_lop_hp || ''}** chưa có buổi học nào.`;

    let out = `📅 **Danh sách buổi học — ${lop.ma_lop_hp || ''} (${lop.ten_mon || ''})** · ${items.length} buổi\n\n`;
    const rows = items.map((b) => [
      String(b.id_buoi),
      fmtDate(b.ngay_hoc),
      `${fmtTime(b.gio_bat_dau)} – ${fmtTime(b.gio_ket_thuc)}`,
      b.phong_hoc || lop.phong_hoc || '—',
      labelOf(b.trang_thai),
    ]);
    out += mdTable(['ID buổi', 'Ngày học', 'Giờ học', 'Phòng', 'Trạng thái'], rows);
    return out;
  },

  GV_GET_ATTENDANCE_HISTORY(data) {
    const items = Array.isArray(data) ? data :
      data?.xem_truoc || data?.danh_sach || [];
    const total = data?.tong_so_dong ?? items.length;
    if (!items.length) return '📭 Chưa có lịch sử điểm danh nào.';

    const rows = items.map((b) => [
      String(b.id_buoi),
      b.ma_lop_hp || '—',
      b.ten_mon || '—',
      fmtDate(b.ngay_hoc),
      `${fmtTime(b.gio_bat_dau)} – ${fmtTime(b.gio_ket_thuc)}`,
      labelOf(b.trang_thai),
      b.so_co_mat != null ? `✅ ${b.so_co_mat}` : '—',
      b.so_vang != null ? `❌ ${b.so_vang}` : '—',
    ]);

    return `📅 **Lịch sử điểm danh** (${total} buổi)\n\n` +
      mdTable(['ID', 'Mã lớp HP', 'Môn', 'Ngày', 'Giờ', 'Trạng thái', 'Có mặt', 'Vắng'], rows);
  },

  GV_GET_SESSION_ATTENDANCE(data) {
    if (!data) return '📭 Không có dữ liệu điểm danh.';

    // getSessionAttendance trả về: { buoi_hoc, lop_hoc_phan, danh_sach_sinh_vien, thong_ke, diem_danh_gan_day }
    const list = data.danh_sach_sinh_vien || data.danh_sach_diem_danh || data.danh_sach || [];
    const buoi = data.buoi_hoc || data.thong_tin_buoi || {};
    const lop = data.lop_hoc_phan || {};
    const tk = data.thong_ke || {};

    let out = '';
    if (buoi.id_buoi || lop.ma_lop_hp) {
      out += `📋 **Điểm danh buổi #${buoi.id_buoi || '?'}** — ${lop.ma_lop_hp || buoi.ma_lop_hp || ''} | ${fmtDate(buoi.ngay_hoc)} ${fmtTime(buoi.gio_bat_dau)}–${fmtTime(buoi.gio_ket_thuc)}\n\n`;
    }

    const coMat = tk.co_mat ?? list.filter((x) => (x.trang_thai_hom_nay || x.trang_thai) === 'co_mat').length;
    const diMuon = tk.di_muon ?? list.filter((x) => (x.trang_thai_hom_nay || x.trang_thai) === 'di_muon').length;
    const vang = tk.vang ?? list.filter((x) => (x.trang_thai_hom_nay || x.trang_thai) === 'vang').length;
    const phep = tk.vang_co_phep ?? list.filter((x) => (x.trang_thai_hom_nay || x.trang_thai) === 'vang_co_phep').length;
    const chua = tk.chua_diem_danh ?? list.filter((x) => !(x.trang_thai_hom_nay || x.trang_thai)).length;

    out += `**Thống kê:** ✅ ${coMat} có mặt | ⏰ ${diMuon} đi muộn | ❌ ${vang} vắng | 📋 ${phep} vắng phép | ⬜ ${chua} chưa\n\n`;

    if (list.length) {
      const rows = list.map((s, i) => [
        String(i + 1),
        s.ma_sv || '—',
        s.ho_ten || '—',
        labelOf((s.trang_thai_hom_nay || s.trang_thai) ?? 'chua_diem_danh'),
        s.thoi_gian_hom_nay || s.thoi_gian
          ? fmtTime(String(s.thoi_gian_hom_nay || s.thoi_gian).slice(11, 16))
          : '—',
        s.phuong_thuc || '—',
      ]);
      out += mdTable(['#', 'Mã SV', 'Họ tên', 'Trạng thái', 'Giờ vào', 'Phương thức'], rows);
    }
    return out;
  },

  ADMIN_GET_REGISTRATIONS(data) {
    const items = Array.isArray(data) ? data : data?.danh_sach || [];
    if (!items.length) return '📭 Lớp học phần chưa có sinh viên đăng ký.';
    const rows = items.map((s, i) => [
      String(i + 1),
      s.ma_sv,
      s.ho_ten || '—',
      s.ten_lop || '—',
      labelOf(s.trang_thai),
    ]);
    return `👥 **Danh sách sinh viên đăng ký** (${items.length} SV)\n\n` +
      mdTable(['#', 'Mã SV', 'Họ tên', 'Lớp', 'Trạng thái'], rows);
  },

  GV_GET_ATTENDANCE_HISTORY_DETAIL(data) {
    if (!data) return '📭 Không có dữ liệu điểm danh cho buổi học này.';
    const info = data.thong_tin_buoi_hoc || {};
    const list = data.danh_sach_sinh_vien || [];
    const tk = info.thong_ke || {};

    let out = `📋 **Chi tiết điểm danh buổi #${info.id_buoi || '?'}**\n\n`;
    out += `- **Lớp học phần:** ${info.ma_lop_hp || '—'} — ${info.ten_mon || '—'}\n`;
    out += `- **Ngày học:** ${fmtDate(info.ngay_hoc)}   **Giờ:** ${fmtTime(info.gio_bat_dau)} – ${fmtTime(info.gio_ket_thuc)}\n`;
    out += `- **Trạng thái buổi:** ${labelOf(info.trang_thai)}\n\n`;

    const coMat = tk.co_mat ?? list.filter((x) => x.trang_thai === 'co_mat').length;
    const diMuon = tk.di_muon ?? list.filter((x) => x.trang_thai === 'di_muon').length;
    const vang = tk.vang ?? list.filter((x) => x.trang_thai === 'vang').length;
    const phep = tk.vang_co_phep ?? list.filter((x) => x.trang_thai === 'vang_co_phep').length;
    const chua = list.filter((x) => !x.trang_thai).length;

    out += `**Thống kê:** ✅ ${coMat} có mặt | ⏰ ${diMuon} đi muộn | ❌ ${vang} vắng | 📋 ${phep} vắng phép`;
    if (chua > 0) out += ` | ⬜ ${chua} chưa điểm danh`;
    out += `\n\n`;

    if (list.length) {
      const rows = list.map((s, i) => [
        String(i + 1),
        s.ma_sv || '—',
        s.ho_ten || '—',
        s.ten_lop || s.ma_lop || '—',
        labelOf(s.trang_thai || 'chua_diem_danh'),
        s.thoi_gian ? fmtTime(String(s.thoi_gian).slice(11, 16)) : '—',
        s.phuong_thuc || '—',
      ]);
      out += mdTable(
        ['#', 'Mã SV', 'Họ tên', 'Lớp', 'Trạng thái', 'Giờ vào', 'Phương thức'],
        rows
      );
    }
    return out;
  },

  GV_GET_ACTIVE_SESSION(data) {
    if (!data || !data.id_buoi) return '📭 Hiện không có phiên điểm danh nào đang hoạt động.';
    let out = `🟢 **Phiên điểm danh đang hoạt động**\n\n`;
    out += `- **Buổi học:** #${data.id_buoi}\n`;
    out += `- **Lớp:** ${data.ma_lop_hp || '—'}\n`;
    out += `- **Bắt đầu lúc:** ${data.thoi_gian_bat_dau ? fmtTime(String(data.thoi_gian_bat_dau).slice(11, 16)) : '—'}\n`;
    out += `- **Camera:** ${data.camera_url || '—'}\n`;
    return out;
  },

  // Fallback cho các action tạo/cập nhật đơn giản
  _default(action, data) {
    if (!data) return null;
    // Nếu là object đơn giản (không phải mảng), hiển thị key-value
    if (typeof data === 'object' && !Array.isArray(data)) {
      const entries = Object.entries(data).filter(
        ([, v]) => v !== null && v !== undefined && typeof v !== 'object'
      );
      if (entries.length) {
        return entries.map(([k, v]) => `- **${k}:** ${v}`).join('\n');
      }
    }
    return null;
  },
};

/**
 * Format dữ liệu trả về thành chuỗi dễ đọc.
 */
const formatData = (action, data) => {
  const fn = formatters[action];
  if (fn) return fn(data);
  return formatters._default(action, data);
};

// ─── GEMINI CLIENT ─────────────────────────────────────────────────────────────

let cachedClient = null;

const getGeminiClient = async () => {
  if (!process.env.GEMINI_API_KEY)
    throw createError(500, 'Thiếu GEMINI_API_KEY trong file .env');
  if (!cachedClient) {
    const { GoogleGenAI } = await import('@google/genai');
    cachedClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return cachedClient;
};

const parseGeminiJson = (text) => {
  if (!text) throw createError(500, 'Gemini không trả về nội dung');
  let cleaned = String(text).trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw createError(500, `Không đọc được JSON từ Gemini: ${cleaned.slice(0, 300)}`);
  }
};

// ─── CONTEXT BUILDERS ──────────────────────────────────────────────────────────

const buildAdminContext = async () => {
  const [students, lecturers, subjects, classes, khoa, lopSv] = await Promise.all([
    AdminService.getSinhViens({ search: '' }),
    AdminService.getGiangViens({ search: '' }),
    AdminService.getMonHocs({ search: '' }),
    AdminService.getLopHocPhans({ search: '', hoc_ky: '', nam_hoc: '' }),
    AdminService.getKhoa(),
    AdminService.getLopSv(),
  ]);

  return {
    role: 'admin',
    sinh_vien: compactList(students, (s) => ({ ma_sv: s.ma_sv, ho_ten: s.ho_ten, ma_lop: s.ma_lop })),
    giang_vien: compactList(lecturers, (g) => ({ ma_gv: g.ma_gv, ho_ten: g.ho_ten, ma_khoa: g.ma_khoa })),
    mon_hoc: compactList(subjects, (m) => ({ ma_mon: m.ma_mon, ten_mon: m.ten_mon, so_tin_chi: m.so_tin_chi })),
    lop_hoc_phan: compactList(classes, (l) => ({
      ma_lop_hp: l.ma_lop_hp, ma_mon: l.ma_mon, ten_mon: l.ten_mon,
      ma_gv: l.ma_gv, hoc_ky: l.hoc_ky, nam_hoc: l.nam_hoc,
    })),
    khoa: compactList(khoa, (k) => ({ ma_khoa: k.ma_khoa, ten_khoa: k.ten_khoa })),
    lop_sv: compactList(lopSv, (l) => ({ ma_lop: l.ma_lop, ten_lop: l.ten_lop, ma_khoa: l.ma_khoa })),
  };
};

const buildLecturerContext = async (ma_gv) => {
  const classes = await GiangVienService.getMyClasses(ma_gv);
  const sessions = [];

  for (const item of classes.slice(0, 30)) {
    try {
      const detail = await GiangVienService.getMyClassSessions(ma_gv, item.ma_lop_hp);
      (detail.danh_sach_buoi_hoc || []).forEach((s) => {
        sessions.push({
          id_buoi: s.id_buoi, ma_lop_hp: s.ma_lop_hp,
          ngay_hoc: s.ngay_hoc, gio_bat_dau: s.gio_bat_dau,
          gio_ket_thuc: s.gio_ket_thuc, trang_thai: s.trang_thai,
          ten_mon: item.ten_mon,
        });
      });
    } catch (_) { }
  }

  return {
    role: 'giang_vien',
    lop_hoc_phan_cua_toi: compactList(classes, (l) => ({
      ma_lop_hp: l.ma_lop_hp, ten_mon: l.ten_mon,
      hoc_ky: l.hoc_ky, nam_hoc: l.nam_hoc,
      phong_hoc: l.phong_hoc, tong_sinh_vien: l.tong_sinh_vien,
    })),
    buoi_hoc: compactList(sessions, (s) => s, 120),
  };
};

const buildContext = async (user) => {
  if (user.vai_tro === 'admin') return buildAdminContext();
  if (user.vai_tro === 'giang_vien') return buildLecturerContext(user.ma_gv);
  throw createError(403, 'Vai trò không được hỗ trợ');
};

// ─── ACTIONS ───────────────────────────────────────────────────────────────────

const ACTIONS = {
  // Giảng viên
  GV_GET_MY_CLASSES: { role: 'giang_vien', required: [] },
  GV_GET_CLASS_DETAIL: { role: 'giang_vien', required: ['ma_lop_hp'] },
  GV_GET_CLASS_SESSIONS: { role: 'giang_vien', required: ['ma_lop_hp'] },
  GV_CREATE_SESSION: { role: 'giang_vien', required: ['ma_lop_hp', 'ngay_hoc', 'gio_bat_dau', 'gio_ket_thuc'] },
  GV_OPEN_ATTENDANCE: { role: 'giang_vien', required: ['id_buoi'] },
  GV_CLOSE_ATTENDANCE: { role: 'giang_vien', required: ['id_buoi'] },
  GV_START_ATTENDANCE: { role: 'giang_vien', required: ['id_buoi', 'camera_url'] },
  GV_STOP_ATTENDANCE: { role: 'giang_vien', required: [] },
  GV_GET_ACTIVE_SESSION: { role: 'giang_vien', required: [] },
  GV_MARK_ATTENDANCE: { role: 'giang_vien', required: ['id_buoi', 'ma_sv', 'trang_thai'] },
  GV_GET_ATTENDANCE_HISTORY: { role: 'giang_vien', required: [] },
  GV_GET_SESSION_ATTENDANCE: { role: 'giang_vien', required: ['id_buoi'] },
  GV_GET_ATTENDANCE_HISTORY_DETAIL: { role: 'giang_vien', required: ['id_buoi'] },

  // Admin – xem
  ADMIN_GET_CLASS_SECTIONS: { role: 'admin', required: [] },
  ADMIN_GET_STUDENTS: { role: 'admin', required: [] },
  ADMIN_GET_LECTURERS: { role: 'admin', required: [] },
  ADMIN_GET_SUBJECTS: { role: 'admin', required: [] },
  ADMIN_GET_KHOA: { role: 'admin', required: [] },
  ADMIN_GET_LOP_SV: { role: 'admin', required: [] },
  ADMIN_GET_CLASS_DETAIL: { role: 'admin', required: ['ma_lop_hp'] },
  ADMIN_GET_STUDENT_DETAIL: { role: 'admin', required: ['ma_sv'] },
  ADMIN_GET_LECTURER_DETAIL: { role: 'admin', required: ['ma_gv'] },
  ADMIN_GET_REGISTRATIONS: { role: 'admin', required: ['ma_lop_hp'] },
  ADMIN_GET_FACE_DASHBOARD: { role: 'admin', required: [] },

  // Admin – tạo/cập nhật
  ADMIN_CREATE_STUDENT: { role: 'admin', required: ['ma_sv', 'ho_ten', 'ma_lop'] },
  ADMIN_CREATE_LECTURER: { role: 'admin', required: ['ma_gv', 'ho_ten', 'ma_khoa'] },
  ADMIN_CREATE_SUBJECT: { role: 'admin', required: ['ma_mon', 'ten_mon', 'so_tin_chi', 'so_tiet'] },
  ADMIN_CREATE_CLASS_SECTION: { role: 'admin', required: ['ma_lop_hp', 'ma_mon', 'hoc_ky', 'nam_hoc'] },
  ADMIN_UPDATE_STUDENT: { role: 'admin', required: ['ma_sv'] },
  ADMIN_UPDATE_LECTURER: { role: 'admin', required: ['ma_gv'] },
  ADMIN_ASSIGN_LECTURER: { role: 'admin', required: ['ma_lop_hp', 'ma_gv'] },
  ADMIN_REGISTER_STUDENT: { role: 'admin', required: ['ma_lop_hp', 'ma_sv'] },
  ADMIN_CANCEL_REGISTRATION: { role: 'admin', required: ['ma_lop_hp', 'ma_sv'] },
  ADMIN_CREATE_STUDENT_ACCOUNT: { role: 'admin', required: ['ma_sv', 'mat_khau'] },
  ADMIN_CREATE_LECTURER_ACCOUNT: { role: 'admin', required: ['ma_gv', 'mat_khau'] },
  ADMIN_COLLECT_FACE_DATA: { role: 'admin', required: ['ma_sv', 'camera_url'] },
  ADMIN_TRAIN_FACE_DATA: { role: 'admin', required: [] },
  ADMIN_SYNC_FACE_DATA: { role: 'admin', required: [] },
  ADMIN_DELETE_STUDENT: { role: 'admin', required: ['ma_sv'] },
  ADMIN_DELETE_LECTURER: { role: 'admin', required: ['ma_gv'] },
  ADMIN_DELETE_CLASS_SECTION: { role: 'admin', required: ['ma_lop_hp'] },

  NONE: { role: 'all', required: [] },
};

// ─── PROMPT ────────────────────────────────────────────────────────────────────

const buildPrompt = ({ user, message, history, context }) => `
Bạn là bộ phân tích ý định cho trợ lý chatbot của hệ thống điểm danh sinh viên bằng nhận diện khuôn mặt.

Nhiệm vụ:
- Chuyển câu nói tự nhiên của người dùng thành JSON để backend thực thi đúng action.
- Người dùng nói tiếng Việt, bạn phải hiểu ý định và chọn action phù hợp.

NGÀY HIỆN TẠI THEO VIỆT NAM: ${getTodayVietnam()}.
VAI TRÒ NGƯỜI DÙNG: ${user.vai_tro}.
MÃ GIẢNG VIÊN NẾU CÓ: ${user.ma_gv || ''}.

QUY TẮC BẮT BUỘC:
1. Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.
2. Không được tự bịa mã lớp, mã môn, mã giảng viên, mã sinh viên, id_buoi.
3. Chỉ map mã từ context nếu chắc chắn duy nhất.
4. Nếu thiếu thông tin để thực thi, đặt should_execute=false, liệt kê missing_fields và viết reply để hỏi lại người dùng.
5. Nếu người dùng yêu cầu chức năng ngoài vai trò, đặt should_execute=false và reply nói không có quyền.
6. Date trả về dạng YYYY-MM-DD.
7. Giờ trả về HH:mm:ss.
8. Với điểm danh thủ công, trang_thai chỉ dùng: co_mat, di_muon, vang, vang_co_phep.
9. Nếu chỉ hỏi hướng dẫn/chức năng, action=NONE, should_execute=false và reply trả lời ngắn gọn bằng markdown có emoji.
10. Payload chỉ chứa field cần cho action, không thêm field thừa.
11. Khi người dùng hỏi xem điểm danh realtime/đang diễn ra của 1 buổi, dùng GV_GET_SESSION_ATTENDANCE.
12. Khi người dùng hỏi xem chi tiết lịch sử, danh sách vắng/có mặt của 1 buổi đã diễn ra, dùng GV_GET_ATTENDANCE_HISTORY_DETAIL.
13. Khi admin hỏi xem sinh viên trong lớp học phần, dùng ADMIN_GET_REGISTRATIONS.
14. Khi admin muốn xem chi tiết 1 sinh viên/giảng viên/lớp HP, dùng action _DETAIL tương ứng.
15. Khi admin muốn xóa, dùng action DELETE tương ứng và thêm confirm=true vào payload nếu người dùng đã xác nhận.

DANH SÁCH ACTION HỢP LỆ:
${Object.entries(ACTIONS)
    .map(([name, cfg]) => `- ${name}: role=${cfg.role}, required=${cfg.required.join(', ') || 'none'}`)
    .join('\n')}

JSON OUTPUT SCHEMA:
{
  "action": "ONE_ACTION_NAME",
  "should_execute": true,
  "missing_fields": [],
  "payload": {},
  "reply": "câu trả lời tiếng Việt cho người dùng"
}

CONTEXT DỮ LIỆU ĐƯỢC PHÉP DÙNG:
${JSON.stringify(context, null, 2)}

LỊCH SỬ CHAT GẦN ĐÂY:
${JSON.stringify(history.slice(-8), null, 2)}

TIN NHẮN MỚI NHẤT CỦA NGƯỜI DÙNG:
${message}
`;

// ─── PLAN + VALIDATE + EXECUTE ────────────────────────────────────────────────

const planWithGemini = async ({ user, message, history, context }) => {
  const ai = await getGeminiClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt({ user, message, history, context }),
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const plan = parseGeminiJson(response.text);
  plan.action = plan.action || 'NONE';
  plan.payload = normalizePayload(plan.payload || {});
  plan.missing_fields = Array.isArray(plan.missing_fields) ? plan.missing_fields : [];
  plan.should_execute = Boolean(plan.should_execute);
  plan.reply = plan.reply || '';
  return plan;
};

const validatePlan = (user, plan) => {
  const cfg = ACTIONS[plan.action];
  if (!cfg) throw createError(400, `Action không hợp lệ: ${plan.action}`);

  if (cfg.role !== 'all' && cfg.role !== user.vai_tro) {
    return { ...plan, should_execute: false, missing_fields: [], reply: 'Bạn không có quyền thực hiện chức năng này.' };
  }

  const missing = cfg.required.filter((field) => {
    const value = plan.payload?.[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length) {
    return { ...plan, should_execute: false, missing_fields: missing, reply: plan.reply || `Bạn vui lòng bổ sung: ${missing.join(', ')}` };
  }
  return plan;
};

const executeAction = async (user, action, payload) => {
  switch (action) {
    // ── Giảng viên ──
    case 'GV_GET_MY_CLASSES':
      return GiangVienService.getMyClasses(user.ma_gv);
    case 'GV_GET_CLASS_DETAIL':
      return GiangVienService.getMyClassDetail(user.ma_gv, payload.ma_lop_hp);
    case 'GV_GET_CLASS_SESSIONS':
      return GiangVienService.getMyClassSessions(user.ma_gv, payload.ma_lop_hp);
    case 'GV_CREATE_SESSION':
      return GiangVienService.createSession(user.ma_gv, {
        ma_lop_hp: payload.ma_lop_hp,
        ngay_hoc: payload.ngay_hoc,
        gio_bat_dau: payload.gio_bat_dau,
        gio_ket_thuc: payload.gio_ket_thuc,
        trang_thai: payload.trang_thai || 'chua_dien_ra',
      });
    case 'GV_OPEN_ATTENDANCE':
      return GiangVienService.openAttendance(user.ma_gv, Number(payload.id_buoi));
    case 'GV_CLOSE_ATTENDANCE':
      return GiangVienService.closeAttendance(user.ma_gv, Number(payload.id_buoi));
    case 'GV_START_ATTENDANCE':
      return GiangVienService.startAttendanceSession(user.ma_gv, {
        id_buoi: Number(payload.id_buoi),
        camera_url: payload.camera_url,
      });
    case 'GV_STOP_ATTENDANCE':
      return GiangVienService.stopAttendanceSession(user.ma_gv);
    case 'GV_GET_ACTIVE_SESSION':
      return GiangVienService.getActiveAttendanceSession(user.ma_gv);
    case 'GV_MARK_ATTENDANCE':
      return GiangVienService.upsertAttendance(user.ma_gv, Number(payload.id_buoi), {
        id_buoi: Number(payload.id_buoi),
        ma_sv: payload.ma_sv,
        trang_thai: payload.trang_thai,
        thoi_gian: payload.thoi_gian,
        do_tin_cay: payload.do_tin_cay,
        phuong_thuc: payload.phuong_thuc || 'thu_cong',
        ghi_chu: payload.ghi_chu,
      });
    case 'GV_GET_ATTENDANCE_HISTORY':
      return GiangVienService.getAttendanceHistory(user.ma_gv, payload.search || '');
    case 'GV_GET_SESSION_ATTENDANCE':
      return GiangVienService.getSessionAttendance(user.ma_gv, Number(payload.id_buoi));
    case 'GV_GET_ATTENDANCE_HISTORY_DETAIL':
      return GiangVienService.getAttendanceHistoryBySession(user.ma_gv, Number(payload.id_buoi));

    // ── Admin – xem ──
    case 'ADMIN_GET_CLASS_SECTIONS':
      return AdminService.getLopHocPhans({ search: payload.search || '', hoc_ky: payload.hoc_ky || '', nam_hoc: payload.nam_hoc || '' });
    case 'ADMIN_GET_STUDENTS':
      return AdminService.getSinhViens({ search: payload.search || '' });
    case 'ADMIN_GET_LECTURERS':
      return AdminService.getGiangViens({ search: payload.search || '' });
    case 'ADMIN_GET_SUBJECTS':
      return AdminService.getMonHocs({ search: payload.search || '' });
    case 'ADMIN_GET_KHOA':
      return AdminService.getKhoa();
    case 'ADMIN_GET_LOP_SV':
      return AdminService.getLopSv();
    case 'ADMIN_GET_CLASS_DETAIL':
      return AdminService.getLopHocPhanById(payload.ma_lop_hp);
    case 'ADMIN_GET_STUDENT_DETAIL':
      return AdminService.getSinhVienById(payload.ma_sv);
    case 'ADMIN_GET_LECTURER_DETAIL':
      return AdminService.getGiangVienById(payload.ma_gv);
    case 'ADMIN_GET_REGISTRATIONS':
      return AdminService.getRegistrationsByClassSection(payload.ma_lop_hp);
    case 'ADMIN_GET_FACE_DASHBOARD':
      return AdminService.getFaceDataDashboard(payload);

    // ── Admin – tạo/cập nhật ──
    case 'ADMIN_CREATE_STUDENT':
      return AdminService.createSinhVien(payload);
    case 'ADMIN_CREATE_LECTURER':
      return AdminService.createGiangVien(payload);
    case 'ADMIN_CREATE_SUBJECT':
      return AdminService.createMonHoc(payload);
    case 'ADMIN_CREATE_CLASS_SECTION':
      return AdminService.createLopHocPhan({ ...payload, trang_thai: payload.trang_thai || 'dang_mo' });
    case 'ADMIN_UPDATE_STUDENT':
      return AdminService.updateSinhVien(payload.ma_sv, payload);
    case 'ADMIN_UPDATE_LECTURER':
      return AdminService.updateGiangVien(payload.ma_gv, payload);
    case 'ADMIN_ASSIGN_LECTURER':
      return AdminService.assignGiangVien(payload.ma_lop_hp, payload.ma_gv);
    case 'ADMIN_REGISTER_STUDENT':
      return AdminService.registerStudentToClassSection(payload.ma_lop_hp, { ma_sv: payload.ma_sv });
    case 'ADMIN_CANCEL_REGISTRATION':
      return AdminService.cancelStudentRegistration(payload.ma_lop_hp, payload.ma_sv);
    case 'ADMIN_CREATE_STUDENT_ACCOUNT':
      return AdminService.createStudentAccount(payload.ma_sv, { mat_khau: payload.mat_khau });
    case 'ADMIN_CREATE_LECTURER_ACCOUNT':
      return AdminService.createLecturerAccount(payload.ma_gv, { mat_khau: payload.mat_khau });
    case 'ADMIN_COLLECT_FACE_DATA':
      return AdminService.collectFaceData(payload.ma_sv, {
        camera_url: payload.camera_url,
        max_images: payload.max_images || 40,
        replace_old: payload.replace_old || false,
      });
    case 'ADMIN_TRAIN_FACE_DATA':
      return AdminService.trainFaceData();
    case 'ADMIN_SYNC_FACE_DATA':
      return AdminService.syncFaceDataFromDataset();
    case 'ADMIN_DELETE_STUDENT':
      return AdminService.deleteSinhVien(payload.ma_sv);
    case 'ADMIN_DELETE_LECTURER':
      return AdminService.deleteGiangVien(payload.ma_gv);
    case 'ADMIN_DELETE_CLASS_SECTION':
      return AdminService.deleteLopHocPhan(payload.ma_lop_hp);

    case 'NONE':
      return null;
    default:
      throw createError(400, `Chưa hỗ trợ action: ${action}`);
  }
};

// ─── SUCCESS MESSAGES ──────────────────────────────────────────────────────────

const SUCCESS_TEXT = {
  GV_GET_MY_CLASSES: 'Đây là danh sách lớp học phần của bạn.',
  GV_GET_CLASS_DETAIL: 'Đây là chi tiết lớp học phần.',
  GV_GET_CLASS_SESSIONS: 'Đây là danh sách buổi học.',
  GV_CREATE_SESSION: '✅ Đã tạo buổi học thành công.',
  GV_OPEN_ATTENDANCE: '🟢 Đã mở điểm danh cho buổi học.',
  GV_CLOSE_ATTENDANCE: '🔴 Đã kết thúc điểm danh cho buổi học.',
  GV_START_ATTENDANCE: '🎥 Đã bắt đầu phiên điểm danh bằng nhận diện khuôn mặt.',
  GV_STOP_ATTENDANCE: '⏹️ Đã dừng phiên điểm danh.',
  GV_GET_ACTIVE_SESSION: null, // handled by formatter
  GV_MARK_ATTENDANCE: '✅ Đã cập nhật điểm danh cho sinh viên.',
  GV_GET_ATTENDANCE_HISTORY: null,
  GV_GET_SESSION_ATTENDANCE: 'Đây là dữ liệu điểm danh của buổi học.',
  GV_GET_ATTENDANCE_HISTORY_DETAIL: 'Đây là chi tiết điểm danh của buổi học.',

  ADMIN_GET_CLASS_SECTIONS: null,
  ADMIN_GET_STUDENTS: null,
  ADMIN_GET_LECTURERS: null,
  ADMIN_GET_SUBJECTS: null,
  ADMIN_GET_KHOA: null,
  ADMIN_GET_LOP_SV: null,
  ADMIN_GET_CLASS_DETAIL: null,
  ADMIN_GET_STUDENT_DETAIL: null,
  ADMIN_GET_LECTURER_DETAIL: null,
  ADMIN_GET_REGISTRATIONS: null,
  ADMIN_GET_FACE_DASHBOARD: 'Đây là tổng quan dữ liệu khuôn mặt.',

  ADMIN_CREATE_STUDENT: '✅ Đã tạo sinh viên thành công.',
  ADMIN_CREATE_LECTURER: '✅ Đã tạo giảng viên thành công.',
  ADMIN_CREATE_SUBJECT: '✅ Đã tạo môn học thành công.',
  ADMIN_CREATE_CLASS_SECTION: '✅ Đã tạo lớp học phần thành công.',
  ADMIN_UPDATE_STUDENT: '✅ Đã cập nhật thông tin sinh viên.',
  ADMIN_UPDATE_LECTURER: '✅ Đã cập nhật thông tin giảng viên.',
  ADMIN_ASSIGN_LECTURER: '✅ Đã phân công giảng viên cho lớp học phần.',
  ADMIN_REGISTER_STUDENT: '✅ Đã đăng ký sinh viên vào lớp học phần.',
  ADMIN_CANCEL_REGISTRATION: '✅ Đã hủy đăng ký sinh viên khỏi lớp học phần.',
  ADMIN_CREATE_STUDENT_ACCOUNT: '✅ Đã tạo tài khoản sinh viên thành công.',
  ADMIN_CREATE_LECTURER_ACCOUNT: '✅ Đã tạo tài khoản giảng viên thành công.',
  ADMIN_COLLECT_FACE_DATA: '📷 Đã bắt đầu/hoàn tất thu thập dữ liệu khuôn mặt.',
  ADMIN_TRAIN_FACE_DATA: '🤖 Đã train dữ liệu khuôn mặt thành công.',
  ADMIN_SYNC_FACE_DATA: '🔄 Đã đồng bộ dữ liệu khuôn mặt từ dataset.',
  ADMIN_DELETE_STUDENT: '🗑️ Đã xóa sinh viên thành công.',
  ADMIN_DELETE_LECTURER: '🗑️ Đã xóa giảng viên thành công.',
  ADMIN_DELETE_CLASS_SECTION: '🗑️ Đã xóa lớp học phần thành công.',
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

const AssistantService = {
  async chat({ user, message, history }) {
    if (!user?.vai_tro) throw createError(401, 'Chưa xác thực người dùng');

    const context = await buildContext(user);
    let plan = await planWithGemini({ user, message, history, context });
    plan = validatePlan(user, plan);

    if (!plan.should_execute || plan.action === 'NONE') {
      return {
        executed: false,
        action: plan.action,
        missing_fields: plan.missing_fields,
        payload: plan.payload,
        reply: plan.reply || 'Bạn cần mình hỗ trợ thao tác nào trong hệ thống điểm danh?',
        data: null,
        formatted: null,
      };
    }

    const data = await executeAction(user, plan.action, plan.payload);

    // Build formatted display text
    const formatted = formatData(plan.action, data);
    const baseReply = SUCCESS_TEXT[plan.action] ?? plan.reply ?? 'Đã thực hiện thành công.';

    return {
      executed: true,
      action: plan.action,
      missing_fields: [],
      payload: plan.payload,
      reply: baseReply,
      data,
      formatted, // Frontend nên render trường này thay vì data thô
    };
  },
};

module.exports = AssistantService;