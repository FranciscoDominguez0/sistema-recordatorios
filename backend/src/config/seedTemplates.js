import pool from "../config/database.js";

// Plantillas en texto plano — el cliente edita solo el mensaje, no HTML.
// La tarjeta de datos (cliente, servicio, fecha) se genera automáticamente en el backend.
const DEFAULT_TEMPLATES = [
  {
    name: "cliente_recordatorio",
    subject: "Recordatorio: tu servicio {{servicio}} vence el {{fecha_vencimiento}}",
    template_type: "client_service_reminder",
    card_content: "Servicio|{{servicio}}\nFecha de vencimiento|{{fecha_vencimiento}}",
    content:
`Estimado/a {{cliente}},

Te informamos que el servicio contratado está próximo a su fecha de vencimiento.

Para continuar disfrutando del servicio sin interrupciones, te recomendamos gestionar la renovación antes de la fecha indicada.

Si tienes alguna pregunta, no dudes en contactarnos. Estamos a tu disposición.

Gracias por confiar en nosotros.`
  },
  {
    name: "cliente_ultimo_dia",
    subject: "Último día: tu servicio {{servicio}} vence hoy ({{fecha_vencimiento}})",
    template_type: "client_service_last_day",
    card_content: "Servicio|{{servicio}}\nVence hoy|{{fecha_vencimiento}}",
    content:
`Estimado/a {{cliente}},

Hoy es el último día de vigencia del servicio {{servicio}}.

Si ya realizaste la renovación, puedes ignorar este mensaje.`
  },
  {
    name: "admin_reminder",
    subject: "[Aviso Interno] Vencimiento próximo: {{servicio}} — {{cliente}}",
    template_type: "admin_service_expiring",
    card_content: "Cliente|{{cliente}}\nServicio|{{servicio}}\nVencimiento|{{fecha_vencimiento}}",
    content:
`Hola {{admin}},

Te notificamos que el siguiente servicio está próximo a vencer y requiere atención.

Por favor revisa el panel de administración para coordinar la renovación con el cliente.

Este aviso fue generado automáticamente por el sistema.`
  },
  {
    name: "interno_tarea",
    subject: "Recordatorio de tarea: {{tarea}}",
    template_type: "internal_task",
    card_content: "Administrador|{{admin}}\nTarea|{{tarea}}\nFecha programada|{{fecha_vencimiento}}",
    content:
`Hola {{admin}},

Este es un recordatorio automático sobre una tarea interna pendiente que requiere tu atención.

Por favor asegúrate de completarla antes de la fecha programada.

Si ya fue atendida, puedes marcarla como completada en el sistema.`
  }
];

const RED_HEADER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- HEADER BANNER -->
        <tr>
          <td style="background:linear-gradient(135deg,#000000 0%,#270505 100%);padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>{{logo_html}}</td>
                <td align="right">
                  <span style="color:rgba(255,255,255,0.6);font-size:12px;">Notificación del sistema</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BARRA ROJA DEL ASUNTO -->
        <tr>
          <td style="background:#dc2626;padding:12px 32px;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">{{subject}}</p>
          </td>
        </tr>

        <!-- CONTENIDO -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 0;">`;

const RED_FOOTER_HTML = `        <!-- FIN CONTENIDO -->
          </td>
        </tr>

        <!-- FIRMA -->
        {{firma_html}}

        <!-- FOOTER -->
        <tr>
          <td style="background:#000000;padding:16px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-align:center;">
              Mensaje generado automáticamente · {{company_name}}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

export async function seedDefaultTemplates() {
  try {
    // 1. Sembrar/Actualizar Layout Rojo
    try {
      await pool.query(
        `INSERT INTO email_layout (id, header_html, footer_html, max_width)
         VALUES (1, ?, ?, 600)
         ON DUPLICATE KEY UPDATE
           header_html = VALUES(header_html),
           footer_html = VALUES(footer_html)`,
        [RED_HEADER_HTML, RED_FOOTER_HTML]
      );
      console.log("✅ Diseño de correo (email_layout) corporativo sembrado/actualizado a color rojo.");
    } catch (layoutError) {
      console.warn("⚠️ No se pudo sembrar el diseño de correo (email_layout):", layoutError.message);
    }

    // 2. Sembrar/Actualizar Plantillas por Defecto
    const [hasContent] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'content'");
    const [hasBody] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'body'");
    const [hasType] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'template_type'");
    const [hasCard] = await pool.query("SHOW COLUMNS FROM email_templates LIKE 'card_content'");
    const cols = {
      content: Array.isArray(hasContent) && hasContent.length > 0,
      body: Array.isArray(hasBody) && hasBody.length > 0,
      template_type: Array.isArray(hasType) && hasType.length > 0,
      card_content: Array.isArray(hasCard) && hasCard.length > 0
    };

    for (const tpl of DEFAULT_TEMPLATES) {
      if (cols.content && cols.template_type) {
        await pool.query(
          cols.card_content
            ? `INSERT IGNORE INTO email_templates (name, subject, content, card_content, template_type)
               VALUES (?, ?, ?, ?, ?)`
            : `INSERT IGNORE INTO email_templates (name, subject, content, template_type)
               VALUES (?, ?, ?, ?)`,
          cols.card_content
            ? [tpl.name, tpl.subject, tpl.content, tpl.card_content ?? "", tpl.template_type]
            : [tpl.name, tpl.subject, tpl.content, tpl.template_type]
        );
        continue;
      }

      if (cols.body) {
        await pool.query(
          `INSERT IGNORE INTO email_templates (name, subject, body)
           VALUES (?, ?, ?)`,
          [tpl.name, tpl.subject, tpl.content]
        );
        continue;
      }

      await pool.query(
        `INSERT IGNORE INTO email_templates (name, subject)
         VALUES (?, ?)`,
        [tpl.name, tpl.subject]
      );
    }
    console.log("✅ Plantillas por defecto verificadas.");
  } catch (error) {
    if (!error.message?.includes("Unknown column")) {
      console.error("❌ Error al sembrar plantillas/diseño:", error.message);
    }
  }
}
