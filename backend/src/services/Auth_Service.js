const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');
const AdminModel = require('../models/Admin_Model');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeAccount = (account) => {
  if (!account) return null;
  return {
    id: account.id,
    ma_dang_nhap: account.ma_dang_nhap,
    vai_tro: account.vai_tro,
    ma_sv: account.ma_sv,
    ma_gv: account.ma_gv,
    trang_thai: account.trang_thai,
    ngay_tao: account.ngay_tao,
  };
};

const buildAuthResponse = (account) => {
  const token = signToken({
    id: account.id,
    ma_dang_nhap: account.ma_dang_nhap,
    vai_tro: account.vai_tro,
    ma_sv: account.ma_sv,
    ma_gv: account.ma_gv,
  });

  return {
    token,
    account: sanitizeAccount(account),
  };
};

const AuthService = {
  async register({ vai_tro, ma_dang_nhap, mat_khau }) {
    const existingAccount = await AdminModel.findAccountByLoginCode(ma_dang_nhap);
    if (existingAccount) throw createError('Mã đăng nhập đã tồn tại', 409);

    if (vai_tro === 'sinh_vien') {
      const student = await AdminModel.findSinhVienById(ma_dang_nhap);
      if (!student) throw createError('Mã sinh viên không tồn tại', 404);
    } else if (vai_tro === 'giang_vien') {
      const lecturer = await AdminModel.findGiangVienById(ma_dang_nhap);
      if (!lecturer) throw createError('Mã giảng viên không tồn tại', 404);
    } else if (vai_tro !== 'admin') {
      throw createError('Vai trò không hợp lệ', 400);
    }

    const mat_khau_hash = await bcrypt.hash(mat_khau, 10);
    const account = await AdminModel.insertAccount({
      ma_dang_nhap,
      mat_khau_hash,
      vai_tro,
      ma_sv: vai_tro === 'sinh_vien' ? ma_dang_nhap : null,
      ma_gv: vai_tro === 'giang_vien' ? ma_dang_nhap : null,
    });

    return buildAuthResponse(account);
  },

  async login({ ma_dang_nhap, mat_khau }) {
    const account = await AdminModel.findAccountByLoginCode(ma_dang_nhap);
    if (!account) throw createError('Sai mã đăng nhập hoặc mật khẩu', 401);
    if (account.trang_thai !== 'hoat_dong') throw createError('Tài khoản đã bị khóa', 403);

    const isPasswordMatch = await bcrypt.compare(mat_khau, account.mat_khau_hash);
    if (!isPasswordMatch) throw createError('Sai mã đăng nhập hoặc mật khẩu', 401);

    return buildAuthResponse(account);
  },

  async getMe(ma_dang_nhap) {
    const account = await AdminModel.findAccountByLoginCode(ma_dang_nhap);
    if (!account) throw createError('Không tìm thấy tài khoản', 404);
    return sanitizeAccount(account);
  },
};

module.exports = AuthService;
