-- Crear base de datos
CREATE DATABASE IF NOT EXISTS habitta_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE habitta_db;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user' NOT NULL,
  creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_creation_date (creation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar un usuario administrador por defecto (contraseña: admin123)
INSERT INTO users (name, email, password, phone, role) VALUES 
('Administrador', 'admin@habitta.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewhhBJh2BFOiwU8C', '1234567890', 'admin')
ON DUPLICATE KEY UPDATE name = name;

-- Insertar un usuario normal por defecto (contraseña: user123)
INSERT INTO users (name, email, password, phone, role) VALUES 
('Usuario Demo', 'user@habitta.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0987654321', 'user')
ON DUPLICATE KEY UPDATE name = name;
