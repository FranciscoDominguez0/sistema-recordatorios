import pool from "../../config/database.js";

class ClientsService {
  async create({ name, phone, email, notes }) {
    const sql = `
      INSERT INTO clients (name, phone, email, notes)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [name, phone, email, notes ?? null]);

    return {
      id: result.insertId,
      name,
      phone,
      email,
      notes: notes ?? null
    };
  }

  async getAll({ page = 1, limit = 10, search } = {}) {
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const offset = (safePage - 1) * safeLimit;

    const hasSearch = Boolean(search && String(search).trim());
    const searchValue = `%${String(search).trim()}%`;

    const whereSql = hasSearch ? "WHERE name LIKE ? OR email LIKE ?" : "";
    const whereParams = hasSearch ? [searchValue, searchValue] : [];

    const dataSql = `
      SELECT id, name, phone, email, notes, created_at
      FROM clients
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM clients
      ${whereSql}
    `;

    const [dataRows] = await pool.query(dataSql, [...whereParams, safeLimit, offset]);
    const [countRows] = await pool.query(countSql, whereParams);

    return {
      data: dataRows,
      total: countRows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit
    };
  }

  async getById(id) {
    const sql = `
      SELECT id, name, phone, email, notes, created_at
      FROM clients
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] ?? null;
  }

  async update(id, { name, phone, email, notes }) {
    const sql = `
      UPDATE clients
      SET name = ?, phone = ?, email = ?, notes = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [name, phone, email, notes ?? null, id]);
    return result.affectedRows > 0;
  }

  async delete(id) {
    const sql = `DELETE FROM clients WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new ClientsService();
