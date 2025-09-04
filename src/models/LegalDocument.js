/**
 * @typedef {Object} LegalDocument
 * @property {number} id - ID único del documento legal
 * @property {number} id_user - ID del usuario asociado
 * @property {number} [id_property] - ID de la propiedad asociada (opcional)
 * @property {number} [id_application] - ID de la aplicación asociada (opcional)
 * @property {string} type - Tipo de documento legal
 * @property {string} status - Estado del documento legal (ej: pendiente, aprobado, rechazado)
 * @property {Date} upload_date - Fecha de carga del documento
 * @property {User} user - Usuario asociado al documento
 * @property {Property} [property] - Propiedad asociada (opcional)
 * @property {Application} [application] - Aplicación asociada (opcional)
 */

// Este archivo es solo para documentación y referencia de los campos del modelo LegalDocument.

module.exports = {};