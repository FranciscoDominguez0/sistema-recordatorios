import pool from "../config/database.js";

const DEFAULT_TEMPLATES = [
  {
    name: "cliente_recordatorio",
    subject: "Recordatorio: {{servicio}} vence el {{fecha_vencimiento}}",
    body: `Estimado/a {{cliente}},

Le recordamos que el servicio contratado "{{servicio}}" tiene fecha de vencimiento el día {{fecha_vencimiento}}.

Para renovar o consultar más información, no dude en contactarnos. Estamos a su disposición para ayudarle.

Gracias por confiar en nosotros.`
  },
  {
    name: "admin_reminder",
    subject: "[AVISO INTERNO] Vencimiento próximo: {{servicio}} — {{cliente}}",
    body: `Hola {{admin}},

Se te notifica que el siguiente servicio está próximo a vencer:

Cliente:  {{cliente}}
Servicio: {{servicio}}
Vence el: {{fecha_vencimiento}}

Este correo fue enviado automáticamente por el sistema de recordatorios. El cliente ya recibió su aviso.

Accede al panel para revisar o actualizar el estado del servicio.`
  },
  {
    name: "interno_tarea",
    subject: "Recordatorio de tarea: {{tarea}}",
    body: `Hola {{admin}},

Este es un recordatorio automático sobre la siguiente tarea interna pendiente:

Tarea: {{tarea}}
Fecha límite: {{fecha_vencimiento}}

Por favor, asegúrate de completarla antes de la fecha indicada.

Si ya fue atendida, puedes marcarla como completada en el sistema.`
  }
];

export async function seedDefaultTemplates() {
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      await pool.query(
        `INSERT IGNORE INTO email_templates (name, subject, body) VALUES (?, ?, ?)`,
        [tpl.name, tpl.subject, tpl.body]
      );
    }
    console.log("✅ Plantillas por defecto verificadas.");
  } catch (error) {
    console.error("❌ Error al sembrar plantillas:", error.message);
  }
}

