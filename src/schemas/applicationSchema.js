const { z } = require('zod');

// Esquema para crear una aplicación
const createApplicationSchema = z.object({
  id_property: z.string().uuid('El ID de la propiedad debe ser un UUID válido'),
  status: z.enum(['pending', 'pre_approved', 'approved', 'rejected', 'withdrawn']).optional().default('pending'),
  description: z.string()
    .max(500, 'La descripción no puede exceder los 500 caracteres')
    .optional()
    .nullable()
});

// Esquema para actualizar una aplicación
const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'pre_approved', 'approved', 'rejected', 'withdrawn']).optional(),
  description: z.string()
    .max(500, 'La descripción no puede exceder los 500 caracteres')
    .optional()
    .nullable()
});

// Esquema para actualización por parte del renter (solo descripción)
const updateApplicationByRenterSchema = z.object({
  description: z.string()
    .max(500, 'La descripción no puede exceder los 500 caracteres')
    .optional()
    .nullable()
});

module.exports = {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationByRenterSchema
};