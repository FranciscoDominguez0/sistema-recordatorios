import pool from "../../config/database.js";

class EmailTemplatesService {
  _cols = null;

  async _getColumns() {
    if (this._cols) return this._cols;
    const [hasContent] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'content'");
    const [hasBody] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'body'");
    const [hasType] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'template_type'");
    const [hasCard] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'card_content'");
    this._cols = {
      content: Array.isArray(hasContent) && hasContent.length > 0,
      body: Array.isArray(hasBody) && hasBody.length > 0,
      template_type: Array.isArray(hasType) && hasType.length > 0,
      card_content: Array.isArray(hasCard) && hasCard.length > 0
    };
    return this._cols;
  }

  async create({ name, subject, content, card_content, template_type }) {
    const cols = await this._getColumns();
    const bodyValue = content;

    if (cols.content && cols.template_type) {
      const [result] = await pool.query(
        cols.card_content
          ? `INSERT INTO email_templates (name, subject, content, card_content, template_type)
             VALUES (?, ?, ?, ?, ?)`
          : `INSERT INTO email_templates (name, subject, content, template_type)
             VALUES (?, ?, ?, ?)`,
        cols.card_content
          ? [name, subject, content, card_content ?? "", template_type ?? null]
          : [name, subject, content, template_type ?? null]
      );
      return { id: result.insertId, name, subject, content, card_content: card_content ?? "", template_type };
    }

    if (cols.body) {
      const [result] = await pool.query(
        `INSERT INTO email_templates (name, subject, body)
         VALUES (?, ?, ?)`,
        [name, subject, bodyValue]
      );
      return { id: result.insertId, name, subject, content, template_type };
    }

    const [result] = await pool.query(
      `INSERT INTO email_templates (name, subject)
       VALUES (?, ?)`,
      [name, subject]
    );
    return { id: result.insertId, name, subject, content, template_type };
  }

  async getAll() {
    const cols = await this._getColumns();
    const contentExpr = cols.content
      ? "content"
      : (cols.body ? "body" : "''");
    const typeExpr = cols.template_type ? "template_type" : "NULL";
    const cardExpr = cols.card_content ? "card_content" : "''";

    const [rows] = await pool.query(
      `SELECT id, name, subject, ${contentExpr} AS content, ${cardExpr} AS card_content, ${typeExpr} AS template_type, created_at
       FROM email_templates
       ORDER BY created_at DESC`
    );
    return rows;
  }

  async getByName(name) {
    const cols = await this._getColumns();
    const contentExpr = cols.content
      ? "content"
      : (cols.body ? "body" : "''");
    const typeExpr = cols.template_type ? "template_type" : "NULL";
    const cardExpr = cols.card_content ? "card_content" : "''";

    const [rows] = await pool.query(
      `SELECT id, name, subject, ${contentExpr} AS content, ${cardExpr} AS card_content, ${typeExpr} AS template_type, created_at
       FROM email_templates WHERE name = ? LIMIT 1`,
      [name]
    );
    return rows[0] ?? null;
  }

  async getById(id) {
    const cols = await this._getColumns();
    const contentExpr = cols.content
      ? "content"
      : (cols.body ? "body" : "''");
    const typeExpr = cols.template_type ? "template_type" : "NULL";
    const cardExpr = cols.card_content ? "card_content" : "''";

    const [rows] = await pool.query(
      `SELECT id, name, subject, ${contentExpr} AS content, ${cardExpr} AS card_content, ${typeExpr} AS template_type, created_at
       FROM email_templates WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async update(id, { name, subject, content, card_content, template_type }) {
    const cols = await this._getColumns();
    const sets = ["name = ?", "subject = ?"];
    const values = [name, subject];

    if (cols.content) {
      sets.push("content = ?");
      values.push(content);
    } else if (cols.body) {
      sets.push("body = ?");
      values.push(content);
    }

    if (cols.template_type && template_type != null) {
      sets.push("template_type = ?");
      values.push(template_type);
    }

    if (cols.card_content) {
      sets.push("card_content = ?");
      values.push(card_content ?? "");
    }

    values.push(id);
    const [result] = await pool.query(
      `UPDATE email_templates
       SET ${sets.join(", ")}
       WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM email_templates WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

export default new EmailTemplatesService();
