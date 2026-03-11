import pool from "../../config/database.js";
import emailService from "../email/email.service.js";
import emailSettingsService from "../email_settings/email_settings.service.js";
import { buildAdminReminderEmail, buildClientReminderEmail } from "../email/email.templates.js";

function computeNextRetry(retryCount) {
  // retryCount is the value AFTER increment
  if (retryCount === 1) return "DATE_ADD(NOW(), INTERVAL 10 MINUTE)";
  if (retryCount === 2) return "DATE_ADD(NOW(), INTERVAL 30 MINUTE)";
  return null;
}

class EmailRetryService {
  async getDueFailedLogs({ limit = 25 } = {}) {
    const [rows] = await pool.query(
      `SELECT id, client_id, service_id, email, subject, retry_count
       FROM email_logs
       WHERE status = 'failed'
         AND next_retry_at IS NOT NULL
         AND next_retry_at <= NOW()
         AND retry_count < 3
       ORDER BY next_retry_at ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async markAttemptSuccess(id) {
    await pool.query(
      `UPDATE email_logs
       SET status = 'sent',
           error_message = NULL,
           sent_at = NOW(),
           next_retry_at = NULL,
           last_attempt_at = NOW()
       WHERE id = ?`,
      [id]
    );
  }

  async markAttemptFailure(id, nextRetryCount, errorMessage) {
    const nextExpr = computeNextRetry(nextRetryCount);

    if (nextExpr) {
      await pool.query(
        `UPDATE email_logs
         SET retry_count = ?,
             error_message = ?,
             next_retry_at = ${nextExpr},
             last_attempt_at = NOW()
         WHERE id = ?`,
        [nextRetryCount, errorMessage, id]
      );
      return;
    }

    // Final attempt failed
    await pool.query(
      `UPDATE email_logs
       SET retry_count = ?,
           error_message = ?,
           next_retry_at = NULL,
           last_attempt_at = NOW()
       WHERE id = ?`,
      [nextRetryCount, errorMessage, id]
    );
  }

  async processDueRetries() {
    // If schema doesn't have retry columns, do nothing (backward compatible)
    const [colsRetry] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'retry_count'");
    const [colsNext] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'next_retry_at'");
    const [colsLast] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'last_attempt_at'");
    const enabled = (colsRetry?.length ?? 0) > 0 && (colsNext?.length ?? 0) > 0 && (colsLast?.length ?? 0) > 0;
    if (!enabled) return { processed: 0, sent: 0, failed: 0, skipped: 0 };

    const due = await this.getDueFailedLogs();
    if (due.length === 0) return { processed: 0, sent: 0, failed: 0, skipped: 0 };

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const log of due) {
      const nextRetryCount = Number(log.retry_count ?? 0) + 1;

      // We can only reconstruct service reminder emails (client/admin)
      if (!log.service_id) {
        skipped++;
        await this.markAttemptFailure(log.id, nextRetryCount, "Reintento automático no soportado para este tipo de correo");
        continue;
      }

      try {
        if (log.client_id) {
          // Client reminder
          const [[client]] = await pool.query(
            "SELECT id, name, email FROM clients WHERE id = ? LIMIT 1",
            [log.client_id]
          );
          const [[service]] = await pool.query(
            "SELECT id, service_name, expiration_date FROM services WHERE id = ? LIMIT 1",
            [log.service_id]
          );

          if (!client || !service) {
            skipped++;
            await this.markAttemptFailure(log.id, nextRetryCount, "Cliente/Servicio no encontrado para reintento");
            continue;
          }

          const { subject, html, attachments } = await buildClientReminderEmail({
            clientName: client.name,
            serviceName: service.service_name,
            expirationDate: service.expiration_date
          });

          await this.sendWithAttempt(nextRetryCount, {
            to: client.email,
            subject,
            html,
            attachments
          });
        } else {
          // Admin reminder (client_id null, service_id present)
          const [[admin]] = await pool.query(
            "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
            [log.email]
          );
          const [[svcJoin]] = await pool.query(
            `SELECT s.id, s.service_name, s.expiration_date, c.name AS client_name
             FROM services s
             JOIN clients c ON s.client_id = c.id
             WHERE s.id = ?
             LIMIT 1`,
            [log.service_id]
          );

          if (!svcJoin) {
            skipped++;
            await this.markAttemptFailure(log.id, nextRetryCount, "Servicio no encontrado para reintento");
            continue;
          }

          const adminName = admin?.name ?? "Administrador";
          const { subject, html, attachments } = await buildAdminReminderEmail({
            adminName,
            clientName: svcJoin.client_name,
            serviceName: svcJoin.service_name,
            expirationDate: svcJoin.expiration_date
          });

          await this.sendWithAttempt(nextRetryCount, {
            to: log.email,
            subject,
            html,
            attachments
          });
        }

        await this.markAttemptSuccess(log.id);
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al reenviar";
        await this.markAttemptFailure(log.id, nextRetryCount, msg);
        failed++;
      }
    }

    return { processed: due.length, sent, failed, skipped };
  }

  async sendWithAttempt(attemptNumber, { to, subject, html, attachments = [] }) {
    // attemptNumber 3 => use secondary sender
    if (attemptNumber >= 3) {
      const secondary = await emailSettingsService.getSecondary();
      if (secondary) {
        await emailService.sendMailWithSmtpConfig(secondary, { to, subject, html, attachments });
        return;
      }
    }

    await emailService.sendSystemMail({ to, subject, html, attachments });
  }
}

export default new EmailRetryService();
