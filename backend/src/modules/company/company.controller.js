import companyService from "./company.service.js";

class CompanyController {
  async get(req, res) {
    try {
      const data = await companyService.get();
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  /** Sirve el logo como imagen binaria (para emails) */
  async getLogo(req, res) {
    try {
      const data = await companyService.get();
      if (!data?.logo_base64) return res.status(404).send("Sin logo");

      // Parsear: "data:image/png;base64,xxxx"
      const match = data.logo_base64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return res.status(400).send("Formato inválido");

      const [, mimeType, base64Data] = match;
      const buffer = Buffer.from(base64Data, "base64");

      res.set("Content-Type", mimeType);
      res.set("Cache-Control", "public, max-age=86400"); // caché 1 día
      return res.send(buffer);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async save(req, res) {
    try {
      const { company_name, firma, logo_base64 } = req.body;
      const data = await companyService.save({ company_name, firma, logo_base64 });
      return res.json({ message: "Identidad de empresa guardada", data });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export default new CompanyController();
