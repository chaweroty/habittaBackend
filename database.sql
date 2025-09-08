-- Crear base de datos
CREATE DATABASE IF NOT EXISTS db_habitta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE db_habitta;

INSERT INTO user (id, name, email, password, phone, role) VALUES 
(UUID(), 'Administrador', 'admin@habitta.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewhhBJh2BFOiwU8C', '1234567890', 'admin')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO user (id, name, email, password, phone, role) VALUES 
(UUID(), 'Usuario Demo', 'user@habitta.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0987654321', 'user')
ON DUPLICATE KEY UPDATE name = name;
