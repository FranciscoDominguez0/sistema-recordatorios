import pool from "../../config/database.js";
import companyService from "../company/company.service.js";
import emailLayoutService from "../email_layout/email_layout.service.js";

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

function buildCardFromTemplate({ cardContent, vars, accent = "#3b82f6", bg = "#f0f7ff", border = "#dbeafe" }) {
  const raw = (cardContent ?? "").trim();
  if (!raw) return "";

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return "";

  const rows = lines.map((line) => {
    const idxPipe = line.indexOf("|");
    const idxColon = line.indexOf(":");
    const idx = idxPipe >= 0 ? idxPipe : idxColon;
    if (idx < 0) return { label: "", value: line };
    return {
      label: line.slice(0, idx).trim(),
      value: line.slice(idx + 1).trim()
    };
  });

  const htmlRows = rows
    .map((r, i) => {
      const top = i === 0 ? "" : `border-top:1px solid ${border};`;
      const label = r.label ? interpolate(r.label, vars) : "";
      const value = r.value ? interpolate(r.value, vars) : "";
      return `
      <tr>
        <td style="padding:5px 0;width:40%;${top}">
          ${label ? `<span style=\"color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;\">${label}</span>` : ""}
        </td>
        <td style="padding:5px 0;${top}">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${value}</span>
        </td>
      </tr>`;
    })
    .join("\n");

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:${bg};border-left:4px solid ${accent};border-radius:6px;margin:16px 0 20px;">
  <tr><td style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${htmlRows}
    </table>
  </td></tr>
</table>`;
}

/** Sustituye {{variable}} en cualquier string */
function interpolate(text, vars) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/** Convierte texto plano con saltos de línea en párrafos HTML limpios */
function textToHtml(text) {
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      return t === "" ? "" : `<p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.65;">${t}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/** URL del logo o nombre de empresa como texto */
function buildLogoHtml(company) {
  const backendUrl = (process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  if (backendUrl && company?.logo_base64) {
    const logoUrl = `${backendUrl}/company/logo`;
    return `<img src="${logoUrl}" alt="${company.company_name || ""}" style="max-height:44px;max-width:180px;object-fit:contain;display:block;"/>`;
  }
  const name = company?.company_name || "Sistema de recordatorios";
  return `<span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">${name}</span>`;
}

/** Bloque HTML de la firma */
function buildFirmaHtml(firma) {
  if (!firma) return "";
  return `
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e8edf3;padding:16px 24px;">
        <p style="margin:0 0 3px;color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Firma</p>
        <div style="color:#334155;font-size:13px;line-height:1.6;">${firma.replace(/\n/g, "<br/>")}</div>
      </td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tarjetas de información (generadas automáticamente — el cliente nunca las toca)
// ─────────────────────────────────────────────────────────────────────────────

function buildServiceCard({ cliente, servicio, fecha }) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#f0f7ff;border-left:4px solid #3b82f6;border-radius:6px;margin:16px 0 20px;">
  <tr><td style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:5px 0;width:40%;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Cliente</span>
        </td>
        <td style="padding:5px 0;">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${cliente}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Servicio</span>
        </td>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${servicio}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Vencimiento</span>
        </td>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#dc2626;font-size:14px;font-weight:700;">${fecha}</span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

function buildClientServiceCard({ servicio, fecha }) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#f0f7ff;border-left:4px solid #3b82f6;border-radius:6px;margin:16px 0 20px;">
  <tr><td style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:5px 0;width:40%;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Servicio</span>
        </td>
        <td style="padding:5px 0;">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${servicio}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Fecha de vencimiento</span>
        </td>
        <td style="padding:5px 0;border-top:1px solid #dbeafe;">
          <span style="color:#dc2626;font-size:14px;font-weight:700;">${fecha}</span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

function buildTaskCard({ admin, tarea, fecha }) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;margin:16px 0 20px;">
  <tr><td style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:5px 0;width:40%;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Administrador</span>
        </td>
        <td style="padding:5px 0;">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${admin}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;border-top:1px solid #ede9fe;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Tarea</span>
        </td>
        <td style="padding:5px 0;border-top:1px solid #ede9fe;">
          <span style="color:#0f172a;font-size:14px;font-weight:600;">${tarea}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;border-top:1px solid #ede9fe;">
          <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Fecha programada</span>
        </td>
        <td style="padding:5px 0;border-top:1px solid #ede9fe;">
          <span style="color:#7c3aed;font-size:14px;font-weight:700;">${fecha}</span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cargar plantilla desde la base de datos
// ─────────────────────────────────────────────────────────────────────────────
export async function getTemplateByName(name) {
  // Compatibilidad: algunas migraciones antiguas usan columna `body` en vez de `content`
  const [hasContent] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'content'");
  const [hasCard] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'card_content'");
  const contentExpr = (Array.isArray(hasContent) && hasContent.length > 0) ? "content" : "body";
  const cardExpr = (Array.isArray(hasCard) && hasCard.length > 0) ? "card_content" : "''";
  const [rows] = await pool.query(
    `SELECT subject, ${contentExpr} AS content, ${cardExpr} AS card_content FROM email_templates WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor de renderizado principal
// - content: texto plano interpolado (del cliente)
// - cardHtml: tarjeta de datos auto-generada (nunca editable)
// ─────────────────────────────────────────────────────────────────────────────
async function renderEmail({ templateName, vars, cardHtml, defaultSubject }) {
  const [layout, template, company] = await Promise.all([
    emailLayoutService.get().catch(() => null),
    getTemplateByName(templateName),
    companyService.get().catch(() => null)
  ]);

  const rawSubject  = template?.subject  || defaultSubject;
  const rawContent  = template?.content  || "";

  const templateCard = (template?.card_content ?? "").trim();

  const subject     = interpolate(rawSubject, vars);
  // El content es texto plano — se interpolan las variables y se convierte a párrafos HTML
  const contentHtml = textToHtml(interpolate(rawContent, vars));

  const cardBlock = templateCard
    ? buildCardFromTemplate({ cardContent: templateCard, vars })
    : (cardHtml || "");

  // Bloque final = texto del cliente + tarjeta de datos automática
  const bodyBlock   = contentHtml + cardBlock;

  const companyName = company?.company_name || "Sistema de recordatorios";
  const logoHtml    = buildLogoHtml(company);
  const firmaHtml   = buildFirmaHtml(company?.firma);

  let html;
  if (layout) {
    const layoutVars = { subject, company_name: companyName, logo_html: logoHtml, firma_html: firmaHtml };
    html = interpolate(layout.header_html, layoutVars) + bodyBlock + interpolate(layout.footer_html, layoutVars);
  } else {
    html = buildFallbackHtml({ subject, bodyBlock, companyName, logoHtml, firmaHtml });
  }

  return { subject, html, attachments: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback HTML si email_layout no existe aún en BD
// ─────────────────────────────────────────────────────────────────────────────
function buildFallbackHtml({ subject, bodyBlock, companyName, logoHtml, firmaHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a6e 100%);padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>${logoHtml}</td>
              <td align="right"><span style="color:rgba(255,255,255,0.5);font-size:10px;">NOTIFICACIÓN AUTOMÁTICA</span></td>
            </tr></table>
          </td>
        </tr>
        <tr><td style="background:#ffffff;padding:24px;">${bodyBlock}</td></tr>
        ${firmaHtml}
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e8edf3;padding:14px 24px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
              Mensaje automático de <strong>${companyName}</strong> · Por favor no respondas este correo
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
// Builders públicos
// ─────────────────────────────────────────────────────────────────────────────

/** Recordatorio al CLIENTE */
export async function buildClientReminderEmail({ clientName, serviceName, expirationDate }) {
  const fecha = formatDate(expirationDate);
  return renderEmail({
    templateName:   "cliente_recordatorio",
    vars:           { cliente: clientName, servicio: serviceName, fecha_vencimiento: fecha },
    cardHtml:       buildClientServiceCard({ servicio: serviceName, fecha }),
    defaultSubject: `Recordatorio: tu servicio ${serviceName} vence el ${fecha}`
  });
}

/** Aviso al ADMINISTRADOR (servicio por vencer) */
export async function buildAdminReminderEmail({ adminName, clientName, serviceName, expirationDate }) {
  const fecha = formatDate(expirationDate);
  return renderEmail({
    templateName:   "admin_reminder",
    vars:           { admin: adminName, cliente: clientName, servicio: serviceName, fecha_vencimiento: fecha },
    cardHtml:       buildServiceCard({ cliente: clientName, servicio: serviceName, fecha }),
    defaultSubject: `[Aviso Interno] Vencimiento próximo: ${serviceName} — ${clientName}`
  });
}

/** Tarea interna al ADMINISTRADOR */
export async function buildTaskReminderEmail({ adminName, taskTitle, taskDescription, dueDate }) {
  const fecha = formatDate(dueDate);
  return renderEmail({
    templateName:   "interno_tarea",
    vars:           { admin: adminName, tarea: taskTitle, descripcion: taskDescription || "", fecha_vencimiento: fecha },
    cardHtml:       buildTaskCard({ admin: adminName, tarea: taskTitle, fecha }),
    defaultSubject: `Recordatorio de tarea: ${taskTitle}`
  });
}

// Compatibilidad con código anterior
export function buildReminderEmail({ clientName, serviceName, expirationDate }) {
  return buildClientReminderEmail({ clientName, serviceName, expirationDate });
}
