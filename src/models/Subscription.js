const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @typedef {Object} Subscription
 * @property {number} id_subscription - ID único de la suscripción
 * @property {number} id_owner - ID del usuario propietario
 * @property {number} id_property - ID de la propiedad asociada
 * @property {string} type - Tipo de suscripción
 * @property {Date} start_date - Fecha de inicio de la suscripción
 * @property {Date} [final_date] - Fecha de finalización de la suscripción
 * @property {User} owner - Usuario propietario de la suscripción
 * @property {Property} property - Propiedad asociada a la suscripción
 */

// Este archivo es solo para documentación y referencia de los campos del modelo Subscription.

module.exports = {};
