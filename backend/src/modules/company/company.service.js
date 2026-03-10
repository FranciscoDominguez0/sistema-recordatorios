import pool from "../../config/database.js";

class CompanyService {
  /** Obtener la configuración de empresa (siempre id = 1) */
  async get() {
    await this._ensureRow();
    const [[row]] = await pool.query(
      "SELECT id, company_name, firma, logo_base64, updated_at FROM company_settings WHERE id = 1"
    );
    return row ?? null;
  }

  /** Guardar (upsert) la configuración de empresa */
  async save({ company_name, firma, logo_base64 }) {
    await this._ensureRow();
    await pool.query(
      `UPDATE company_settings
       SET company_name = ?, firma = ?, logo_base64 = ?, updated_at = NOW()
       WHERE id = 1`,
      [company_name ?? null, firma ?? null, logo_base64 ?? null]
    );
    return this.get();
  }

  /** Garantizar que existe la fila con id=1 */
  async _ensureRow() {
    await pool.query("INSERT IGNORE INTO company_settings (id) VALUES (1)");
  }
}

export default new CompanyService();
