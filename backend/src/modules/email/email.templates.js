import pool from "../../config/database.js";

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

// ─────────────────────────────────────────────────────────────────────────────
// HTML wrapper profesional
// ─────────────────────────────────────────────────────────────────────────────
function wrapInHtml({ subject, bodyText, companyName = "Sistema de recordatorios" }) {
  const paragraphs = bodyText
    .split("\n")
    .map((line) => (line.trim() === "" ? "<br/>" : `<p style="margin:0 0 10px;">${line}</p>`))
    .join("\n");

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
                <td>
                  <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">${companyName}</span>
                </td>
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
  const template = await getTemplateByName("cliente_recordatorio");

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

  const html = wrapInHtml({ subject, bodyText });

  return { subject, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder: aviso al ADMINISTRADOR
// ─────────────────────────────────────────────────────────────────────────────
export async function buildAdminReminderEmail({ adminName, clientName, serviceName, expirationDate }) {
  const template = await getTemplateByName("admin_reminder");

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

  const html = wrapInHtml({ subject, bodyText });

  return { subject, html };
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
