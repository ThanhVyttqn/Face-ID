const db = require('../config/db');

const GiangVienModel = {
  /* ================= TÀI KHOẢN / HỒ SƠ ================= */
  async findLecturerProfile(ma_gv) {
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

  async updateLecturerProfile(ma_gv, { ho_ten, email, sdt, ma_khoa }) {
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

  /* ================= LỚP HỌC PHẦN ================= */
  async findClassesByLecturer(ma_gv) {
    const query = `
      SELECT 
        lhp.*,
        mh.ten_mon,
        mh.so_tin_chi,
        mh.so_tiet
      FROM lop_hoc_phan lhp
      JOIN mon_hoc mh ON lhp.ma_mon = mh.ma_mon
      WHERE lhp.ma_gv = $1
      ORDER BY lhp.ngay_tao DESC NULLS LAST, lhp.ma_lop_hp ASC
    `;

    const { rows } = await db.query(query, [ma_gv]);
    return rows;
  },

  async findClassById(ma_lop_hp) {
    const query = `
      SELECT 
        lhp.*,
        mh.ten_mon,
        mh.so_tin_chi,
        mh.so_tiet,
        gv.ho_ten AS ten_giang_vien
      FROM lop_hoc_phan lhp
      JOIN mon_hoc mh ON lhp.ma_mon = mh.ma_mon
      LEFT JOIN giang_vien gv ON lhp.ma_gv = gv.ma_gv
      WHERE lhp.ma_lop_hp = $1
      LIMIT 1
    `;

    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows[0];
  },

  async countRegisteredStudents(ma_lop_hp) {
    const query = `
      SELECT COUNT(*)::int AS total
      FROM dang_ky_lop_hoc
      WHERE ma_lop_hp = $1
        AND trang_thai = 'da_dang_ky'
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows[0].total;
  },

  /* ================= BUỔI HỌC ================= */
  async findSessionsByClass(ma_lop_hp) {
    const query = `
      SELECT *
      FROM buoi_hoc
      WHERE ma_lop_hp = $1
      ORDER BY id_buoi ASC
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows;
  },

  async findSessionById(id_buoi) {
    const query = `
      SELECT bh.*, lhp.ma_mon, lhp.ma_gv
      FROM buoi_hoc bh
      JOIN lop_hoc_phan lhp ON bh.ma_lop_hp = lhp.ma_lop_hp
      WHERE bh.id_buoi = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [id_buoi]);
    return rows[0];
  },

  async insertSession({ ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai = 'chua_dien_ra' }) {
    const query = `
      INSERT INTO buoi_hoc (
        ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateSession(id_buoi, { ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai }) {
    const query = `
      UPDATE buoi_hoc
      SET ma_lop_hp = $2,
          ngay_hoc = $3,
          gio_bat_dau = $4,
          gio_ket_thuc = $5,
          trang_thai = $6
      WHERE id_buoi = $1
      RETURNING *
    `;
    const values = [id_buoi, ma_lop_hp, ngay_hoc, gio_bat_dau, gio_ket_thuc, trang_thai];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /* ================= ĐĂNG KÝ LỚP ================= */
  async findRegistrationsByClass(ma_lop_hp) {
    const query = `
      SELECT dk.*, sv.ho_ten, sv.email, sv.sdt, sv.ma_lop, l.ten_lop
      FROM dang_ky_lop_hoc dk
      JOIN sinh_vien sv ON dk.ma_sv = sv.ma_sv
      LEFT JOIN lop_sv l ON sv.ma_lop = l.ma_lop
      WHERE dk.ma_lop_hp = $1
      ORDER BY sv.ho_ten ASC
    `;
    const { rows } = await db.query(query, [ma_lop_hp]);
    return rows;
  },

  async isStudentRegistered(ma_sv, ma_lop_hp) {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM dang_ky_lop_hoc
        WHERE ma_sv = $1
          AND ma_lop_hp = $2
          AND trang_thai = 'da_dang_ky'
      ) AS registered
    `;
    const { rows } = await db.query(query, [ma_sv, ma_lop_hp]);
    return rows[0].registered;
  },

  /* ================= ĐIỂM DANH ================= */
  async findAttendanceBySession(id_buoi) {
    const query = `
      SELECT dd.*, sv.ho_ten
      FROM diem_danh dd
      JOIN sinh_vien sv ON dd.ma_sv = sv.ma_sv
      WHERE dd.id_buoi = $1
      ORDER BY sv.ho_ten ASC
    `;
    const { rows } = await db.query(query, [id_buoi]);
    return rows;
  },

  async upsertAttendance({
    id_buoi,
    ma_lop_hp,
    ma_sv,
    trang_thai,
    thoi_gian = new Date(),
    do_tin_cay = null,
    phuong_thuc,
    ghi_chu = null,
  }) {
    const query = `
      INSERT INTO diem_danh (
        id_buoi, ma_lop_hp, ma_sv, trang_thai,
        thoi_gian, do_tin_cay, phuong_thuc, ghi_chu
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id_buoi, ma_sv)
      DO UPDATE SET
        ma_lop_hp = EXCLUDED.ma_lop_hp,
        trang_thai = EXCLUDED.trang_thai,
        thoi_gian = EXCLUDED.thoi_gian,
        do_tin_cay = EXCLUDED.do_tin_cay,
        phuong_thuc = EXCLUDED.phuong_thuc,
        ghi_chu = EXCLUDED.ghi_chu
      RETURNING *
    `;
    const values = [
      id_buoi,
      ma_lop_hp,
      ma_sv,
      trang_thai,
      thoi_gian,
      do_tin_cay,
      phuong_thuc,
      ghi_chu,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },
};

module.exports = GiangVienModel;
