import emailTemplatesService from "./email_templates.service.js";

class EmailTemplatesController {
  async create(req, res) {
    try {
      const { name, subject, body } = req.body ?? {};
      const template = await emailTemplatesService.create({ name, subject, body });
      return res.status(201).json(template);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const templates = await emailTemplatesService.getAll();
      return res.json(templates);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getByName(req, res) {
    try {
      const { name } = req.params;
      const template = await emailTemplatesService.getByName(name);

      if (!template) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      return res.json(template);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const { name, subject, body } = req.body ?? {};

      const updated = await emailTemplatesService.update(id, { name, subject, body });
      if (!updated) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      const template = await emailTemplatesService.getById(id);
      return res.json(template);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const deleted = await emailTemplatesService.delete(id);

      if (!deleted) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      return res.json({ message: "Plantilla eliminada" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new EmailTemplatesController();
