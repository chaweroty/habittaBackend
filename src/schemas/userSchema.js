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
  role: z.enum(['admin', 'user', 'owner']).optional().default('user'),
  status: z.enum(['Verified', 'Unverified', 'Pending']).optional(),
  verificationCode: z.string().optional(),
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
  role: z.enum(['admin', 'user', 'owner']).optional(),
  status: z.enum(['Verified', 'Unverified', 'Pending']).optional(),
  verificationCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Debe ser un email válido')
});

const confirmVerificationSchema = z.object({
  verificationCode: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos')
});

const userIdSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
});

const requestOwnerRoleSchema = z.object({
  id: z.string().uuid('El ID del usuario debe ser un UUID válido'),
});

const updatePushTokenSchema = z.object({
  pushToken: z.string()
    .min(1, 'El push token es requerido')
    .regex(/^ExponentPushToken\[/, 'El push token debe ser un token válido de Expo')
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  userIdSchema,
  requestOwnerRoleSchema,
  updatePushTokenSchema
  ,resendVerificationSchema,
  confirmVerificationSchema
};
