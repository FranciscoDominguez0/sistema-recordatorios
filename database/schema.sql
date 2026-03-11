CREATE DATABASE reminder_app;
USE reminder_app;

-- =============================
-- USERS
-- =============================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_users_email (email)
);

-- Columnas agregadas después del despliegue inicial
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN receive_notifications TINYINT(1) NOT NULL DEFAULT 1;

-- Agregado en v1.x — Notificaciones de correo por usuario
ALTER TABLE users
  ADD COLUMN receive_notifications TINYINT(1) NOT NULL DEFAULT 1;


-- =============================
-- EMAIL SETTINGS (SMTP)
-- =============================

CREATE TABLE email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    smtp_host VARCHAR(150) NOT NULL,
    smtp_port INT NOT NULL,
    smtp_email VARCHAR(150) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    encryption ENUM('tls','ssl') DEFAULT 'tls',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_email_settings_user (user_id)
);

ALTER TABLE email_settings
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- =============================
-- CLIENTS
-- =============================

CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_clients_email (email),
    INDEX idx_clients_created (created_at)
);

-- =============================
-- SERVICES (SERVICIOS CON VENCIMIENTO)
-- =============================

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    expiration_date DATE NOT NULL,
    reminder_days INT DEFAULT 5,
    status ENUM('activo','vencido','completado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,

    INDEX idx_services_client (client_id),
    INDEX idx_services_expiration (expiration_date),
    INDEX idx_services_status (status)
);

-- =============================
-- INTERNAL TASKS (RECORDATORIOS INTERNOS)
-- =============================

CREATE TABLE internal_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status ENUM('pending','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_status (status)
);

-- =============================
-- REMINDER HISTORY
-- evita enviar recordatorios duplicados
-- =============================

CREATE TABLE reminder_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    reminder_date DATE NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,

    UNIQUE KEY unique_service_reminder (service_id, reminder_date),
    INDEX idx_reminder_service (service_id)
);

-- =============================
-- EMAIL LOGS (LOG DE CORREOS)
-- =============================

CREATE TABLE email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    service_id INT,
    email VARCHAR(150),
    subject VARCHAR(200),
    status ENUM('sent','failed'),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_email_client (client_id),
    INDEX idx_email_service (service_id),
    INDEX idx_email_sent (sent_at)
);

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_logs_user (user_id),
    INDEX idx_logs_entity (entity_type, entity_id),
    INDEX idx_logs_created (created_at)
);

CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_template_name (name)
);


-- =============================
-- NOTIFICATIONS (NOTIFICACIONES DEL SISTEMA)
-- =============================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    client_id INT NULL,
    service_id INT NULL,
    task_id INT NULL,

    type ENUM(
        'service_expiring',
        'service_expired',
        'task_due',
        'email_sent'
    ) NOT NULL,

    title VARCHAR(200) NOT NULL,
    message TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES internal_tasks(id) ON DELETE CASCADE,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_service (service_id),
    INDEX idx_notifications_task (task_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
);

-- =============================
-- COMPANY SETTINGS (IDENTIDAD DE EMPRESA)
-- =============================

CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,       -- siempre 1 sola fila global
    company_name VARCHAR(150) DEFAULT NULL,
    firma TEXT DEFAULT NULL,
    logo_base64 LONGTEXT DEFAULT NULL,  -- imagen PNG/JPG en base64
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fila inicial vacía
INSERT IGNORE INTO company_settings (id) VALUES (1);

-- =============================
-- CONSULTA RECORDATORIOS
-- servicios que vencen en X dias
-- =============================

SELECT s.*, c.email
FROM services s
JOIN clients c ON s.client_id = c.id
WHERE DATE_SUB(s.expiration_date, INTERVAL s.reminder_days DAY) = CURDATE();

-- =============================
-- PAGINACIÓN (10 registros)
-- =============================

-- CLIENTES
SELECT *
FROM clients
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- SERVICIOS
SELECT *
FROM services
ORDER BY expiration_date ASC
LIMIT 10 OFFSET 0;

-- TAREAS INTERNAS
SELECT *
FROM internal_tasks
ORDER BY due_date ASC
LIMIT 10 OFFSET 0;
