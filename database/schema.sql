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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,

    INDEX idx_services_client (client_id),
    INDEX idx_services_expiration (expiration_date)
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
