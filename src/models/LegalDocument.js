/**
 * @typedef {Object} LegalDocument
 * @property {string} id - ID único del documento legal
 * @property {string} [id_user] - ID del usuario asociado (opcional)
 * @property {string} [id_property] - ID de la propiedad asociada (opcional)
 * @property {string} [id_application] - ID de la aplicación asociada (opcional)
 * @property {string} type - Tipo de documento legal
 * @property {string} description - Descripción del documento legal
 * @property {string} [notes] - Notas adicionales sobre el documento (opcional)
 * @property {string} url_document - URL del documento almacenado
 * @property {Date} upload_date - Fecha de carga del documento
 * @property {string} status - Estado del documento legal (ej: pendiente, aprobado, rechazado)
 * @property {User} [user] - Usuario asociado al documento (opcional)
 * @property {Property} [property] - Propiedad asociada (opcional)
 * @property {Application} [application] - Aplicación asociada (opcional)
 */

// Este archivo es solo para documentación y referencia de los campos del modelo LegalDocument.

module.exports = {};