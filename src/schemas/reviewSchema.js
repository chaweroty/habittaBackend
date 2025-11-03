const { z } = require('zod');

const reviewSchema = z.object({
  id_application: z.string().uuid(),
  id_author: z.string().uuid(),
  id_receiver: z.string().uuid(),
  rating: z.boolean(),
  comment: z.string().max(500, 'El comentario no puede exceder los 500 caracteres').optional(),
  context_type: z.enum(['normal', 'cancelledByTenant', 'cancelledByOwner', 'breachByTenant', 'breachByOwner', 'other']),
  weight: z.number().positive(),
  status: z.enum(['pending', 'published', 'disabled', 'deleted']),
});

module.exports = {
  reviewSchema,
};