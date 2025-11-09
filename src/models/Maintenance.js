// Este archivo contiene las definiciones de tipos para el modelo Maintenance
// En JavaScript no necesitamos interfaces explícitas, pero las documentamos aquí

/**
 * @typedef {Object} Maintenance
 * @property {string} id_maintenance - ID único del mantenimiento (UUID)
 * @property {string} id_property - ID de la propiedad
 * @property {string} id_owner - ID del propietario
 * @property {string} id_user - ID del inquilino/usuario
 * @property {string} title - Título del mantenimiento
 * @property {string|null} description - Descripción detallada del mantenimiento
 * @property {'pending'|'accepted'|'confirmed'|'rejected'|'completed'} status - Estado del mantenimiento
 * @property {'owner'|'user'} responsibility - Responsable del costo
 * @property {number|null} cost_estimate - Estimado del costo
 * @property {Date|null} scheduled_date - Fecha programada
 * @property {Date|null} confirmed_date - Fecha de confirmación
 * @property {Date|null} completed_date - Fecha de finalización
 * @property {Object|null} attachments - Adjuntos (imágenes, documentos) en formato JSON
 * @property {'owner'|'user'} created_by - Quién creó el mantenimiento
 * @property {string|null} id_payment - ID del pago asociado (si aplica)
 * @property {Date} created_at - Fecha de creación
 * @property {Date} updated_at - Fecha de última actualización
 * @property {Property} property - Propiedad asociada
 * @property {User} owner - Propietario
 * @property {User} user - Inquilino/usuario
 * @property {Payment|null} payment - Pago asociado (si aplica)
 */

/**
 * @typedef {Object} CreateMaintenanceRequest
 * @property {string} id_property - ID de la propiedad (requerido)
 * @property {string} id_owner - ID del propietario (requerido)
 * @property {string} id_user - ID del inquilino (requerido)
 * @property {string} title - Título del mantenimiento (requerido)
 * @property {string} [description] - Descripción del mantenimiento
 * @property {'owner'|'user'} created_by - Quién crea el mantenimiento (requerido)
 * @property {'owner'|'user'} [responsibility] - Responsable del costo (default: owner)
 * @property {number} [cost_estimate] - Estimado del costo
 * @property {Date} [scheduled_date] - Fecha programada (solo si lo crea el owner)
 * @property {Object} [attachments] - Adjuntos en formato JSON
 */

/**
 * @typedef {Object} UpdateMaintenanceRequest
 * @property {'pending'|'accepted'|'confirmed'|'rejected'|'completed'} [status] - Cambiar estado
 * @property {'owner'|'user'} [responsibility] - Cambiar responsable del costo
 * @property {number} [cost_estimate] - Actualizar estimado
 * @property {Date} [scheduled_date] - Programar/cambiar fecha
 * @property {Date} [confirmed_date] - Fecha de confirmación
 * @property {Date} [completed_date] - Fecha de finalización
 * @property {string} [id_payment] - Vincular pago
 * @property {Object} [attachments] - Actualizar adjuntos
 */

// ==================== FLUJO DE ESTADOS ====================
//
// A. CREADO POR INQUILINO (user):
//    1. user crea → status: pending
//    2. owner acepta → status: accepted (define fecha, costo, responsable)
//    3. user confirma → status: confirmed (y se crea payment si aplica)
//    4. cualquiera marca → status: completed
//    * owner puede rechazar en cualquier momento → status: rejected
//
// B. CREADO POR PROPIETARIO (owner):
//    1. owner crea → status: accepted (ya con fecha, costo, responsable)
//    2. user confirma → status: confirmed (y se crea payment si aplica)
//    3. cualquiera marca → status: completed
//    * user puede rechazar → status: rejected
//
// ==================== REGLAS DE NEGOCIO ====================
//
// 1. created_by determina el flujo inicial:
//    - Si created_by = 'user' → status inicial = 'pending'
//    - Si created_by = 'owner' → status inicial = 'accepted'
//
// 2. Transiciones de estado permitidas:
//    - pending → accepted (owner acepta)
//    - pending → rejected (owner rechaza)
//    - accepted → confirmed (user confirma)
//    - accepted → rejected (user rechaza)
//    - confirmed → completed (cualquiera)
//    - rejected → (final, no hay transición)
//    - completed → (final, no hay transición)
//
// 3. Campos obligatorios según estado:
//    - accepted: debe tener scheduled_date, cost_estimate, responsibility
//    - confirmed: debe tener confirmed_date, y si responsibility='user' debe tener id_payment
//    - completed: debe tener completed_date
//
// 4. responsibility define quién paga:
//    - 'owner': El propietario asume el costo (no se crea payment)
//    - 'user': El inquilino paga (se debe crear un Payment vinculado)
//
// 5. Permisos de actualización:
//    - owner puede: aceptar, rechazar, programar, definir costo/responsable, completar
//    - user puede: crear solicitud, confirmar, rechazar (si created_by='owner'), completar
//
// ==================== EJEMPLOS DE CONSULTAS ====================

