import pool from "../../config/database.js";
import emailService from "../email/email.service.js";
import notificationsService from "../notifications/notifications.service.js";
import {
  buildClientReminderEmail,
  buildAdminReminderEmail,
  buildTaskReminderEmail
} from "../email/email.templates.js";

class ReminderService {
  // ─────────────────────────────────────────────────────────────────────────
  // DB Queries
  // ─────────────────────────────────────────────────────────────────────────

  async findServicesDueToday() {
    const [rows] = await pool.query(`
      SELECT s.*, c.email AS client_email, c.name AS client_name, c.id AS client_id_fk
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.status = 'activo'
        AND s.expiration_date >= CURDATE()
        AND DATE_SUB(s.expiration_date, INTERVAL s.reminder_days DAY) <= CURDATE()
    `);
    return rows;
  }

  async getAdmins() {
    // Verificar si existe la columna receive_notifications
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'receive_notifications'");
    const hasCol = Array.isArray(cols) && cols.length > 0;

    const sql = hasCol
      ? "SELECT id, name, email FROM users WHERE role = 'admin' AND receive_notifications = 1"
      : "SELECT id, name, email FROM users WHERE role = 'admin'";

    const [rows] = await pool.query(sql);
    return rows;
  }

  // Verifica si YA se envió el recordatorio en cualquier fecha anterior (no solo hoy)
  async hasReminderAlreadySentToday(serviceId) {
    const [[row]] = await pool.query(
      "SELECT id FROM reminder_history WHERE service_id = ? LIMIT 1",
      [serviceId]
    );
    return Boolean(row);
  }

  async createReminderHistory(serviceId) {
    await pool.query(
      "INSERT INTO reminder_history (service_id, reminder_date) VALUES (?, CURDATE())",
      [serviceId]
    );
  }

  async logEmailSent({ clientId, serviceId, email, subject }) {
    await pool.query(
      `INSERT INTO email_logs (client_id, service_id, email, subject, status) VALUES (?, ?, ?, ?, 'sent')`,
      [clientId, serviceId, email, subject]
    );
  }

  async logEmailFailed({ clientId, serviceId, email, subject, errorMessage }) {
    await pool.query(
      `INSERT INTO email_logs (client_id, service_id, email, subject, status, error_message) VALUES (?, ?, ?, ?, 'failed', ?)`,
      [clientId, serviceId, email, subject, errorMessage]
    );
  }

  async markExpiredServices() {
    const [result] = await pool.query(`
      UPDATE services
      SET status = 'vencido'
      WHERE status = 'activo'
        AND expiration_date < CURDATE()
        AND DATEDIFF(CURDATE(), expiration_date) >= 3
    `);
    return result.affectedRows;
  }

