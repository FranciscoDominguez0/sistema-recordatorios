import pool from "../../config/database.js";

class TasksService {
  async create({ title, description, due_date }) {
    const sql = `
      INSERT INTO internal_tasks (title, description, due_date, status)
      VALUES (?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(sql, [title, description, due_date]);

    return {
      id: result.insertId,
      title,
      description,
      due_date,
      status: "pending"
    };
  }

  async getAll() {
    const sql = `
      SELECT id, title, description, due_date, status, created_at
      FROM internal_tasks
      ORDER BY due_date ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async getPending() {
    const sql = `
      SELECT id, title, description, due_date, status, created_at
      FROM internal_tasks
      WHERE status = 'pending'
      ORDER BY due_date ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  }

  async getById(id) {
    const sql = `
      SELECT id, title, description, due_date, status, created_at
      FROM internal_tasks
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] ?? null;
  }

  async complete(id) {
    const sql = `
      UPDATE internal_tasks
      SET status = 'completed'
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }

  async setPending(id) {
    const sql = `
      UPDATE internal_tasks
      SET status = 'pending'
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }

  async delete(id) {
    const sql = `DELETE FROM internal_tasks WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default new TasksService();
