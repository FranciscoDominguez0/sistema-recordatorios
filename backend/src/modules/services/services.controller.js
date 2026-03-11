import servicesService from "./services.service.js";
import activityLogsService from "../activity_logs/activityLogs.service.js";

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
        status
      } = req.body ?? {};

      const service = await servicesService.create({
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status
      });

      try {
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "CREATE_SERVICE",
          entity_type: "service",
          entity_id: service.id,
          description: "Usuario creó un nuevo servicio",
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
        status
      } = req.body ?? {};

      const updated = await servicesService.update(id, {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days,
        status
      });

      if (!updated) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      try {
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "UPDATE_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: "Usuario actualizó un servicio",
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
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "DELETE_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: "Usuario eliminó un servicio",
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
        await notificationsService.broadcastToAdmins({
          service_id: id,
          client_id: service.client_id ?? null,
          type: "service_expiring",
          title: `Servicio renovado: ${service.service_name}`,
          message: `Nueva fecha de vencimiento: ${service.expiration_date}`
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr.message);
      }

      try {
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "RENEW_SERVICE",
          entity_type: "service",
          entity_id: id,
          description: `Servicio renovado hasta ${service.expiration_date}`,
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
}

export default new ServicesController();
