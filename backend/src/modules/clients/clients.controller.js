import clientsService from "./clients.service.js";
import activityLogsService from "../activity_logs/activityLogs.service.js";
import pool from "../../config/database.js";
 
class ClientsController {
  async create(req, res) {
    try {
      const { name, phone, email, notes } = req.body ?? {};
      const client = await clientsService.create({ name, phone, email, notes });

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "CREATE_CLIENT",
          entity_type: "client",
          entity_id: client.id,
          description: `${actor} creó un nuevo cliente`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

      return res.status(201).json(client);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
 
  async getAll(req, res) {
    try {
      const { page, limit, search } = req.query ?? {};
      const result = await clientsService.getAll({ page, limit, search });

      const totalPages = Math.ceil(result.total / result.limit);

      return res.json({
        data: result.data,
        summary: result.summary,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          total_pages: totalPages
        }
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
 
  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const client = await clientsService.getById(id);
 
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
 
      return res.json(client);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async overview(req, res) {
    try {
      const id = Number(req.params.id);
      const client = await clientsService.getById(id);

      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      const [services] = await pool.query(
        `SELECT
          s.id,
          s.client_id,
          s.service_name,
          s.description,
          s.start_date,
          s.expiration_date,
          s.reminder_days,
          s.status,
          s.created_at,
          DATEDIFF(s.expiration_date, CURDATE()) AS days_to_expire,
          (SELECT MAX(rh.sent_at) FROM reminder_history rh WHERE rh.service_id = s.id) AS last_reminder_sent_at,
          (SELECT COUNT(*) FROM reminder_history rh WHERE rh.service_id = s.id) AS reminders_sent_count,
          (SELECT COUNT(*) FROM email_logs el WHERE el.service_id = s.id AND el.status = 'sent') AS emails_sent_count,
          (SELECT COUNT(*) FROM email_logs el WHERE el.service_id = s.id AND el.status = 'failed') AS emails_failed_count,
          (SELECT MAX(el.sent_at) FROM email_logs el WHERE el.service_id = s.id) AS last_email_sent_at
        FROM services s
        WHERE s.client_id = ?
        ORDER BY s.expiration_date ASC, s.id ASC`,
        [id]
      );

      const [emailLogs] = await pool.query(
        `SELECT
          el.id,
          el.client_id,
          el.service_id,
          el.email,
          el.subject,
          el.status,
          el.error_message,
          el.sent_at
        FROM email_logs el
        WHERE el.client_id = ?
        ORDER BY el.sent_at DESC
        LIMIT 30`,
        [id]
      );

      const [notifications] = await pool.query(
        `SELECT
          MAX(n.id) AS id,
          NULL AS user_id,
          n.client_id,
          n.service_id,
          n.task_id,
          n.type,
          n.title,
          n.message,
          MIN(n.is_read) AS is_read,
          MAX(n.created_at) AS created_at,
          COUNT(*) AS recipients_count
        FROM notifications n
        WHERE n.client_id = ?
        GROUP BY n.client_id, n.service_id, n.task_id, n.type, n.title, n.message
        ORDER BY created_at DESC
        LIMIT 30`,
        [id]
      );

      const [activityLogs] = await pool.query(
        `SELECT
          al.id,
          al.user_id,
          u.name AS user,
          al.action,
          al.entity_type,
          al.entity_id,
          CASE
            WHEN al.entity_type = 'service' THEN
              CONCAT(
                COALESCE(al.description, ''),
                ' (Servicio: ',
                COALESCE(s.service_name, '—'),
                ' #',
                al.entity_id,
                ')'
              )
            ELSE al.description
          END AS description,
          al.ip_address,
          al.created_at
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN services s ON al.entity_type = 'service' AND al.entity_id = s.id
        WHERE (al.entity_type = 'client' AND al.entity_id = ?)
           OR (al.entity_type = 'service' AND al.entity_id IN (SELECT id FROM services WHERE client_id = ?))
        ORDER BY al.created_at DESC
        LIMIT 50`,
        [id, id]
      );

      return res.json({
        client,
        services,
        email_logs: emailLogs,
        notifications,
        activity_logs: activityLogs
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
 
  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const { name, phone, email, notes } = req.body ?? {};
      const updated = await clientsService.update(id, { name, phone, email, notes });
 
      if (!updated) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
 
      const client = await clientsService.getById(id);
      return res.json(client);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
 
  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const existing = await clientsService.getById(id);
      const deleted = await clientsService.delete(id);
 
      if (!deleted) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "DELETE_CLIENT",
          entity_type: "client",
          entity_id: id,
          description: existing?.name
            ? `${actor} eliminó el cliente: ${existing.name}`
            : `${actor} eliminó un cliente`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }
 
      return res.json({ message: "Cliente eliminado" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
 
export default new ClientsController();
