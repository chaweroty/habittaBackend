const { z } = require('zod');

const imagePropertySchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
});

const propertySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  location: z.string().min(1),
  images: z.array(imagePropertySchema).optional(),
});

module.exports = {
  propertySchema,
  imagePropertySchema,
};
