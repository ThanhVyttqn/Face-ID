const db = require('../config/db');

const normalizeNullable = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

const AdminModel = {
  /* ================= LOOKUP ================= */
  async findAllKhoa() {
    const query = `
      SELECT *
      FROM khoa
      ORDER BY ngay_tao DESC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async findAllLopSvWithKhoa() {
    const query = `
      SELECT l.*, k.ten_khoa
      FROM lop_sv l
      JOIN khoa k ON l.ma_khoa = k.ma_khoa
      ORDER BY l.ten_lop ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async findAllSinhVienSimple() {
    const query = `
      SELECT ma_sv, ho_ten
      FROM sinh_vien
      ORDER BY ho_ten ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async findAllGiangVienSimple() {
    const query = `
      SELECT ma_gv, ho_ten
      FROM giang_vien
      ORDER BY ho_ten ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async findAllMonHocSimple() {
    const query = `
      SELECT ma_mon, ten_mon
      FROM mon_hoc
      ORDER BY ten_mon ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  /* ================= TAI KHOAN ================= */
  async findAccounts({ search = '', vai_tro = '' } = {}) {
    const query = `
      SELECT id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
      FROM tai_khoan
      WHERE
        ($1 = '' OR ma_dang_nhap ILIKE '%' || $1 || '%')
        AND ($2 = '' OR vai_tro = $2)
      ORDER BY ngay_tao DESC
    `;
    const { rows } = await db.query(query, [search, vai_tro]);
    return rows;
  },

  async findAccountById(id) {
    const query = `
      SELECT id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
      FROM tai_khoan
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  async findAccountByLoginCode(ma_dang_nhap) {
    const query = `
      SELECT *
      FROM tai_khoan
      WHERE ma_dang_nhap = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_dang_nhap]);
    return rows[0];
  },

  async insertAccount({
    ma_dang_nhap,
    mat_khau_hash,
    vai_tro,
    ma_sv = null,
    ma_gv = null,
    trang_thai = 'hoat_dong',
  }) {
    const query = `
      INSERT INTO tai_khoan (
        ma_dang_nhap, mat_khau_hash, vai_tro, ma_sv, ma_gv, trang_thai
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
    `;
    const values = [ma_dang_nhap, mat_khau_hash, vai_tro, ma_sv, ma_gv, trang_thai];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateAccountPassword(id, mat_khau_hash) {
    const query = `
      UPDATE tai_khoan
      SET mat_khau_hash = $2
      WHERE id = $1
      RETURNING id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
    `;
    const { rows } = await db.query(query, [id, mat_khau_hash]);
    return rows[0];
  },

  async updateAccountStatus(id, trang_thai) {
    const query = `
      UPDATE tai_khoan
      SET trang_thai = $2
      WHERE id = $1
      RETURNING id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
    `;
    const { rows } = await db.query(query, [id, trang_thai]);
    return rows[0];
  },

  async deleteAccount(id) {
    const query = `
      DELETE FROM tai_khoan
      WHERE id = $1
      RETURNING id, ma_dang_nhap, vai_tro, ma_sv, ma_gv, trang_thai, ngay_tao
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /* ================= SINH VIEN ================= */
  async findAllSinhVien({ search = '' } = {}) {
    const query = `
      SELECT sv.*, l.ten_lop, l.khoa_hoc, k.ten_khoa
      FROM sinh_vien sv
      JOIN lop_sv l ON sv.ma_lop = l.ma_lop
      JOIN khoa k ON l.ma_khoa = k.ma_khoa
      WHERE
        ($1 = '')
        OR sv.ma_sv ILIKE '%' || $1 || '%'
        OR sv.ho_ten ILIKE '%' || $1 || '%'
        OR COALESCE(sv.email, '') ILIKE '%' || $1 || '%'
      ORDER BY sv.ngay_tao DESC NULLS LAST, sv.ma_sv ASC
    `;
    const { rows } = await db.query(query, [search]);
    return rows;
  },

  async findSinhVienById(ma_sv) {
    const query = `
      SELECT sv.*, l.ten_lop, l.khoa_hoc, k.ten_khoa
      FROM sinh_vien sv
      JOIN lop_sv l ON sv.ma_lop = l.ma_lop
      JOIN khoa k ON l.ma_khoa = k.ma_khoa
      WHERE sv.ma_sv = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_sv]);
    return rows[0];
  },

  async insertSinhVien({ ma_sv, ho_ten, gioi_tinh, ngay_sinh, email, sdt, ma_lop }) {
    const query = `
      INSERT INTO sinh_vien (
        ma_sv, ho_ten, gioi_tinh, ngay_sinh, email, sdt, ma_lop
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [ma_sv, ho_ten, gioi_tinh, ngay_sinh, email, sdt, ma_lop];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateSinhVien(ma_sv, { ho_ten, gioi_tinh, ngay_sinh, email, sdt, ma_lop }) {
    const query = `
      UPDATE sinh_vien
      SET ho_ten = $2,
          gioi_tinh = $3,
          ngay_sinh = $4,
          email = $5,
          sdt = $6,
          ma_lop = $7
      WHERE ma_sv = $1
      RETURNING *
    `;
    const values = [ma_sv, ho_ten, gioi_tinh, ngay_sinh, email, sdt, ma_lop];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async deleteSinhVien(ma_sv) {
    const query = `
      DELETE FROM sinh_vien
      WHERE ma_sv = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_sv]);
    return rows[0];
  },

  /* ================= GIANG VIEN ================= */
  async findAllGiangVien({ search = '' } = {}) {
    const query = `
      SELECT gv.*, k.ten_khoa
      FROM giang_vien gv
      JOIN khoa k ON gv.ma_khoa = k.ma_khoa
      WHERE
        ($1 = '')
        OR gv.ma_gv ILIKE '%' || $1 || '%'
        OR gv.ho_ten ILIKE '%' || $1 || '%'
        OR COALESCE(gv.email, '') ILIKE '%' || $1 || '%'
      ORDER BY gv.ngay_tao DESC NULLS LAST, gv.ma_gv ASC
    `;
    const { rows } = await db.query(query, [search]);
    return rows;
  },

  async findGiangVienById(ma_gv) {
    const query = `
      SELECT gv.*, k.ten_khoa
      FROM giang_vien gv
      JOIN khoa k ON gv.ma_khoa = k.ma_khoa
      WHERE gv.ma_gv = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_gv]);
    return rows[0];
  },

  async insertGiangVien({ ma_gv, ho_ten, email, sdt, ma_khoa }) {
    const query = `
      INSERT INTO giang_vien (ma_gv, ho_ten, email, sdt, ma_khoa)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [ma_gv, ho_ten, email, sdt, ma_khoa];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateGiangVien(ma_gv, { ho_ten, email, sdt, ma_khoa }) {
    const query = `
      UPDATE giang_vien
      SET ho_ten = $2,
          email = $3,
          sdt = $4,
          ma_khoa = $5
      WHERE ma_gv = $1
      RETURNING *
    `;
    const values = [ma_gv, ho_ten, email, sdt, ma_khoa];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async deleteGiangVien(ma_gv) {
    const query = `
      DELETE FROM giang_vien
      WHERE ma_gv = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_gv]);
    return rows[0];
  },

  /* ================= MON HOC ================= */
  async findAllMonHoc({ search = '' } = {}) {
    const query = `
      SELECT *
      FROM mon_hoc
      WHERE
        ($1 = '')
        OR ma_mon ILIKE '%' || $1 || '%'
        OR ten_mon ILIKE '%' || $1 || '%'
      ORDER BY ngay_tao DESC NULLS LAST, ma_mon ASC
    `;
    const { rows } = await db.query(query, [search]);
    return rows;
  },

  async findMonHocById(ma_mon) {
    const query = `
      SELECT *
      FROM mon_hoc
      WHERE ma_mon = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_mon]);
    return rows[0];
  },

  async insertMonHoc({ ma_mon, ten_mon, so_tin_chi, so_tiet }) {
    const query = `
      INSERT INTO mon_hoc (ma_mon, ten_mon, so_tin_chi, so_tiet)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [ma_mon, ten_mon, so_tin_chi, so_tiet];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateMonHoc(ma_mon, { ten_mon, so_tin_chi, so_tiet }) {
    const query = `
      UPDATE mon_hoc
      SET ten_mon = $2,
          so_tin_chi = $3,
          so_tiet = $4
      WHERE ma_mon = $1
      RETURNING *
    `;
    const values = [ma_mon, ten_mon, so_tin_chi, so_tiet];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async deleteMonHoc(ma_mon) {
    const query = `
      DELETE FROM mon_hoc
      WHERE ma_mon = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_mon]);
    return rows[0];
  },

  /* ================= LOP HOC PHAN ================= */
  async findAllLopHocPhan({ search = '', hoc_ky = '', nam_hoc = '' } = {}) {
    const query = `
      SELECT lhp.*, mh.ten_mon, gv.ho_ten AS ten_giang_vien
      FROM lop_hoc_phan lhp
      JOIN mon_hoc mh ON lhp.ma_mon = mh.ma_mon
      LEFT JOIN giang_vien gv ON lhp.ma_gv = gv.ma_gv
      WHERE
        (
          ($1 = '')
          OR lhp.ma_lop_hp ILIKE '%' || $1 || '%'
          OR mh.ten_mon ILIKE '%' || $1 || '%'
          OR COALESCE(gv.ho_ten, '') ILIKE '%' || $1 || '%'
        )
        AND ($2 = '' OR CAST(lhp.hoc_ky AS TEXT) = $2)
        AND ($3 = '' OR lhp.nam_hoc = $3)
      ORDER BY lhp.ngay_tao DESC NULLS LAST, lhp.ma_lop_hp ASC
    `;
    const { rows } = await db.query(query, [search, hoc_ky, nam_hoc]);
    return rows;
  },

  async findLopHocPhanById(ma_lop_hp) {
    const query = `
      SELECT lhp.*, mh.ten_mon, gv.ho_ten AS ten_giang_vien
      FROM lop_hoc_phan lhp
      JOIN mon_hoc mh ON lhp.ma_mon = mh.ma_mon
      LEFT JOIN giang_vien gv ON lhp.ma_gv = gv.ma_gv
      WHERE lhp.ma_lop_hp = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows[0];
  },

  async insertLopHocPhan({
    ma_lop_hp,
    ma_mon,
    ma_gv,
    hoc_ky,
    nam_hoc,
    phong_hoc,
    so_luong_toi_da,
    so_buoi_hoc,
    trang_thai = 'dang_mo',
  }) {
    const query = `
      INSERT INTO lop_hoc_phan (
        ma_lop_hp, ma_mon, ma_gv, hoc_ky, nam_hoc,
        phong_hoc, so_luong_toi_da, so_buoi_hoc, trang_thai
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 1), $9)
      RETURNING *
    `;
    const values = [
      ma_lop_hp,
      ma_mon,
      ma_gv,
      hoc_ky,
      nam_hoc,
      normalizeNullable(phong_hoc),
      normalizeNullable(so_luong_toi_da),
      normalizeNullable(so_buoi_hoc),
      trang_thai,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateLopHocPhan(
    ma_lop_hp,
    { ma_mon, ma_gv, hoc_ky, nam_hoc, phong_hoc, so_luong_toi_da, so_buoi_hoc, trang_thai }
  ) {
    const query = `
      UPDATE lop_hoc_phan
      SET ma_mon = $2,
          ma_gv = $3,
          hoc_ky = $4,
          nam_hoc = $5,
          phong_hoc = $6,
          so_luong_toi_da = $7,
          so_buoi_hoc = COALESCE($8, so_buoi_hoc),
          trang_thai = $9
      WHERE ma_lop_hp = $1
      RETURNING *
    `;
    const values = [
      ma_lop_hp,
      ma_mon,
      ma_gv,
      hoc_ky,
      nam_hoc,
      normalizeNullable(phong_hoc),
      normalizeNullable(so_luong_toi_da),
      normalizeNullable(so_buoi_hoc),
      trang_thai,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async deleteLopHocPhan(ma_lop_hp) {
    const query = `
      DELETE FROM lop_hoc_phan
      WHERE ma_lop_hp = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows[0];
  },

  async assignLecturer(ma_lop_hp, ma_gv) {
    const query = `
      UPDATE lop_hoc_phan
      SET ma_gv = $2
      WHERE ma_lop_hp = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_lop_hp, ma_gv]);
    return rows[0];
  },

  /* ================= ĐĂNG KÝ LỚP HỌC PHẦN ================= */
  async findRegistrationsByClassSection(ma_lop_hp) {
    const query = `
      SELECT
        dk.ma_sv,
        dk.ma_lop_hp,
        dk.ngay_dang_ky,
        dk.trang_thai,
        sv.ho_ten,
        sv.email,
        sv.sdt,
        sv.ma_lop,
        l.ten_lop
      FROM dang_ky_lop_hoc dk
      JOIN sinh_vien sv ON dk.ma_sv = sv.ma_sv
      LEFT JOIN lop_sv l ON sv.ma_lop = l.ma_lop
      WHERE dk.ma_lop_hp = $1
      ORDER BY
        CASE WHEN dk.trang_thai = 'da_dang_ky' THEN 0 ELSE 1 END,
        sv.ho_ten ASC
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows;
  },

  async findRegistration(ma_sv, ma_lop_hp) {
    const query = `
      SELECT *
      FROM dang_ky_lop_hoc
      WHERE ma_sv = $1
        AND ma_lop_hp = $2
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_sv, ma_lop_hp]);
    return rows[0];
  },

  async insertRegistration({ ma_sv, ma_lop_hp }) {
    const query = `
      INSERT INTO dang_ky_lop_hoc (
        ma_sv, ma_lop_hp, trang_thai
      )
      VALUES ($1, $2, 'da_dang_ky')
      ON CONFLICT (ma_sv, ma_lop_hp)
      DO UPDATE SET
        trang_thai = 'da_dang_ky',
        ngay_dang_ky = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_sv, ma_lop_hp]);
    return rows[0];
  },

  async cancelRegistration(ma_sv, ma_lop_hp) {
    const query = `
      UPDATE dang_ky_lop_hoc
      SET trang_thai = 'da_huy'
      WHERE ma_sv = $1
        AND ma_lop_hp = $2
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_sv, ma_lop_hp]);
    return rows[0];
  },
  /* ================= DỮ LIỆU KHUÔN MẶT ================= */
  async findFaceDashboard(search = '') {
    const query = `
      SELECT
        sv.ma_sv,
        sv.ho_ten,
        sv.email,
        sv.sdt,
        sv.ma_lop,
        l.ten_lop,
        l.khoa_hoc,
        k.ten_khoa,
        dlkm.id AS face_profile_id,
        dlkm.face_id,
        dlkm.dataset_path,
        dlkm.embedding_path,
        dlkm.so_anh,
        dlkm.trang_thai AS db_trang_thai,
        dlkm.ngay_tao AS face_ngay_tao,
        dlkm.ngay_cap_nhat AS face_ngay_cap_nhat,
        dlkm.train_lan_cuoi
      FROM sinh_vien sv
      JOIN lop_sv l ON sv.ma_lop = l.ma_lop
      JOIN khoa k ON l.ma_khoa = k.ma_khoa
      LEFT JOIN du_lieu_khuon_mat dlkm ON dlkm.ma_sv = sv.ma_sv
      WHERE
        sv.ma_sv ILIKE '%' || $1 || '%'
        OR sv.ho_ten ILIKE '%' || $1 || '%'
        OR COALESCE(sv.email, '') ILIKE '%' || $1 || '%'
        OR COALESCE(l.ten_lop, '') ILIKE '%' || $1 || '%'
        OR COALESCE(k.ten_khoa, '') ILIKE '%' || $1 || '%'
      ORDER BY
        CASE
          WHEN dlkm.id IS NULL OR dlkm.trang_thai <> 'hoat_dong' THEN 0
          ELSE 1
        END,
        sv.ma_sv ASC
    `;
    const { rows } = await db.query(query, [search]);
    return rows;
  },

  async findFaceDataByStudent(ma_sv) {
    const query = `
      SELECT *
      FROM du_lieu_khuon_mat
      WHERE ma_sv = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [ma_sv]);
    return rows[0];
  },

  async upsertFaceDataByStudent({
    ma_sv,
    face_id,
    dataset_path,
    embedding_path = null,
    so_anh = 0,
    trang_thai = 'hoat_dong',
  }) {
    const query = `
      INSERT INTO du_lieu_khuon_mat (
        ma_sv, face_id, dataset_path, embedding_path, so_anh, trang_thai
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (ma_sv)
      DO UPDATE SET
        face_id = EXCLUDED.face_id,
        dataset_path = EXCLUDED.dataset_path,
        embedding_path = EXCLUDED.embedding_path,
        so_anh = EXCLUDED.so_anh,
        trang_thai = EXCLUDED.trang_thai,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [ma_sv, face_id, dataset_path, embedding_path, so_anh, trang_thai];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async softDeleteFaceDataByStudent(ma_sv) {
    const query = `
      UPDATE du_lieu_khuon_mat
      SET
        trang_thai = 'da_xoa',
        so_anh = 0,
        embedding_path = NULL,
        train_lan_cuoi = NULL,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE ma_sv = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_sv]);
    return rows[0];
  },

  async markFaceDataError(ma_sv) {
    const query = `
      UPDATE du_lieu_khuon_mat
      SET
        trang_thai = 'loi_du_lieu',
        embedding_path = NULL,
        train_lan_cuoi = NULL,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE ma_sv = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [ma_sv]);
    return rows[0];
  },

  async updateFaceTrainInfoForStudents(maSvList = [], embeddingPath) {
    if (!maSvList.length) return 0;

    const query = `
      UPDATE du_lieu_khuon_mat
      SET
        embedding_path = $2,
        train_lan_cuoi = CURRENT_TIMESTAMP,
        ngay_cap_nhat = CURRENT_TIMESTAMP
      WHERE ma_sv = ANY($1::varchar[])
        AND trang_thai = 'hoat_dong'
      RETURNING id
    `;
    const { rows } = await db.query(query, [maSvList, embeddingPath]);
    return rows.length;
  },
};

module.exports = AdminModel;
