import clientsService from "./clients.service.js";
import activityLogsService from "../activity_logs/activityLogs.service.js";
 
class ClientsController {
  async create(req, res) {
    try {
      const { name, phone, email, notes } = req.body ?? {};
      const client = await clientsService.create({ name, phone, email, notes });

      try {
        await activityLogsService.logActivity({
          user_id: req.user?.id ?? null,
          action: "CREATE_CLIENT",
          entity_type: "client",
          entity_id: client.id,
          description: "Usuario creó un nuevo cliente",
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
      const deleted = await clientsService.delete(id);
 
      if (!deleted) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
 
      return res.json({ message: "Cliente eliminado" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
 
export default new ClientsController();
