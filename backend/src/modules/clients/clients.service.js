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

  async getAll() {
    const sql = `
      SELECT id, name, phone, email, notes, created_at
      FROM clients
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.query(sql);
    return rows;
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
