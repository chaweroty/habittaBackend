const { z } = require('zod');

const createVerifyIdentitySchema = z.object({
  description: z.string().max(500, 'La descripción no puede exceder los 500 caracteres').optional().nullable(),
  url_document: z.string().url('La URL del documento debe ser una URL válida'),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional().default('pending')
});

module.exports = {
  createVerifyIdentitySchema
};