  /** Tareas internas cuya fecha límite es HOY */
  async findTasksDueToday() {
    const [rows] = await pool.query(
      "SELECT id, title, description, due_date FROM internal_tasks WHERE status = 'pending' AND due_date = CURDATE()"
    );
    return rows;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESO 1 — Recordatorios de servicios
  // ─────────────────────────────────────────────────────────────────────────
  async processReminders() {
    const servicesDue = await this.findServicesDueToday();
    const admins = await this.getAdmins();

    let sent = 0, skipped = 0, failed = 0;

    for (const service of servicesDue) {
      const serviceId     = service.id;
      const clientId      = service.client_id;
      const clientName    = service.client_name;
      const clientEmail   = service.client_email;
      const serviceName   = service.service_name;
      const expirationDate = service.expiration_date;

      const alreadySent = await this.hasReminderAlreadySentToday(serviceId);
      if (alreadySent) { skipped++; continue; }

      let clientOk = false;

      // ── Email al cliente ──
      try {
        const { subject, html, attachments } = await buildClientReminderEmail({ clientName, serviceName, expirationDate });
        await emailService.sendSystemMail({ to: clientEmail, subject, html, attachments });
        await this.logEmailSent({ clientId, serviceId, email: clientEmail, subject });
        clientOk = true;
        sent++;
        console.log(`  [OK] Email cliente: ${clientEmail}`);
      } catch (err) {
        failed++;
        const { subject } = await buildClientReminderEmail({ clientName, serviceName, expirationDate }).catch(() => ({ subject: `Recordatorio: ${serviceName}` }));
        await this.logEmailFailed({ clientId, serviceId, email: clientEmail, subject, errorMessage: err.message });
        console.error(`  [FAIL] Email cliente:`, err.message);
      }

      // ── Notificación in-app para cada admin (service_expiring) ──
      const alreadyNotified = await notificationsService.hasServiceNotificationToday(serviceId);
      if (!alreadyNotified) {
        await notificationsService.broadcastToAdmins({
          client_id: clientId,
          service_id: serviceId,
          task_id: null,
          type: "service_expiring",
          title: `Vencimiento próximo: ${serviceName}`,
          message: `El servicio "${serviceName}" del cliente ${clientName} vence próximamente.`
        });
      }

      // ── Email a cada admin ──
      for (const admin of admins) {
        try {
          const { subject, html, attachments } = await buildAdminReminderEmail({ adminName: admin.name, clientName, serviceName, expirationDate });
          await emailService.sendSystemMail({ to: admin.email, subject, html, attachments });
          await this.logEmailSent({ clientId: null, serviceId, email: admin.email, subject });
          console.log(`  [OK] Email admin: ${admin.email}`);
        } catch (err) {
          const { subject } = await buildAdminReminderEmail({ adminName: admin.name, clientName, serviceName, expirationDate }).catch(() => ({ subject: `[Aviso] ${serviceName}` }));
          await this.logEmailFailed({ clientId: null, serviceId, email: admin.email, subject, errorMessage: err.message });
        }
      }

      if (clientOk) {
        await this.createReminderHistory(serviceId).catch(() => {});
      }
    }

    return { services_found: servicesDue.length, skipped, sent, failed };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESO 2 — Servicios vencidos
  // ─────────────────────────────────────────────────────────────────────────
  async processExpiredServices() {
    const updated = await this.markExpiredServices();

    if (updated > 0) {
      // Notificación in-app para admins por servicios que acaban de vencerse
      const [expired] = await pool.query(
        `SELECT s.id, s.service_name, c.id AS client_id, c.name AS client_name
         FROM services s JOIN clients c ON s.client_id = c.id
         WHERE s.status = 'vencido' AND DATE(s.expiration_date) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)`
      );
      for (const svc of expired) {
        const already = await notificationsService.hasServiceNotificationToday(svc.id);
        if (!already) {
          await notificationsService.broadcastToAdmins({
            client_id: svc.client_id,
            service_id: svc.id,
            task_id: null,
            type: "service_expired",
            title: `Servicio vencido: ${svc.service_name}`,
            message: `El servicio "${svc.service_name}" del cliente ${svc.client_name} lleva 3+ días vencido y fue marcado como vencido.`
          });
        }
      }
      console.log(`  [VENCIDO] ${updated} servicio(s) marcados como 'vencido'.`);
    }

    return { marked_vencido: updated };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESO 3 — Tareas internas vencidas hoy
  // ─────────────────────────────────────────────────────────────────────────
  async processTasksDueToday() {
    const tasks = await this.findTasksDueToday();
    const admins = await this.getAdmins();
    let notified = 0;

    for (const task of tasks) {
      const already = await notificationsService.hasTaskNotificationToday(task.id);
      if (already) continue;

      // ── Notificación in-app ──
      await notificationsService.broadcastToAdmins({
        client_id: null,
        service_id: null,
        task_id: task.id,
        type: "task_due",
        title: `Tarea vence hoy: ${task.title}`,
        message: task.description || `La tarea "${task.title}" tiene fecha límite hoy.`
      });

      // ── Email a cada admin ──
      for (const admin of admins) {
        try {
          const { subject, html, attachments } = await buildTaskReminderEmail({
            adminName: admin.name,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.due_date
          });
          await emailService.sendSystemMail({ to: admin.email, subject, html, attachments });
          await this.logEmailSent({ clientId: null, serviceId: null, email: admin.email, subject });
          console.log(`  [TAREA EMAIL] Admin: ${admin.email} — ${task.title}`);
        } catch (err) {
          console.error(`  [TAREA FAIL] Admin ${admin.email}:`, err.message);
          const fallbackSubject = `Tarea vence hoy: ${task.title}`;
          await this.logEmailFailed({ clientId: null, serviceId: null, email: admin.email, subject: fallbackSubject, errorMessage: err.message }).catch(() => {});
        }
      }

      notified++;
      console.log(`  [TAREA] Notificación + email creados para: ${task.title}`);
    }

    return { tasks_found: tasks.length, notified };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Punto de entrada del cron job
  // ─────────────────────────────────────────────────────────────────────────
  async processDailyReminders() {
    console.log("═══ Iniciando proceso diario ═══");

    console.log("▶ Proceso 1: recordatorios de servicios...");
    const r1 = await this.processReminders();
    console.log("  →", r1);

    console.log("▶ Proceso 2: servicios vencidos...");
    const r2 = await this.processExpiredServices();
    console.log("  →", r2);

    console.log("▶ Proceso 3: tareas internas de hoy...");
    const r3 = await this.processTasksDueToday();
    console.log("  →", r3);

    console.log("═══ Proceso diario finalizado ═══");
    return { ...r1, ...r2, ...r3 };
  }
}

export default new ReminderService();
