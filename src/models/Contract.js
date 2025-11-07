/**
 * @typedef {Object} Contract
 * @property {string} id_contract - ID único del contrato
 * @property {string} id_application - ID de la aplicación asociada
 * @property {string} id_owner - ID del propietario asociado
 * @property {string} [id_document] - ID del documento legal asociado (opcional)
 * @property {string} id_renter - ID del inquilino asociado
 * @property {Date} start_date - Fecha de inicio del contrato
 * @property {Date} [end_date] - Fecha de finalización del contrato (opcional)
 * @property {number} rent_amount - Monto del alquiler
 * @property {string} payment_frequency - Frecuencia de pago (ej: mensual, semanal)
 * @property {string} status - Estado del contrato (ej: activo, terminado, cancelado)
 * @property {Application} application - Aplicación asociada al contrato
 * @property {User} owner - Propietario asociado al contrato
 * @property {LegalDocument} [document] - Documento legal asociado (opcional)
 * @property {User} renter - Inquilino asociado al contrato
 */

// Este archivo es solo para documentación y referencia de los campos del modelo Contract.

module.exports = {};