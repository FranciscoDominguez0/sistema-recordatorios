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

  async getAll({ search } = {}) {
    const hasSearch = Boolean(search && String(search).trim());
    const searchValue = `%${String(search).trim()}%`;

    const activeColumn = await hasIsActiveColumn();

    const selectSql = activeColumn
      ? "SELECT id, name, email, role, is_active, created_at"
      : "SELECT id, name, email, role, created_at";

    const dataSql = `
      ${selectSql}
      FROM users
      ${hasSearch ? "WHERE name LIKE ? OR email LIKE ?" : ""}
      ORDER BY created_at DESC
    `;

    const params = hasSearch ? [searchValue, searchValue] : [];
    const [rows] = await pool.query(dataSql, params);

    if (!activeColumn) {
      return rows.map((u) => ({ ...u, is_active: true }));
    }

    return rows;
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
