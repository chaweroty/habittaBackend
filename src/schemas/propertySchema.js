const { z } = require('zod');

const imagePropertySchema = z.object({
  url_image: z.string().url(),
});

// Valores posibles para 'type':
//   - house (valor por defecto)
//   - apartament
//   - store
//   - office
//   - werehouse

// Valores posibles para 'publication_status':
//   - published (valor por defecto)
//   - rented
//   - disabled
//   - expired
const propertySchema = z.object({
  id_owner: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  price: z.number().positive(),
  type: z.enum(['house', 'apartament', 'store', 'office', 'werehouse']).optional(),
  rooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  area: z.number().positive(),
  services: z.string().min(1).max(2000, 'Los servicios no pueden exceder los 2000 caracteres'),
  publication_status: z.enum(['published', 'disabled']).optional(),
  images: z.array(imagePropertySchema).optional(),
  id_plan: z.number().int().optional(),
});

module.exports = {
  propertySchema,
  imagePropertySchema,
};
