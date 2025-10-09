/**
 * @typedef {Object} Review
 * @property {string} id - ID único de la reseña
 * @property {string} id_application - ID de la aplicación asociada
 * @property {string} id_author - ID del autor de la reseña
 * @property {string} id_receiver - ID del receptor de la reseña
 * @property {boolean} rating - Calificación de la reseña (true/false)
 * @property {string} comment - Comentario adicional (opcional)
 * @property {string} context_type - Tipo de contexto de la reseña (ej: Normal, CancelledByTenant, etc.)
 * @property {number} weight - Peso de la reseña
 * @property {string} status - Estado de la reseña (ej: Pending, Published, etc.)
 * @property {Date} create_date - Fecha de creación de la reseña
 */

// Este archivo es solo para documentación y referencia de los campos del modelo Review.

const Review = {
  id: "String",
  id_application: "String",
  id_author: "String",
  id_receiver: "String",
  rating: "Boolean",
  comment: "String?",
  context_type: "ContextType",
  weight: "Decimal",
  status: "ReviewStatus",
  create_date: "DateTime",
};

const ContextType = {
  Normal: "Normal",
  CancelledByTenant: "CancelledByTenant",
  CancelledByOwner: "CancelledByOwner",
  BreachByTenant: "BreachByTenant",
  BreachByOwner: "BreachByOwner",
  Other: "Other",
};

const ReviewStatus = {
  Pending: "Pending",
  Published: "Published",
  Disabled: "Disabled",
  Deleted: "Deleted",
};

module.exports = { Review, ContextType, ReviewStatus };