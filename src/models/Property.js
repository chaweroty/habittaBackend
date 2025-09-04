/**
 * @typedef {Object} Property
 * @property {number} id - ID único de la propiedad
 * @property {number} id_owner - ID del usuario propietario
 * @property {string} title - Título de la publicación
 * @property {string} description - Descripción detallada de la propiedad
 * @property {string} address - Dirección física de la propiedad
 * @property {string} city - Ciudad donde se ubica la propiedad
 * @property {number} price - Precio de la propiedad
 * @property {string} type - Tipo de propiedad (ej: casa, departamento, local)
 * @property {number} rooms - Número de habitaciones
 * @property {number} bathrooms - Número de baños
 * @property {number} area - Área en m²
 * @property {string} services - Servicios incluidos (ej: agua, luz, internet; separados por comas)
 * @property {string} publication_status - Estado de publicación (ej: activo, pausado, eliminado)
 * @property {Date} publication_date - Fecha de publicación
 * @property {User} owner - Usuario propietario de la propiedad
 * @property {Subscription} subscription - Suscripción asociada a la propiedad (uno a uno)
 */

// Este archivo es solo para documentación y referencia de los campos del modelo Property.

module.exports = {};
