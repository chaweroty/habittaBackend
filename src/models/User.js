// Este archivo contiene las definiciones de tipos para el modelo User
// En JavaScript no necesitamos interfaces explícitas, pero las documentamos aquí

/**
 * @typedef {Object} User
 * @property {string} id - ID único del usuario (UUID)
 * @property {string} name - Nombre completo del usuario
 * @property {string} email - Correo electrónico (único)
 * @property {string} password - Contraseña hasheada
 * @property {string} phone - Teléfono de contacto
 * @property {'admin'|'user'|'propietario'} role - Rol del usuario
 * @property {'Verified'|'Unverified'|'Pending'} status - Estado de verificación del usuario
 * @property {string|null} verificationCode - Código de verificación para confirmación de email
 * @property {Date} creation_date - Fecha de creación del usuario
 * @property {Property[]} properties - Propiedades que posee el usuario
 * @property {Subscription[]} subscriptions - Suscripciones asociadas al usuario
 */

/**
 * @typedef {Object} UserWithoutPassword
 * @property {string} id - ID del usuario (UUID)
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {'admin'|'user'|'propietario'} role - Rol del usuario
 * @property {'Verified'|'Unverified'|'Pending'} status - Estado de verificación del usuario
 * @property {string|null} verificationCode - Código de verificación
 * @property {Date} creation_date - Fecha de creación
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} name - Nombre del usuario
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {string} phone - Teléfono del usuario
 * @property {'admin'|'user'|'propietario'} [role] - Rol del usuario
 * @property {'Verified'|'Unverified'|'Pending'} [status] - Estado de verificación (default: Unverified)
 * @property {string} [verificationCode] - Código de verificación
 */

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - Nombre del usuario
 * @property {string} [email] - Email del usuario
 * @property {string} [phone] - Teléfono del usuario
 * @property {'admin'|'user'|'propietario'} [role] - Rol del usuario
 * @property {'Verified'|'Unverified'|'Pending'} [status] - Estado de verificación del usuario
 * @property {string} [verificationCode] - Código de verificación
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

// Este archivo es solo para documentación y referencia de los campos del modelo User.
// 
// Estados de verificación del usuario:
// - Verified: Usuario activo y validado
// - Unverified: Usuario con correo pendiente de confirmar (por defecto)
// - Pending: Usuario pendiente de validación administrativa
//
// El verificationCode se usa para la confirmación de email y puede ser null cuando no se necesita.

module.exports = {};
