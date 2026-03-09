import pool from "../../config/database.js";
import emailService from "../email/email.service.js";
import { buildReminderEmail } from "../email/email.templates.js";

class ReminderService {
  async findServicesDueToday() {
    const sql = `
      SELECT s.*, c.email, c.name
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE DATE_SUB(s.expiration_date, INTERVAL s.reminder_days DAY) = CURDATE()
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }

  async hasReminderAlreadySentToday(serviceId) {
    const sql = `
      SELECT id
      FROM reminder_history
      WHERE service_id = ?
        AND reminder_date = CURDATE()
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [serviceId]);
    return Boolean(rows[0]);
  }

  async createReminderHistory(serviceId) {
    const sql = `
      INSERT INTO reminder_history (service_id, reminder_date)
      VALUES (?, CURDATE())
    `;

    await pool.query(sql, [serviceId]);
  }

  async logEmailSent({ clientId, serviceId, email, subject }) {
    const sql = `
      INSERT INTO email_logs (client_id, service_id, email, subject, status)
      VALUES (?, ?, ?, ?, 'sent')
    `;

    await pool.query(sql, [clientId, serviceId, email, subject]);
  }

  async logEmailFailed({ clientId, serviceId, email, subject, errorMessage }) {
    const sql = `
      INSERT INTO email_logs (client_id, service_id, email, subject, status, error_message)
      VALUES (?, ?, ?, ?, 'failed', ?)
    `;

    await pool.query(sql, [clientId, serviceId, email, subject, errorMessage]);
  }

  async processDailyReminders() {
    const servicesDue = await this.findServicesDueToday();

    for (const service of servicesDue) {
      const serviceId = service.id;
      const clientId = service.client_id;

      try {
        const alreadySent = await this.hasReminderAlreadySentToday(serviceId);
        if (alreadySent) {
          continue;
        }

        const { subject, html } = buildReminderEmail({
          clientName: service.name,
          serviceName: service.service_name,
          expirationDate: service.expiration_date
        });

        await emailService.sendSystemMail({
          to: service.email,
          subject,
          html
        });

        await this.createReminderHistory(serviceId);
        await this.logEmailSent({
          clientId,
          serviceId,
          email: service.email,
          subject
        });
      } catch (error) {
        const { subject } = buildReminderEmail({
          clientName: service.name,
          serviceName: service.service_name,
          expirationDate: service.expiration_date
        });

        await this.logEmailFailed({
          clientId,
          serviceId,
          email: service.email,
          subject,
          errorMessage: error.message
        });
      }
    }

    return { processed: servicesDue.length };
  }
}

export default new ReminderService();
