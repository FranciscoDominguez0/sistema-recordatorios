import transporter from "../../config/email.js";
import nodemailer from "nodemailer";

class EmailService {
  async sendMail({ to, subject, html }) {
    const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER;

    if (!from) {
      const error = new Error("EMAIL_FROM/EMAIL_USER no configurado");
      error.statusCode = 500;
      throw error;
    }

    return transporter.sendMail({
      from,
      to,
      subject,
      html
    });
  }

  async sendMailWithSmtpConfig(smtpConfig, { to, subject, html, text }) {
    const secure = smtpConfig.encryption === "ssl";
    const dynamicTransporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: Number(smtpConfig.smtp_port),
      secure,
      auth: {
        user: smtpConfig.smtp_email,
        pass: smtpConfig.smtp_password
      }
    });

    return dynamicTransporter.sendMail({
      from: smtpConfig.smtp_email,
      to,
      subject,
      html,
      text
    });
  }
}

export default new EmailService();
