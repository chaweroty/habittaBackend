// Este archivo contiene las definiciones de tipos para el modelo User
// En JavaScript no necesitamos interfaces explícitas, pero las documentamos aquí

/**
 * @typedef {Object} User
 * @property {number} [id] - ID del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {'admin'|'user'} role - Rol del usuario
 * @property {Date} [creation_date] - Fecha de creación
 */

/**
 * @typedef {Object} UserWithoutPassword
 * @property {number} id - ID del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {'admin'|'user'} role - Rol del usuario
 * @property {Date} creation_date - Fecha de creación
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {'admin'|'user'} [role] - Rol del usuario
 */

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - Nombre del usuario
 * @property {string} [email] - Email del usuario
 * @property {string} [phone] - Teléfono del usuario
 * @property {'admin'|'user'} [role] - Rol del usuario
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 */

/**
 * @typedef {Object} AuthResponse
 * @property {UserWithoutPassword} user - Usuario sin contraseña
 * @property {string} token - Token JWT
 */

module.exports = {};
