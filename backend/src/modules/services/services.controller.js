import servicesService from "./services.service.js";

class ServicesController {
  async create(req, res) {
    try {
      const {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days
      } = req.body ?? {};

      const service = await servicesService.create({
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days
      });

      return res.status(201).json(service);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const { page, limit, search } = req.query ?? {};
      const result = await servicesService.getAllWithClient({ page, limit, search });

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
        reminder_days
      } = req.body ?? {};

      const updated = await servicesService.update(id, {
        client_id,
        service_name,
        description,
        start_date,
        expiration_date,
        reminder_days
      });

      if (!updated) {
        return res.status(404).json({ message: "Servicio no encontrado" });
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

      return res.json({ message: "Servicio eliminado" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new ServicesController();
