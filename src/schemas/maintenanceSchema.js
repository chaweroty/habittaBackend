const { z } = require('zod');

// Enum para MaintenanceStatus
const maintenanceStatusEnum = z.enum(['pending', 'accepted', 'confirmed', 'rejected', 'completed']);

// Enum para MaintenanceCreatedBy
const maintenanceCreatedByEnum = z.enum(['owner', 'user']);

// Enum para MaintenanceResponsibility
const maintenanceResponsibilityEnum = z.enum(['owner', 'user']);

// Schema para crear un mantenimiento
const createMaintenanceSchema = z.object({
  id_property: z.string().uuid('id_property debe ser un UUID válido'),
  id_owner: z.string().uuid('id_owner debe ser un UUID válido'),
  id_user: z.string().uuid('id_user debe ser un UUID válido'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional().nullable(),
  created_by: maintenanceCreatedByEnum,
  responsibility: maintenanceResponsibilityEnum.default('owner'),
  cost_estimate: z.number().positive('El costo estimado debe ser positivo').optional().nullable(),
  scheduled_date: z.string().datetime('scheduled_date debe ser una fecha válida en formato ISO').optional().nullable().or(z.date()),
  attachments: z.record(z.any()).optional().nullable()
});

// Schema para actualizar un mantenimiento
const updateMaintenanceSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: maintenanceStatusEnum.optional(),
  responsibility: maintenanceResponsibilityEnum.optional(),
  cost_estimate: z.number().positive().optional().nullable(),
  scheduled_date: z.string().datetime().optional().nullable().or(z.date()),
  confirmed_date: z.string().datetime().optional().nullable().or(z.date()),
  completed_date: z.string().datetime().optional().nullable().or(z.date()),
  id_payment: z.string().uuid().optional().nullable(),
  attachments: z.record(z.any()).optional().nullable()
}).strict();

module.exports = {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceStatusEnum,
  maintenanceCreatedByEnum,
  maintenanceResponsibilityEnum
};
