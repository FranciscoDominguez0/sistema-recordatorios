import nodemailer from "nodemailer";
import emailSettingsService from "./email_settings.service.js";

class EmailSettingsController {
  async create(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }
      const { smtp_host, smtp_port, smtp_email, smtp_password, encryption } = req.body ?? {};

      const settings = await emailSettingsService.create(userId, {
        smtp_host,
        smtp_port,
        smtp_email,
        smtp_password,
        encryption
      });

      return res.status(201).json(settings);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async get(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }
      const settings = await emailSettingsService.getByUserId(userId);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }
      const id = Number(req.params.id);
      const { smtp_host, smtp_port, smtp_email, smtp_password, encryption } = req.body ?? {};

      const updated = await emailSettingsService.update(id, userId, {
        smtp_host,
        smtp_port,
        smtp_email,
        smtp_password,
        encryption
      });

      if (!updated) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }

      const settings = await emailSettingsService.getByUserId(userId);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async test(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }
      const settings = await emailSettingsService.getByUserId(userId);

      if (!settings) {
        return res.status(404).json({ message: "No hay configuración SMTP para este usuario" });
      }

      const secure = settings.encryption === "ssl";
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: Number(settings.smtp_port),
        secure,
        auth: {
          user: settings.smtp_email,
          pass: settings.smtp_password
        }
      });

      await transporter.sendMail({
        from: settings.smtp_email,
        to: settings.smtp_email,
        subject: "Prueba de configuración SMTP",
        text: "El sistema de recordatorios está configurado correctamente."
      });

      return res.json({ message: "Correo de prueba enviado" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new EmailSettingsController();
