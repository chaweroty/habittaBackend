const { z } = require('zod');

const createVerifyIdentitySchema = z.object({
  description: z.string().max(1000, 'La descripción no puede exceder los 1000 caracteres').optional().nullable(),
  url_document: z.string().url('La URL del documento debe ser una URL válida'),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional().default('pending')
});

module.exports = {
  createVerifyIdentitySchema
};
