import pool from "../../config/database.js";
import emailService from "../email/email.service.js";
import notificationsService from "../notifications/notifications.service.js";
import {
  buildClientReminderEmail,
  buildClientLastDayEmail,
  buildAdminReminderEmail,
  buildTaskReminderEmail
} from "../email/email.templates.js";

class ReminderService {
  _emailLogRetryCols = null;

  async hasEmailLogRetryColumns() {
    if (this._emailLogRetryCols !== null) return this._emailLogRetryCols;
    try {
      const [colsRetry] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'retry_count'");
      const [colsNext] = await pool.query("SHOW COLUMNS FROM email_logs LIKE 'next_retry_at'");
      this._emailLogRetryCols = (Array.isArray(colsRetry) && colsRetry.length > 0) && (Array.isArray(colsNext) && colsNext.length > 0);
      return this._emailLogRetryCols;
    } catch {
      this._emailLogRetryCols = false;
      return false;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────
  // DB Queries
  // ─────────────────────────────────────────────────────────────────────────

  async findServicesDueToday() {
    // Log de diagnóstico: qué fecha ve MySQL
    const [[dateInfo]] = await pool.query("SELECT CURDATE() AS today, NOW() AS now, @@session.time_zone AS tz");
    console.log(`  [DIAG] MySQL CURDATE()=${dateInfo.today}, NOW()=${dateInfo.now}, timezone=${dateInfo.tz}`);

    const [rows] = await pool.query(`
      SELECT s.*, c.email AS client_email, c.name AS client_name, c.id AS client_id_fk,
             (DATE(s.expiration_date) = CURDATE()) AS is_last_day
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.status = 'activo'
        AND s.expiration_date >= CURDATE()
        AND DATE_SUB(s.expiration_date, INTERVAL s.reminder_days DAY) <= CURDATE()
    `);
    console.log(`  [DIAG] Servicios encontrados para recordatorio: ${rows.length}`);
    for (const r of rows) {
      console.log(`    → ID=${r.id} "${r.service_name}" vence=${r.expiration_date} reminder_days=${r.reminder_days} isLastDay=${r.is_last_day}`);
    }
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
  async hasAnyReminderHistory(serviceId) {
    const [[row]] = await pool.query(
      "SELECT id FROM reminder_history WHERE service_id = ? LIMIT 1",
      [serviceId]
    );
    return Boolean(row);
  }

  async hasReminderHistoryToday(serviceId) {
    const [[row]] = await pool.query(
      "SELECT id FROM reminder_history WHERE service_id = ? AND reminder_date = CURDATE() LIMIT 1",
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

  async createReminderHistoryForDate(serviceId, reminderDate) {
    if (!reminderDate) return;
    await pool.query(
      "INSERT IGNORE INTO reminder_history (service_id, reminder_date) VALUES (?, DATE(?))",
      [serviceId, reminderDate]
    );
  }

  async findServiceByIdWithClient(serviceId) {
    const [[row]] = await pool.query(
      `
      SELECT
        s.*, 
        c.email AS client_email,
        c.name AS client_name,
        c.id AS client_id_fk,
        (DATE(s.expiration_date) = CURDATE()) AS is_last_day
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.id = ?
      LIMIT 1
      `,
      [serviceId]
    );
    return row ?? null;
  }

  async sendManualServiceEmail(serviceId) {
    const service = await this.findServiceByIdWithClient(serviceId);
    if (!service) {
      const error = new Error("Servicio no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const clientId = service.client_id;
    const clientName = service.client_name;
    const clientEmail = service.client_email;
    const serviceName = service.service_name;
    const expirationDate = service.expiration_date;
    const isLastDay = Boolean(service.is_last_day);

    const builder = isLastDay ? buildClientLastDayEmail : buildClientReminderEmail;

    try {
      const { subject, html, attachments } = await builder({ clientName, serviceName, expirationDate });
      await emailService.sendSystemMail({ to: clientEmail, subject, html, attachments });
      await this.logEmailSent({ clientId, serviceId, email: clientEmail, subject });

      await this.createReminderHistoryForDate(serviceId, expirationDate).catch(() => {});

      return { message: "Correo enviado", service_id: serviceId, email: clientEmail, subject };
    } catch (err) {
      const fallbackSubject = isLastDay ? `Último día: ${serviceName}` : `Recordatorio: ${serviceName}`;
      await this.logEmailFailed({ clientId, serviceId, email: clientEmail, subject: fallbackSubject, errorMessage: err.message }).catch(() => {});
      const error = new Error(err?.message || "No se pudo enviar el correo");
      error.statusCode = 500;
      throw error;
    }
  }

  async logEmailSent({ clientId, serviceId, email, subject }) {
    const hasRetry = await this.hasEmailLogRetryColumns();
    if (hasRetry) {
      await pool.query(
        `INSERT INTO email_logs (client_id, service_id, email, subject, status, retry_count, next_retry_at, last_attempt_at)
         VALUES (?, ?, ?, ?, 'sent', 0, NULL, NOW())`,
        [clientId, serviceId, email, subject]
      );
      return;
    }

    await pool.query(
      `INSERT INTO email_logs (client_id, service_id, email, subject, status) VALUES (?, ?, ?, ?, 'sent')`,
      [clientId, serviceId, email, subject]
    );
  }

  async logEmailFailed({ clientId, serviceId, email, subject, errorMessage }) {
    const hasRetry = await this.hasEmailLogRetryColumns();
    if (hasRetry) {
      await pool.query(
        `INSERT INTO email_logs (
          client_id,
          service_id,
          email,
          subject,
          status,
          error_message,
          retry_count,
          next_retry_at,
          last_attempt_at
        ) VALUES (?, ?, ?, ?, 'failed', ?, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())`,
        [clientId, serviceId, email, subject, errorMessage]
      );
      return;
    }

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
        AND DATEDIFF(CURDATE(), expiration_date) >= 1
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

      const isLastDay = Boolean(service.is_last_day);

      if (isLastDay) {
        const alreadySentToday = await this.hasReminderHistoryToday(serviceId);
        if (alreadySentToday) { skipped++; continue; }
      } else {
        const alreadySentAny = await this.hasAnyReminderHistory(serviceId);
        if (alreadySentAny) { skipped++; continue; }
      }

      let clientOk = false;

      // ── Email al cliente ──
      try {
        const builder = isLastDay ? buildClientLastDayEmail : buildClientReminderEmail;
        const { subject, html, attachments } = await builder({ clientName, serviceName, expirationDate });
        await emailService.sendSystemMail({ to: clientEmail, subject, html, attachments });
        await this.logEmailSent({ clientId, serviceId, email: clientEmail, subject });
        clientOk = true;
        sent++;
        console.log(`  [OK] Email cliente: ${clientEmail}`);
      } catch (err) {
        failed++;
        const fallbackBuilder = isLastDay ? buildClientLastDayEmail : buildClientReminderEmail;
        const fallbackSubject = isLastDay ? `Último día: ${serviceName}` : `Recordatorio: ${serviceName}`;
        const { subject } = await fallbackBuilder({ clientName, serviceName, expirationDate })
          .catch(() => ({ subject: fallbackSubject }));
        await this.logEmailFailed({ clientId, serviceId, email: clientEmail, subject, errorMessage: err.message })
          .catch(e => console.error(`  [DB-LOG ERROR] No se pudo guardar logEmailFailed:`, e.message));
        await notificationsService.broadcastToAgents({
          client_id: clientId,
          service_id: serviceId,
          task_id: null,
          type: "email_sent",
          title: "Error enviando correo",
          message: `Falló el envío del correo a ${clientEmail} para el servicio "${serviceName}" (${clientName}). ${String(err.message || "").slice(0, 120)}`
        }).catch(() => {});
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
          title: `Vence pronto: ${serviceName}`,
          message: clientName
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
          await this.logEmailFailed({ clientId: null, serviceId, email: admin.email, subject, errorMessage: err.message })
            .catch(e => console.error(`  [DB-LOG ERROR] No se pudo guardar logEmailFailed (admin):`, e.message));
          await notificationsService.broadcastToAgents({
            client_id: clientId,
            service_id: serviceId,
            task_id: null,
            type: "email_sent",
            title: "Error enviando correo",
            message: `Falló el envío del correo a ${admin.email} (admin) para el servicio "${serviceName}" (${clientName}). ${String(err.message || "").slice(0, 120)}`
          }).catch(() => {});
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
         WHERE s.status = 'vencido' AND DATE(s.expiration_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
      );
      for (const svc of expired) {
        const already = await notificationsService.hasServiceNotificationToday(svc.id);
        if (!already) {
          await notificationsService.broadcastToAdmins({
            client_id: svc.client_id,
            service_id: svc.id,
            task_id: null,
            type: "service_expired",
            title: `Vencido: ${svc.service_name}`,
            message: svc.client_name
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
  // PROCESO 4 — Renovación automática de servicios
  // ─────────────────────────────────────────────────────────────────────────
  async processAutoRenewals() {
    console.log("▶ Proceso 4: Renovación automática de servicios...");
    
    // Buscar servicios con auto_renovación activa, estado activo/vencido y fecha expiración <= hoy
    const [services] = await pool.query(`
      SELECT s.*, c.name AS client_name, c.email AS client_email
      FROM services s
      JOIN clients c ON s.client_id = c.id
      WHERE s.auto_renew = 1
        AND s.expiration_date <= CURDATE()
        AND s.status IN ('activo', 'vencido')
    `);

    let renewedCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const service of services) {
      let nextDateObj = new Date(service.expiration_date);
      
      // Asegurarse de que el nuevo vencimiento esté estrictamente en el futuro (mínimo el mes siguiente)
      while (nextDateObj <= today) {
        const currentDay = nextDateObj.getDate();
        nextDateObj.setMonth(nextDateObj.getMonth() + 1);
        if (nextDateObj.getDate() !== currentDay) {
          nextDateObj.setDate(0); // Manejo correcto del fin de mes
        }
      }

      const yyyy = nextDateObj.getFullYear();
      const mm = String(nextDateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDateObj.getDate()).padStart(2, "0");
      const nextDate = `${yyyy}-${mm}-${dd}`;

      // Actualizar servicio a activo con la nueva fecha de vencimiento
      await pool.query(
        `UPDATE services SET expiration_date = ?, status = 'activo' WHERE id = ?`,
        [nextDate, service.id]
      );

      // Limpiar historial de recordatorios para el nuevo periodo
      await pool.query(`DELETE FROM reminder_history WHERE service_id = ?`, [service.id]);

      // Notificación in-app para admins
      try {
        const prettyDate = nextDateObj.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "2-digit" });
        await notificationsService.broadcastToAdmins({
          service_id: service.id,
          client_id: service.client_id ?? null,
          type: "service_expiring",
          title: `Auto-renovado: ${service.service_name}`,
          message: `El servicio de ${service.client_name} se renovó automáticamente hasta el ${prettyDate}`
        });
      } catch (notifErr) {
        console.error("Auto-renew notification error:", notifErr.message);
      }

      // Log de actividad
      try {
        const activityLogsService = (await import("../activity_logs/activityLogs.service.js")).default;
        const prettyDate = nextDateObj.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "2-digit" });
        await activityLogsService.logActivity({
          user_id: null,
          action: "AUTO_RENEW_SERVICE",
          entity_type: "service",
          entity_id: service.id,
          description: `El sistema renovó automáticamente el servicio de ${service.client_name} hasta el ${prettyDate} (Auto-Renovación activa)`,
          ip_address: "127.0.0.1"
        });
      } catch (logErr) {
        console.error("Auto-renew activity log error:", logErr.message);
      }

      renewedCount++;
      console.log(`  [AUTO-RENEW] Servicio ID ${service.id} ("${service.service_name}") auto-renovado hasta ${nextDate}.`);
    }

    return { auto_renewed: renewedCount };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Punto de entrada del cron job
  // ─────────────────────────────────────────────────────────────────────────
  /** Diagnóstico de zona horaria (para endpoint de debug) */
  async getTimezoneDiagnostics() {
    const [[dbInfo]] = await pool.query(
      "SELECT CURDATE() AS curdate, NOW() AS now, @@global.time_zone AS global_tz, @@session.time_zone AS session_tz"
    );
    return {
      mysql: dbInfo,
      node: {
        date: new Date().toISOString(),
        localDate: new Date().toLocaleString("es-PA", { timeZone: "America/Panama" }),
        tzOffset: new Date().getTimezoneOffset(),
        TZ_env: process.env.TZ || '(not set)'
      }
    };
  }

  async processDailyReminders() {
    console.log("═══ Iniciando proceso diario ═══");
    console.log(`  [NODE] Hora local: ${new Date().toLocaleString("es-PA", { timeZone: "America/Panama" })} | ISO: ${new Date().toISOString()}`);

    console.log("▶ Proceso 1: recordatorios de servicios...");
    const r1 = await this.processReminders();
    console.log("  →", r1);

    console.log("▶ Proceso 2: servicios vencidos...");
    const r2 = await this.processExpiredServices();
    console.log("  →", r2);

    console.log("▶ Proceso 3: renovación automática de servicios...");
    const rAuto = await this.processAutoRenewals();
    console.log("  →", rAuto);

    console.log("▶ Proceso 4: tareas internas de hoy...");
    const r3 = await this.processTasksDueToday();
    console.log("  →", r3);

    console.log("═══ Proceso diario finalizado ═══");
    return { ...r1, ...r2, ...rAuto, ...r3 };
  }
}

export default new ReminderService();
