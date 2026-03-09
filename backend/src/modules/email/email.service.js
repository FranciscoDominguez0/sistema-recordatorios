import transporter from "../../config/email.js";

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
}

export default new EmailService();
