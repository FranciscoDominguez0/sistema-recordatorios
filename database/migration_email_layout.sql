-- ============================================================
-- MIGRACIÓN: Arquitectura Layout + Plantillas de correo
-- Ejecutar en orden sobre la base de datos reminder_app
-- ============================================================

-- ─────────────────────────────────────────────
-- PASO 1: Eliminar tabla antigua de plantillas
-- ─────────────────────────────────────────────
DROP TABLE IF EXISTS email_templates_backup;

-- Backup seguro (no falla si email_templates no existe)
SET @tpl_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'email_templates'
);

SET @tpl_backup_sql := IF(
  @tpl_exists > 0,
  'CREATE TABLE email_templates_backup AS SELECT * FROM email_templates',
  'SELECT 1'
);

PREPARE stmt FROM @tpl_backup_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TABLE IF EXISTS email_templates;

DROP TABLE IF EXISTS email_layout;

-- ─────────────────────────────────────────────
-- PASO 2: Nueva tabla email_templates (solo contenido)
-- ─────────────────────────────────────────────
CREATE TABLE email_templates (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    subject        VARCHAR(200)  NOT NULL,
    content        TEXT          NOT NULL,
    card_content   TEXT          NOT NULL,
    template_type  ENUM(
                     'admin_service_expiring',
                     'client_service_reminder',
                     'internal_task'
                   ) NOT NULL,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_template_name (name)
);

-- ─────────────────────────────────────────────
-- PASO 3: Crear tabla email_layout (layout base)
-- ─────────────────────────────────────────────
CREATE TABLE email_layout (
    id           INT            PRIMARY KEY DEFAULT 1,
    header_html  TEXT           NOT NULL,
    footer_html  TEXT           NOT NULL,
    max_width    INT            DEFAULT 600,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- PASO 4: Insertar layout base profesional
-- (el backend sustituye {{company_name}} y {{logo_html}} en tiempo de ejecución)
-- ─────────────────────────────────────────────
INSERT INTO email_layout (id, header_html, footer_html, max_width) VALUES (
  1,

  -- HEADER
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a1628 0%,#1a3a6e 100%);padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>{{logo_html}}</td>
                <td align="right">
                  <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:0.05em;">NOTIFICACIÓN AUTOMÁTICA</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CONTENIDO: inicio del bloque blanco -->
        <tr>
          <td style="background:#ffffff;padding:24px 24px 0;">',

  -- FOOTER
  '        <!-- FIN CONTENIDO -->
          </td>
        </tr>

        <!-- FIRMA -->
        {{firma_html}}

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e8edf3;padding:14px 24px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.5;">
              Este mensaje es generado automáticamente por <strong>{{company_name}}</strong><br/>
              Por favor no respondas este correo
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>',

  600
);

-- ─────────────────────────────────────────────
-- PASO 5: Insertar las 3 plantillas de contenido
-- NOTA: el content es TEXTO PLANO editable por el usuario.
-- La tarjeta de datos (cliente, servicio, fecha) se genera automáticamente en el backend.
-- ─────────────────────────────────────────────

-- 1. Aviso al administrador (servicio por vencer)
INSERT INTO email_templates (name, subject, content, card_content, template_type) VALUES (
  'admin_reminder',
  '[Aviso Interno] Vencimiento próximo: {{servicio}} — {{cliente}}',
  'Hola {{admin}},

Te notificamos que el siguiente servicio está próximo a vencer y requiere atención.

Por favor revisa el panel de administración para coordinar la renovación con el cliente.

Este aviso fue generado automáticamente por el sistema.',
  'Cliente|{{cliente}}\nServicio|{{servicio}}\nVencimiento|{{fecha_vencimiento}}',
  'admin_service_expiring'
);

-- 2. Recordatorio al cliente
INSERT INTO email_templates (name, subject, content, card_content, template_type) VALUES (
  'cliente_recordatorio',
  'Recordatorio: tu servicio {{servicio}} vence el {{fecha_vencimiento}}',
  'Estimado/a {{cliente}},

Te informamos que el servicio contratado está próximo a su fecha de vencimiento.

Para continuar disfrutando del servicio sin interrupciones, te recomendamos gestionar la renovación antes de la fecha indicada.

Si tienes alguna pregunta, no dudes en contactarnos. Estamos a tu disposición.

Gracias por confiar en nosotros.',
  'Servicio|{{servicio}}\nFecha de vencimiento|{{fecha_vencimiento}}',
  'client_service_reminder'
);

-- 3. Tarea interna
INSERT INTO email_templates (name, subject, content, card_content, template_type) VALUES (
  'interno_tarea',
  'Recordatorio de tarea: {{tarea}}',
  'Hola {{admin}},

Este es un recordatorio automático sobre una tarea interna pendiente que requiere tu atención.

Por favor asegúrate de completarla antes de la fecha programada.

Si ya fue atendida, puedes marcarla como completada en el sistema.',
  'Administrador|{{admin}}\nTarea|{{tarea}}\nFecha programada|{{fecha_vencimiento}}',
  'internal_task'
);

-- ─────────────────────────────────────────────
-- PASO 6 (opcional recomendado): Restaurar contenido/asunto desde backup
-- - Si existía email_templates, se recuperan las plantillas editadas por el usuario.
-- - Compatible con backups que tengan columna `body` en vez de `content`.
-- ─────────────────────────────────────────────

-- 6.1 Restaurar SUBJECT
UPDATE email_templates t
JOIN email_templates_backup b ON b.name = t.name
SET t.subject = b.subject
WHERE b.subject IS NOT NULL AND b.subject <> '';

-- 6.2 Restaurar CONTENT desde content o body (según exista)
UPDATE email_templates t
JOIN email_templates_backup b ON b.name = t.name
SET t.content = COALESCE(NULLIF(b.content, ''), NULLIF(b.body, ''), t.content)
WHERE (b.content IS NOT NULL AND b.content <> '') OR (b.body IS NOT NULL AND b.body <> '');

-- 6.3 Restaurar CARD_CONTENT si existe en backup
SET @tpl_backup_has_card := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'email_templates_backup'
    AND column_name = 'card_content'
);

SET @tpl_restore_card_sql := IF(
  @tpl_backup_has_card > 0,
  'UPDATE email_templates t JOIN email_templates_backup b ON b.name = t.name SET t.card_content = COALESCE(NULLIF(b.card_content, ""), t.card_content) WHERE b.card_content IS NOT NULL AND b.card_content <> ""',
  'SELECT 1'
);

PREPARE stmt2 FROM @tpl_restore_card_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
