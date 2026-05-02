const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const AdminModel = require('../models/Admin_Model');

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const normalizeEnvPath = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/^['\"]|['\"]$/g, '');
};

const getPythonBin = () => {
  const pythonBin = normalizeEnvPath(process.env.PYTHON_BIN);
  if (!pythonBin) throw createError('Thiếu cấu hình PYTHON_BIN trong .env', 500);
  return pythonBin;
};

const getPythonDir = () => {
  const pythonDir = normalizeEnvPath(process.env.PYTHON_DIR);
  if (!pythonDir) throw createError('Thiếu cấu hình PYTHON_DIR trong .env', 500);
  return pythonDir;
};

const getDatasetRoot = () => {
  const datasetDir = normalizeEnvPath(process.env.DATASET_DIR);
  return datasetDir ? path.resolve(getPythonDir(), datasetDir) : path.join(getPythonDir(), 'dataset');
};

const getFaceDbPath = () => {
  const dbFile = normalizeEnvPath(process.env.DB_FILE);
  return dbFile ? path.resolve(getPythonDir(), dbFile) : path.join(getPythonDir(), 'face_db.npz');
};

const getPythonScriptPath = (defaultScriptName) => {
  const configured = normalizeEnvPath(process.env.PYTHON_SCRIPT);
  if (configured && path.basename(configured) === defaultScriptName) {
    return path.resolve(getPythonDir(), configured);
  }
  return path.join(getPythonDir(), defaultScriptName);
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const isImageFile = (filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());

const listImageFiles = (folderPath) => {
  if (!fs.existsSync(folderPath)) return [];
  return fs.readdirSync(folderPath).filter(isImageFile).sort((a, b) => a.localeCompare(b));
};

const writeStudentMetaFile = (student, folderPath) => {
  ensureDir(folderPath);

  const payload = {
    ma_sv: student.ma_sv,
    ho_ten: student.ho_ten,
    email: student.email || null,
    sdt: student.sdt || null,
    ma_lop: student.ma_lop || null,
    ten_lop: student.ten_lop || null,
    ten_khoa: student.ten_khoa || null,
    khoa_hoc: student.khoa_hoc || null,
    updated_at: new Date().toISOString(),
  };

  const metaPath = path.join(folderPath, 'student.json');
  fs.writeFileSync(metaPath, JSON.stringify(payload, null, 2), 'utf8');
  return metaPath;
};

const readStudentMetaFile = (folderPath) => {
  const metaPath = path.join(folderPath, 'student.json');
  if (!fs.existsSync(metaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
};

const runPythonScript = ({ pythonBin, scriptPath, args = [], cwd, extraEnv = {} }) =>
  new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [scriptPath, ...args], {
      cwd,
      env: { ...process.env, ...extraEnv },
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => reject(new Error(`Không chạy được Python: ${err.message}`)));

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Script Python chạy thất bại (code ${code}).\n${stderr || stdout}`));
      }
      resolve({ stdout, stderr });
    });
  });

const buildFaceDashboardRow = (row) => {
  const datasetFolderName = row.dataset_path || row.ma_sv;
  const folderPath = path.join(getDatasetRoot(), datasetFolderName);
  const folderExists = fs.existsSync(folderPath);
  const imageFiles = folderExists ? listImageFiles(folderPath) : [];
  const meta = folderExists ? readStudentMetaFile(folderPath) : null;

  const dbActive = row.db_trang_thai === 'hoat_dong';
  const trained = Boolean(row.embedding_path && row.train_lan_cuoi);
  const ready = dbActive && folderExists && imageFiles.length > 0 && trained;

  let trang_thai_du_lieu = 'chua_co';
  if (ready) trang_thai_du_lieu = 'san_sang';
  else if (row.db_trang_thai === 'da_xoa') trang_thai_du_lieu = 'da_xoa';
  else if (row.db_trang_thai === 'loi_du_lieu') trang_thai_du_lieu = 'loi_du_lieu';
  else if (row.face_profile_id && !folderExists) trang_thai_du_lieu = 'mat_thu_muc';
  else if (folderExists && imageFiles.length === 0) trang_thai_du_lieu = 'thu_muc_rong';
  else if (!row.face_profile_id && folderExists) trang_thai_du_lieu = 'co_thu_muc_chua_db';
  else if (dbActive && folderExists && imageFiles.length > 0 && !trained) trang_thai_du_lieu = 'da_thu_thap_chua_train';

  return {
    ma_sv: row.ma_sv,
    ho_ten: row.ho_ten,
    email: row.email,
    sdt: row.sdt,
    ma_lop: row.ma_lop,
    ten_lop: row.ten_lop,
    ten_khoa: row.ten_khoa,
    khoa_hoc: row.khoa_hoc,
    face_profile_id: row.face_profile_id || null,
    face_id: row.face_id || row.ma_sv,
    dataset_path: datasetFolderName,
    embedding_path: row.embedding_path || null,
    db_trang_thai: row.db_trang_thai || null,
    co_du_lieu_khuon_mat: ready,
    de_xuat_them_khuon_mat: !ready,
    da_train_embedding: trained,
    trang_thai_du_lieu,
    so_anh_khuon_mat: imageFiles.length,
    so_anh_db: Number(row.so_anh || 0),
    lan_cap_nhat_cuoi: meta?.updated_at || row.face_ngay_cap_nhat || row.face_ngay_tao || null,
    thu_muc_du_lieu: folderExists ? folderPath : null,
  };
};

const syncDatasetToDatabase = async () => {
  const datasetRoot = getDatasetRoot();
  ensureDir(datasetRoot);

  const rows = await AdminModel.findFaceDashboard('');
  const synced = [];
  const invalid = [];

  for (const row of rows) {
    const datasetFolderName = row.dataset_path || row.ma_sv;
    const folderPath = path.join(datasetRoot, datasetFolderName);

    if (!fs.existsSync(folderPath)) continue;

    const imageFiles = listImageFiles(folderPath);
    if (!imageFiles.length) {
      await AdminModel.upsertFaceDataByStudent({
        ma_sv: row.ma_sv,
        face_id: row.ma_sv,
        dataset_path: datasetFolderName,
        embedding_path: null,
        so_anh: 0,
        trang_thai: 'loi_du_lieu',
      });

      invalid.push({ ma_sv: row.ma_sv, ly_do: 'Thư mục tồn tại nhưng không có ảnh hợp lệ' });
      continue;
    }

    writeStudentMetaFile(row, folderPath);

    await AdminModel.upsertFaceDataByStudent({
      ma_sv: row.ma_sv,
      face_id: row.ma_sv,
      dataset_path: datasetFolderName,
      embedding_path: row.embedding_path || null,
      so_anh: imageFiles.length,
      trang_thai: 'hoat_dong',
    });

    synced.push({ ma_sv: row.ma_sv, so_anh: imageFiles.length, thu_muc: folderPath });
  }

  return {
    message: 'Đã đồng bộ dataset vào database',
    so_sinh_vien_dong_bo: synced.length,
    danh_sach_dong_bo: synced,
    so_thu_muc_loi: invalid.length,
    danh_sach_loi: invalid,
  };
};

const AdminService = {
  /* ================= LOOKUP ================= */
  getKhoa: () => AdminModel.findAllKhoa(),
  getLopSv: () => AdminModel.findAllLopSvWithKhoa(),
  getSinhVienLookup: () => AdminModel.findAllSinhVienSimple(),
  getGiangVienLookup: () => AdminModel.findAllGiangVienSimple(),
  getMonHocLookup: () => AdminModel.findAllMonHocSimple(),

  /* ================= TAI KHOAN ================= */
  getTaiKhoans: (query) => AdminModel.findAccounts(query),

  async createAdminAccount({ ma_dang_nhap, mat_khau }) {
    const exists = await AdminModel.findAccountByLoginCode(ma_dang_nhap);
    if (exists) throw createError('Tài khoản đã tồn tại', 409);

    const mat_khau_hash = await bcrypt.hash(mat_khau, 10);
    return AdminModel.insertAccount({ ma_dang_nhap, mat_khau_hash, vai_tro: 'admin' });
  },

  async createStudentAccount(ma_sv, { mat_khau }) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);

    const exists = await AdminModel.findAccountByLoginCode(ma_sv);
    if (exists) throw createError('Sinh viên đã có tài khoản', 409);

    const mat_khau_hash = await bcrypt.hash(mat_khau, 10);
    return AdminModel.insertAccount({
      ma_dang_nhap: ma_sv,
      mat_khau_hash,
      vai_tro: 'sinh_vien',
      ma_sv,
      ma_gv: null,
    });
  },

  async createLecturerAccount(ma_gv, { mat_khau }) {
    const lecturer = await AdminModel.findGiangVienById(ma_gv);
    if (!lecturer) throw createError('Không tìm thấy giảng viên', 404);

    const exists = await AdminModel.findAccountByLoginCode(ma_gv);
    if (exists) throw createError('Giảng viên đã có tài khoản', 409);

    const mat_khau_hash = await bcrypt.hash(mat_khau, 10);
    return AdminModel.insertAccount({
      ma_dang_nhap: ma_gv,
      mat_khau_hash,
      vai_tro: 'giang_vien',
      ma_sv: null,
      ma_gv,
    });
  },

  async updateTaiKhoanStatus(id, { trang_thai }) {
    const account = await AdminModel.findAccountById(id);
    if (!account) throw createError('Không tìm thấy tài khoản', 404);
    return AdminModel.updateAccountStatus(id, trang_thai);
  },

  async changePassword(id, { mat_khau_moi }) {
    const account = await AdminModel.findAccountById(id);
    if (!account) throw createError('Không tìm thấy tài khoản', 404);

    const mat_khau_hash = await bcrypt.hash(mat_khau_moi, 10);
    return AdminModel.updateAccountPassword(id, mat_khau_hash);
  },

  async deleteTaiKhoan(id) {
    const account = await AdminModel.findAccountById(id);
    if (!account) throw createError('Không tìm thấy tài khoản', 404);
    return AdminModel.deleteAccount(id);
  },

  /* ================= SINH VIEN ================= */
  getSinhViens: (query) => AdminModel.findAllSinhVien(query),

  async getSinhVienById(ma_sv) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);
    return student;
  },

  createSinhVien: (payload) => AdminModel.insertSinhVien(payload),

  async updateSinhVien(ma_sv, payload) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);
    return AdminModel.updateSinhVien(ma_sv, payload);
  },

  async deleteSinhVien(ma_sv) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);
    return AdminModel.deleteSinhVien(ma_sv);
  },

  /* ================= GIANG VIEN ================= */
  getGiangViens: (query) => AdminModel.findAllGiangVien(query),

  async getGiangVienById(ma_gv) {
    const lecturer = await AdminModel.findGiangVienById(ma_gv);
    if (!lecturer) throw createError('Không tìm thấy giảng viên', 404);
    return lecturer;
  },

  createGiangVien: (payload) => AdminModel.insertGiangVien(payload),

  async updateGiangVien(ma_gv, payload) {
    const lecturer = await AdminModel.findGiangVienById(ma_gv);
    if (!lecturer) throw createError('Không tìm thấy giảng viên', 404);
    return AdminModel.updateGiangVien(ma_gv, payload);
  },

  async deleteGiangVien(ma_gv) {
    const lecturer = await AdminModel.findGiangVienById(ma_gv);
    if (!lecturer) throw createError('Không tìm thấy giảng viên', 404);
    return AdminModel.deleteGiangVien(ma_gv);
  },

  /* ================= MON HOC ================= */
  getMonHocs: (query) => AdminModel.findAllMonHoc(query),

  async getMonHocById(ma_mon) {
    const monHoc = await AdminModel.findMonHocById(ma_mon);
    if (!monHoc) throw createError('Không tìm thấy môn học', 404);
    return monHoc;
  },

  createMonHoc: (payload) => AdminModel.insertMonHoc(payload),

  async updateMonHoc(ma_mon, payload) {
    const monHoc = await AdminModel.findMonHocById(ma_mon);
    if (!monHoc) throw createError('Không tìm thấy môn học', 404);
    return AdminModel.updateMonHoc(ma_mon, payload);
  },

  async deleteMonHoc(ma_mon) {
    const monHoc = await AdminModel.findMonHocById(ma_mon);
    if (!monHoc) throw createError('Không tìm thấy môn học', 404);
    return AdminModel.deleteMonHoc(ma_mon);
  },

  /* ================= LOP HOC PHAN ================= */
  getLopHocPhans: (query) => AdminModel.findAllLopHocPhan(query),

  async getLopHocPhanById(ma_lop_hp) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);
    return lopHocPhan;
  },

  createLopHocPhan: (payload) => AdminModel.insertLopHocPhan(payload),

  async updateLopHocPhan(ma_lop_hp, payload) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);
    return AdminModel.updateLopHocPhan(ma_lop_hp, payload);
  },

  async deleteLopHocPhan(ma_lop_hp) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);
    return AdminModel.deleteLopHocPhan(ma_lop_hp);
  },

  async assignGiangVien(ma_lop_hp, ma_gv) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);

    const lecturer = await AdminModel.findGiangVienById(ma_gv);
    if (!lecturer) throw createError('Không tìm thấy giảng viên', 404);

    return AdminModel.assignLecturer(ma_lop_hp, ma_gv);
  },
  /* ================= ĐĂNG KÝ LỚP HỌC PHẦN ================= */
  async getRegistrationsByClassSection(ma_lop_hp) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);

    return AdminModel.findRegistrationsByClassSection(ma_lop_hp);
  },

  async registerStudentToClassSection(ma_lop_hp, { ma_sv }) {
    if (!ma_sv) throw createError('Thiếu mã sinh viên', 400);

    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);

    if (lopHocPhan.trang_thai === 'da_huy') {
      throw createError('Lớp học phần đã hủy, không thể đăng ký sinh viên', 400);
    }

    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);

    return AdminModel.insertRegistration({
      ma_sv,
      ma_lop_hp,
    });
  },

  async cancelStudentRegistration(ma_lop_hp, ma_sv) {
    const lopHocPhan = await AdminModel.findLopHocPhanById(ma_lop_hp);
    if (!lopHocPhan) throw createError('Không tìm thấy lớp học phần', 404);

    const registration = await AdminModel.findRegistration(ma_sv, ma_lop_hp);
    if (!registration) {
      throw createError('Sinh viên chưa đăng ký lớp học phần này', 404);
    }

    if (registration.trang_thai !== 'da_dang_ky') {
      throw createError('Đăng ký này không còn ở trạng thái hoạt động', 400);
    }

    return AdminModel.cancelRegistration(ma_sv, ma_lop_hp);
  },

  /* ================= DỮ LIỆU KHUÔN MẶT ================= */
  async syncFaceDataFromDataset() {
    return syncDatasetToDatabase();
  },

  async getFaceDataDashboard(query = {}) {
    const search = query.search || '';
    const onlyMissing = String(query.only_missing || 'false').toLowerCase() === 'true';

    const rows = await AdminModel.findFaceDashboard(search);
    const mapped = rows.map(buildFaceDashboardRow);
    return onlyMissing ? mapped.filter((item) => item.de_xuat_them_khuon_mat) : mapped;
  },

  async getFaceDataByStudent(ma_sv) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);

    const profile = await AdminModel.findFaceDataByStudent(ma_sv);
    const datasetFolderName = profile?.dataset_path || ma_sv;
    const folderPath = path.join(getDatasetRoot(), datasetFolderName);
    const folderExists = fs.existsSync(folderPath);
    const imageFiles = folderExists ? listImageFiles(folderPath) : [];
    const meta = folderExists ? readStudentMetaFile(folderPath) : null;

    return {
      sinh_vien: student,
      du_lieu_khuon_mat: profile || null,
      co_thu_muc_dataset: folderExists,
      thu_muc_du_lieu: folderExists ? folderPath : null,
      student_meta: meta,
      danh_sach_anh: imageFiles.map((file) => ({
        ten_file: file,
        duong_dan: path.join(folderPath, file),
      })),
      so_anh_khuon_mat: imageFiles.length,
    };
  },

  async collectFaceData(ma_sv, payload) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);

    const cameraUrl = payload.camera_url;
    const maxImages = Number(payload.max_images || 40);
    const replaceOld = String(payload.replace_old || 'false').toLowerCase() === 'true';
    if (!cameraUrl) throw createError('Thiếu camera_url', 400);

    const pythonBin = getPythonBin();
    const pythonDir = getPythonDir();
    const scriptPath = getPythonScriptPath('collect_data_cli.py');
    const datasetRoot = getDatasetRoot();
    const datasetFolderName = ma_sv;
    const studentFolderPath = path.join(datasetRoot, datasetFolderName);

    if (!fs.existsSync(scriptPath)) {
      throw createError(`Không tìm thấy file script: ${scriptPath}`, 500);
    }

    ensureDir(datasetRoot);
    if (replaceOld && fs.existsSync(studentFolderPath)) {
      fs.rmSync(studentFolderPath, { recursive: true, force: true });
    }

    await runPythonScript({
      pythonBin,
      scriptPath,
      args: ['--person-id', ma_sv, '--camera-url', cameraUrl, '--max-images', String(maxImages), '--dataset-dir', datasetRoot],
      cwd: pythonDir,
      extraEnv: { DATASET_DIR: datasetRoot, DB_FILE: getFaceDbPath() },
    });

    if (!fs.existsSync(studentFolderPath)) {
      throw createError('Không tìm thấy thư mục dữ liệu sau khi thu thập', 500);
    }

    const images = listImageFiles(studentFolderPath);
    if (!images.length) throw createError('Không có ảnh khuôn mặt nào được lưu', 400);

    const metaPath = writeStudentMetaFile(student, studentFolderPath);

    const profile = await AdminModel.upsertFaceDataByStudent({
      ma_sv,
      face_id: ma_sv,
      dataset_path: datasetFolderName,
      embedding_path: null,
      so_anh: images.length,
      trang_thai: 'hoat_dong',
    });

    return {
      message: replaceOld ? 'Đã chụp lại dữ liệu khuôn mặt' : 'Đã thu thập dữ liệu khuôn mặt',
      ma_sv,
      du_lieu_khuon_mat: profile,
      thu_muc_du_lieu: studentFolderPath,
      file_meta: metaPath,
      so_anh_khuon_mat: images.length,
    };
  },

  async deleteFaceData(ma_sv) {
    const student = await AdminModel.findSinhVienById(ma_sv);
    if (!student) throw createError('Không tìm thấy sinh viên', 404);

    const profile = await AdminModel.findFaceDataByStudent(ma_sv);
    const datasetFolderName = profile?.dataset_path || ma_sv;
    const folderPath = path.join(getDatasetRoot(), datasetFolderName);

    let da_xoa_thu_muc = false;
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      da_xoa_thu_muc = true;
    }

    const du_lieu_khuon_mat = await AdminModel.softDeleteFaceDataByStudent(ma_sv);

    return {
      message: 'Đã xóa mềm dữ liệu khuôn mặt',
      ma_sv,
      da_xoa_thu_muc,
      du_lieu_khuon_mat: du_lieu_khuon_mat || null,
    };
  },

  async trainFaceData() {
    await syncDatasetToDatabase();

    const pythonBin = getPythonBin();
    const pythonDir = getPythonDir();
    const scriptPath = getPythonScriptPath('train_face_db.py');
    const datasetRoot = getDatasetRoot();
    const faceDbPath = getFaceDbPath();

    if (!fs.existsSync(scriptPath)) throw createError(`Không tìm thấy file script: ${scriptPath}`, 500);
    if (!fs.existsSync(datasetRoot)) throw createError('Chưa có thư mục dataset', 400);

    const rows = await AdminModel.findFaceDashboard('');
    const validFolders = rows
      .map((row) => row.dataset_path || row.ma_sv)
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .filter((name) => {
        const fullPath = path.join(datasetRoot, name);
        return fs.existsSync(fullPath)
          && fs.statSync(fullPath).isDirectory()
          && listImageFiles(fullPath).length > 0;
      });

    if (!validFolders.length) {
      throw createError('Dataset trống hoặc chưa có thư mục chứa ảnh hợp lệ', 400);
    }

    const result = await runPythonScript({
      pythonBin,
      scriptPath,
      args: ['--dataset-dir', datasetRoot, '--db-file', faceDbPath, '--allowed-ids', validFolders.join(',')],
      cwd: pythonDir,
      extraEnv: { DATASET_DIR: datasetRoot, DB_FILE: faceDbPath },
    });

    if (!fs.existsSync(faceDbPath)) {
      throw createError('Train xong nhưng không tìm thấy face_db.npz', 500);
    }

    const so_profile_db_cap_nhat = await AdminModel.updateFaceTrainInfoForStudents(validFolders, faceDbPath);

    return {
      message: 'Train dữ liệu khuôn mặt thành công',
      dataset_root: datasetRoot,
      face_db_path: faceDbPath,
      so_thu_muc_hop_le: validFolders.length,
      so_profile_db_cap_nhat,
      danh_sach_thu_muc: validFolders,
      output: result.stdout,
    };
  },
};

module.exports = AdminService;
