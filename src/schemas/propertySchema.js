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
  services: z.string().min(1),
  publication_status: z.enum(['published', 'rented', 'disabled', 'expired']).optional(),
  images: z.array(imagePropertySchema).optional(),
});

module.exports = {
  propertySchema,
  imagePropertySchema,
};
