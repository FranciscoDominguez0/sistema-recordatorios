import pool from "../../config/database.js";

class EmailLayoutService {
  /** Obtiene el layout global (siempre id=1). Lanza si no existe. */
  async get() {
    const [[row]] = await pool.query(
      "SELECT id, header_html, footer_html, max_width FROM email_layout WHERE id = 1 LIMIT 1"
    );
    if (!row) throw new Error("email_layout no encontrado (id=1). Ejecuta la migración migration_email_layout.sql");
    return row;
  }

  /** Actualiza el layout. Solo se permite editar header y footer. */
  async update({ header_html, footer_html, max_width }) {
    const [result] = await pool.query(
      `INSERT INTO email_layout (id, header_html, footer_html, max_width)
       VALUES (1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         header_html = VALUES(header_html),
         footer_html = VALUES(footer_html),
         max_width   = VALUES(max_width)`,
      [header_html, footer_html, max_width ?? 600]
    );
    return result.affectedRows > 0;
  }
}

export default new EmailLayoutService();
