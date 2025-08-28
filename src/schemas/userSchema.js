const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  email: z.string()
    .email('Debe ser un email válido')
    .max(100, 'El email no puede tener más de 100 caracteres'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres'),
  phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(15, 'El teléfono no puede tener más de 15 dígitos')
    .regex(/^\d+$/, 'El teléfono solo puede contener números'),
  role: z.enum(['admin', 'user']).optional().default('user'),
});

const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .optional(),
  email: z.string()
    .email('Debe ser un email válido')
    .max(100, 'El email no puede tener más de 100 caracteres')
    .optional(),
  phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(15, 'El teléfono no puede tener más de 15 dígitos')
    .regex(/^\d+$/, 'El teléfono solo puede contener números')
    .optional(),
  role: z.enum(['admin', 'user']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'El ID debe ser un número válido'),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  userIdSchema
};