/**
 * Ejemplo: Crear mantenimiento como inquilino
 * 
 * const maintenance = await prisma.maintenance.create({
 *   data: {
 *     id_property: propertyId,
 *     id_owner: ownerId,
 *     id_user: userId,
 *     title: 'Fuga en la cocina',
 *     description: 'Hay una fuga debajo del fregadero',
 *     created_by: 'user',
 *     status: 'pending', // Estado inicial cuando lo crea el user
 *     attachments: {
 *       images: ['https://example.com/image1.jpg']
 *     }
 *   },
 *   include: {
 *     property: true,
 *     owner: { select: { id: true, name: true, email: true, pushToken: true } },
 *     user: { select: { id: true, name: true, email: true } }
 *   }
 * });
 */

/**
 * Ejemplo: Propietario acepta y programa mantenimiento
 * 
 * const updated = await prisma.maintenance.update({
 *   where: { id_maintenance: maintenanceId },
 *   data: {
 *     status: 'accepted',
 *     scheduled_date: new Date('2025-11-15T10:00:00'),
 *     cost_estimate: 150000,
 *     responsibility: 'owner' // El propietario asume el costo
 *   }
 * });
 */

/**
 * Ejemplo: Usuario confirma mantenimiento y paga
 * 
 * // Primero crear el pago si responsibility = 'user'
 * const payment = await prisma.payment.create({
 *   data: {
 *     id_payer: userId,
 *     id_receiver: ownerId,
 *     related_type: 'maintenance',
 *     id_related: maintenanceId,
 *     concept: 'Pago mantenimiento - Fuga en cocina',
 *     amount: 150000,
 *     currency: 'COP',
 *     status: 'pending'
 *   }
 * });
 * 
 * // Luego actualizar el mantenimiento
 * const confirmed = await prisma.maintenance.update({
 *   where: { id_maintenance: maintenanceId },
 *   data: {
 *     status: 'confirmed',
 *     confirmed_date: new Date(),
 *     id_payment: payment.id_pay
 *   }
 * });
 */

/**
 * Ejemplo: Obtener mantenimientos de un inquilino
 * 
 * const myMaintenances = await prisma.maintenance.findMany({
 *   where: { id_user: userId },
 *   include: {
 *     property: { select: { id: true, title: true, address: true } },
 *     owner: { select: { id: true, name: true, phone: true } },
 *     payment: true
 *   },
 *   orderBy: { created_at: 'desc' }
 * });
 */

/**
 * Ejemplo: Obtener mantenimientos pendientes de un propietario
 * 
 * const pendingMaintenances = await prisma.maintenance.findMany({
 *   where: {
 *     id_owner: ownerId,
 *     status: 'pending'
 *   },
 *   include: {
 *     property: { select: { title: true, address: true } },
 *     user: { select: { name: true, phone: true, email: true } }
 *   },
 *   orderBy: { created_at: 'asc' }
 * });
 */

/**
 * Ejemplo: Marcar como completado
 * 
 * const completed = await prisma.maintenance.update({
 *   where: { id_maintenance: maintenanceId },
 *   data: {
 *     status: 'completed',
 *     completed_date: new Date()
 *   }
 * });
 */

// Estados del mantenimiento:
// - pending: Solicitud creada por inquilino, esperando aceptación del propietario
// - accepted: Aprobado por propietario (con fecha y costo), esperando confirmación del inquilino
// - confirmed: Confirmado por inquilino, listo para ejecutar
// - rejected: Rechazado por propietario o inquilino
// - completed: Mantenimiento finalizado

// Quién crea el mantenimiento:
// - owner: El propietario crea un mantenimiento programado (preventivo o correctivo)
// - user: El inquilino reporta un problema que requiere mantenimiento

// Responsable del costo:
// - owner: El propietario asume el costo (mantenimientos estructurales, daños por uso normal)
// - user: El inquilino asume el costo (daños causados por mal uso, servicios adicionales)

module.exports = {};
