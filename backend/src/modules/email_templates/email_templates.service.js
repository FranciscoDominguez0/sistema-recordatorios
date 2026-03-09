import pool from "../../config/database.js";

class EmailTemplatesService {
  async create({ name, subject, body }) {
    const sql = `
      INSERT INTO email_templates (name, subject, body)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.query(sql, [name, subject, body]);

    return {
      id: result.insertId,
      name,
      subject,
      body
    };
  }

  async getAll() {
    const sql = `
      SELECT id, name, subject, body, created_at
      FROM email_templates
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }

  async getByName(name) {
    const sql = `
      SELECT id, name, subject, body, created_at
      FROM email_templates
      WHERE name = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [name]);
    return rows[0] ?? null;
  }

  async getById(id) {
    const sql = `
      SELECT id, name, subject, body, created_at
      FROM email_templates
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] ?? null;
  }

  async update(id, { name, subject, body }) {
    const sql = `
      UPDATE email_templates
      SET name = ?, subject = ?, body = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(sql, [name, subject, body, id]);
    return result.affectedRows > 0;
  }

  async delete(id) {
    const sql = `DELETE FROM email_templates WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new EmailTemplatesService();
