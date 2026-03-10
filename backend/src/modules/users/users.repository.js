import pool from "../../config/database.js";

let hasActiveColumnCache;

async function hasIsActiveColumn() {
  if (typeof hasActiveColumnCache === "boolean") return hasActiveColumnCache;

  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_active'");
  hasActiveColumnCache = Array.isArray(rows) && rows.length > 0;
  return hasActiveColumnCache;
}

class UsersRepository {
  async findById(id) {
    const activeColumn = await hasIsActiveColumn();

    const selectSql = activeColumn
      ? "SELECT id, name, email, role, is_active, created_at"
      : "SELECT id, name, email, role, created_at";

    const sql = `
      ${selectSql}
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [id]);
    const user = rows[0] ?? null;

    if (!user) return null;
    if (!activeColumn) return { ...user, is_active: true };
    return user;
  }

  async findByEmail(email) {
    const sql = `
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [email]);
    return rows[0] ?? null;
  }

  async getAll({ page = 1, limit = 10, search } = {}) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const offset = (safePage - 1) * safeLimit;

    const hasSearch = Boolean(search && String(search).trim());
    const searchValue = `%${String(search).trim()}%`;

    const activeColumn = await hasIsActiveColumn();

    const selectSql = activeColumn
      ? "SELECT id, name, email, role, is_active, created_at"
      : "SELECT id, name, email, role, created_at";

    const whereSql = hasSearch ? "WHERE name LIKE ? OR email LIKE ?" : "";
    const whereParams = hasSearch ? [searchValue, searchValue] : [];

    const dataSql = `
      ${selectSql}
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM users
      ${whereSql}
    `;

    const summarySql = activeColumn
      ? `
        SELECT
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin,
          SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff
        FROM users
        ${whereSql}
      `
      : `
        SELECT
          COUNT(*) AS active,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin,
          SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff
        FROM users
        ${whereSql}
      `;

    const [dataRows] = await pool.query(dataSql, [...whereParams, safeLimit, offset]);
    const [countRows] = await pool.query(countSql, whereParams);
    const [summaryRows] = await pool.query(summarySql, whereParams);

    const normalizedData = activeColumn
      ? dataRows
      : dataRows.map((u) => ({ ...u, is_active: true }));

    return {
      data: normalizedData,
      total: countRows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit,
      summary: {
        active: Number(summaryRows[0]?.active ?? 0),
        admin: Number(summaryRows[0]?.admin ?? 0),
        staff: Number(summaryRows[0]?.staff ?? 0)
      }
    };
  }

  async create({ name, email, password_hash, role, is_active }) {
    const activeColumn = await hasIsActiveColumn();

    if (activeColumn) {
      const sql = `
        INSERT INTO users (name, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await pool.query(sql, [name, email, password_hash, role, is_active ? 1 : 0]);

      return {
        id: result.insertId,
        name,
        email,
        role,
        is_active: Boolean(is_active)
      };
    }

    const sql = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [name, email, password_hash, role]);

    return {
      id: result.insertId,
      name,
      email,
      role,
      is_active: true
    };
  }

  async updateById(id, patch = {}) {
    const activeColumn = await hasIsActiveColumn();

    const entries = Object.entries(patch)
      .filter(([key]) => key !== "is_active" || activeColumn)
      .filter(([, value]) => value !== undefined);

    if (entries.length === 0) return;

    const fields = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([key, value]) => {
      if (key === "is_active") return value ? 1 : 0;
      return value;
    });

    const sql = `
      UPDATE users
      SET ${fields}
      WHERE id = ?
      LIMIT 1
    `;

    await pool.query(sql, [...values, id]);
  }

  async deleteById(id) {
    const sql = `
      DELETE FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const [result] = await pool.query(sql, [id]);
    return Number(result?.affectedRows ?? 0) > 0;
  }
}

export default new UsersRepository();
