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

export async function seedDefaultTemplates() {
  try {
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
      console.error("❌ Error al sembrar plantillas:", error.message);
    }
  }
}
