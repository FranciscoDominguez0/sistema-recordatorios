import pool from "../../config/database.js";
import companyService from "../company/company.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Cargar plantilla desde la base de datos
// ─────────────────────────────────────────────────────────────────────────────
export async function getTemplateByName(name) {
  const [rows] = await pool.query(
    "SELECT subject, body FROM email_templates WHERE name = ? LIMIT 1",
    [name]
  );
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sustituir variables {{var}} en subject y body
// ─────────────────────────────────────────────────────────────────────────────
function interpolate(text, vars) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// Devuelve la URL más apropiada del logo para emails:
// - En producción (BACKEND_URL configurado) usa URL pública → Gmail lo carga sin problemas
// - En local usa base64 como fallback → funciona en Outlook/Thunderbird, no en Gmail
function getLogoSrc(company) {
  if (!company?.logo_base64) return "";
  const backendUrl = (process.env.BACKEND_URL || "").trim();
  if (backendUrl) {
    return `${backendUrl.replace(/\/$/, "")}/company/logo`;
  }
  return ""; // sin URL pública → se muestra el nombre de la empresa en texto
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML wrapper profesional
// ─────────────────────────────────────────────────────────────────────────────
function wrapInHtml({ subject, bodyText, companyName = "Sistema de recordatorios", logo = "", firma = "" }) {
  const paragraphs = bodyText
    .split("\n")
    .map((line) => (line.trim() === "" ? "<br/>" : `<p style="margin:0 0 10px;">${line}</p>`))
    .join("\n");

  const headerContent = logo
    ? `<img src="${logo}" alt="" style="max-height:48px;max-width:200px;object-fit:contain;display:block;"/>`
    : `<span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">${companyName}</span>`;

  const firmaSection = firma
    ? `<tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 32px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Firma</p>
        <div style="color:#334155;font-size:13px;line-height:1.6;">${firma.replace(/\n/g, "<br/>")}</div>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#08112F 0%,#1a2f6e 100%);padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>${headerContent}</td>
                <td align="right">
                  <span style="color:rgba(255,255,255,0.55);font-size:11px;">Notificación automática</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SUBJECT BAND -->
        <tr>
          <td style="background:#3B82F6;padding:12px 32px;">
            <p style="margin:0;color:#fff;font-size:14px;font-weight:600;line-height:1.4;">${subject}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:32px 32px 24px;">
            <div style="color:#1e293b;font-size:15px;line-height:1.7;">
              ${paragraphs}
            </div>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="background:#ffffff;padding:0 32px;">
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:0;"/>
          </td>
        </tr>

        ${firmaSection}

        <!-- FOOTER -->
        <tr>
          <td style="background:#F8FAFC;padding:16px 32px;border-bottom-left-radius:16px;border-bottom-right-radius:16px;">
            <p style="margin:0;color:#94A3B8;font-size:11px;text-align:center;">
              Este mensaje es generado automáticamente por ${companyName} · Por favor no respondas este correo
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder: recordatorio al CLIENTE
// ─────────────────────────────────────────────────────────────────────────────
export async function buildClientReminderEmail({ clientName, serviceName, expirationDate }) {
  const [template, company] = await Promise.all([
    getTemplateByName("cliente_recordatorio"),
    companyService.get().catch(() => null)
  ]);

  const vars = {
    cliente: clientName,
    servicio: serviceName,
    fecha_vencimiento: formatDate(expirationDate)
  };

  const subject = template
    ? interpolate(template.subject, vars)
    : `Recordatorio: ${serviceName} vence el ${formatDate(expirationDate)}`;

  const bodyText = template
    ? interpolate(template.body, vars)
    : `Estimado/a ${clientName},\n\nLe recordamos que el servicio "${serviceName}" vence el ${formatDate(expirationDate)}.\n\nGracias por confiar en nosotros.`;

  const html = wrapInHtml({
    subject,
    bodyText,
    companyName: company?.company_name || "Sistema de recordatorios",
    logo: getLogoSrc(company),
    firma: company?.firma || ""
  });

  return { subject, html, attachments: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder: aviso al ADMINISTRADOR
// ─────────────────────────────────────────────────────────────────────────────
export async function buildAdminReminderEmail({ adminName, clientName, serviceName, expirationDate }) {
  const [template, company] = await Promise.all([
    getTemplateByName("admin_reminder"),
    companyService.get().catch(() => null)
  ]);

  const vars = {
    admin: adminName,
    cliente: clientName,
    servicio: serviceName,
    fecha_vencimiento: formatDate(expirationDate)
  };

  const subject = template
    ? interpolate(template.subject, vars)
    : `[AVISO INTERNO] Vencimiento próximo: ${serviceName} — ${clientName}`;

  const bodyText = template
    ? interpolate(template.body, vars)
    : `Hola ${adminName},\n\nEl servicio "${serviceName}" del cliente ${clientName} vence el ${formatDate(expirationDate)}.\n\nRevisa el panel para más detalles.`;

  const html = wrapInHtml({
    subject,
    bodyText,
    companyName: company?.company_name || "Sistema de recordatorios",
    logo: getLogoSrc(company),
    firma: company?.firma || ""
  });

  return { subject, html, attachments: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibilidad con código anterior
// ─────────────────────────────────────────────────────────────────────────────
export function buildReminderEmail({ clientName, serviceName, expirationDate }) {
  const subject = `Recordatorio: ${serviceName} vence el ${formatDate(expirationDate)}`;
  const html = wrapInHtml({
    subject,
    bodyText: `Estimado/a ${clientName},\n\nLe recordamos que el servicio "${serviceName}" vence el ${formatDate(expirationDate)}.\n\nGracias por confiar en nosotros.`
  });
  return { subject, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder: tarea interna al ADMINISTRADOR
// ─────────────────────────────────────────────────────────────────────────────
export async function buildTaskReminderEmail({ adminName, taskTitle, taskDescription, dueDate }) {
  const [template, company] = await Promise.all([
    getTemplateByName("interno_tarea"),
    companyService.get().catch(() => null)
  ]);

  const vars = {
    admin: adminName,
    tarea: taskTitle,
    fecha_vencimiento: formatDate(dueDate)
  };

  const subject = template
    ? interpolate(template.subject, vars)
    : `Recordatorio de tarea: ${taskTitle}`;

  const bodyText = template
    ? interpolate(template.body, vars)
    : `Hola ${adminName},\n\nEste es un recordatorio sobre la tarea interna: "${taskTitle}".\n\n${taskDescription ? `Descripción: ${taskDescription}\n\n` : ""}Fecha límite: ${formatDate(dueDate)}\n\nPor favor, asegúrate de completarla antes de la fecha indicada.`;

  const html = wrapInHtml({
    subject,
    bodyText,
    companyName: company?.company_name || "Sistema de recordatorios",
    logo: getLogoSrc(company),
    firma: company?.firma || ""
  });

  return { subject, html, attachments: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("es-PA", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return String(date);
  }
}

