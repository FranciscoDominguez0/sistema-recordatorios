import servicesService from "./services.service.js";
import activityLogsService from "../activity_logs/activityLogs.service.js";
import reminderService from "../reminders/reminder.service.js";

class ServicesController {
  async create(req, res) {
    try {
      const {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status,
        auto_renew
      } = req.body ?? {};

      const service = await servicesService.create({
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status,
        auto_renew
      });

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "CREATE_SERVICE",
          entity_type: "service",
          entity_id: service.id,
          description: `${actor} creó un nuevo servicio`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

      return res.status(201).json(service);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const { page, limit, search, status } = req.query ?? {};
      const result = await servicesService.getAllWithClient({ page, limit, search, status });

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

  async getByClient(req, res) {
    try {
      const clientId = Number(req.params.clientId);
      const services = await servicesService.getByClientId(clientId);
      return res.json(services);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const service = await servicesService.getById(id);

      if (!service) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      return res.json(service);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status,
        auto_renew
      } = req.body ?? {};

      const updated = await servicesService.update(id, {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status,
        auto_renew
      });

      if (!updated) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "UPDATE_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: `${actor} actualizó un servicio`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

      const service = await servicesService.getById(id);
      return res.json(service);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const deleted = await servicesService.delete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "DELETE_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: `${actor} eliminó un servicio`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

      return res.json({ message: "Servicio eliminado" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
  async renew(req, res) {
    try {
      const id = Number(req.params.id);
      const { new_expiration_date } = req.body ?? {};

      const service = await servicesService.renew(id, { new_expiration_date });

      if (!service) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      // Notify admins of the renewal
      try {
        const notificationsService = (await import("../notifications/notifications.service.js")).default;
        const prettyDate = (() => {
          try {
            const d = service?.expiration_date instanceof Date ? service.expiration_date : new Date(service?.expiration_date);
            if (Number.isNaN(d.getTime())) return String(service?.expiration_date ?? "");
            return d.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "2-digit", timeZone: "UTC" });
          } catch {
            return String(service?.expiration_date ?? "");
          }
        })();
        await notificationsService.broadcastToAdmins({
          service_id: id,
          client_id: service.client_id ?? null,
          type: "service_expiring",
          title: `Servicio renovado: ${service.service_name}`,
          message: `Vence: ${prettyDate}`
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr.message);
      }

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        const prettyDate = (() => {
          try {
            const d = service?.expiration_date instanceof Date ? service.expiration_date : new Date(service?.expiration_date);
            if (Number.isNaN(d.getTime())) return String(service?.expiration_date ?? "");
            return d.toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "2-digit", timeZone: "UTC" });
          } catch {
            return String(service?.expiration_date ?? "");
          }
        })();
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "RENEW_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: `${actor} renovó el servicio hasta ${prettyDate}`,
          ip_address: req.ip
        });
      } catch (logErr) {
        console.error("Activity log error:", logErr.message);
      }

      return res.json(service);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async sendManualEmail(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: "ID de servicio inválido" });
      }

      const result = await reminderService.sendManualServiceEmail(id);

      try {
        const actor = req.user?.role === "admin" ? "Administrador" : "Usuario";
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "SEND_SERVICE_EMAIL_MANUAL",
          entity_type: "service",
          entity_id: id,
          description: `${actor} envió correo manual del servicio`,
          ip_address: req.ip
        });
      } catch (error) {
        console.error("Activity log error:", error.message);
      }

      return res.json(result);
    } catch (error) {
      const status = error?.statusCode || 500;
      return res.status(status).json({ message: error.message });
    }
  }
}

export default new ServicesController();
