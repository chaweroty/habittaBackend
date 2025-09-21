const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class PropertyService {
  async createProperty(propertyData) {
    // propertyData debe incluir: datos de la propiedad y un array de imágenes
    const { images, ...propertyFields } = propertyData;
    // Asignar valores por defecto si no se envían
    if (!propertyFields.type) propertyFields.type = 'house';
    if (!propertyFields.publication_status) propertyFields.publication_status = 'published';

    // Filtrar imágenes válidas
    let validImages = [];
    if (Array.isArray(images)) {
      validImages = images.filter(img => img && typeof img.url_image === 'string' && img.url_image.trim() !== '');
    }

    // Si no hay al menos una imagen válida, lanzar error
    if (validImages.length === 0) {
      const error = new Error('Debe enviar al menos una imagen válida en el array de imágenes.');
      error.status = 400;
      throw error;
    }

    // Crear la propiedad
    const property = await prisma.property.create({
      data: {
        ...propertyFields,
        images: {
          create: validImages.map(img => ({ url_image: img.url_image }))
        }
      },
      include: { images: true }
    });
    return property;
  }

  async getProperty(id) {
    return prisma.property.findUnique({
      where: { id },
      include: { images: true }
    });
  }

  async getAllProperties() {
    return prisma.property.findMany({
      include: { images: true }
    });
  }

  async updateProperty(id, propertyData) {
    const { images, ...propertyFields } = propertyData;
    // Actualizar solo los campos de la propiedad
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: propertyFields,
      include: { images: true }
    });
    // Si se envían imágenes nuevas, agregarlas
    if (images && images.length > 0) {
      await prisma.imageProperty.createMany({
        data: images.map(img => ({ url_image: img.url_image, id_property: id }))
      });
    }
    return prisma.property.findUnique({
      where: { id },
      include: { images: true }
    });
  }

  async deleteProperty(id) {
    await prisma.imageProperty.deleteMany({ where: { id_property: id } });
    await prisma.property.delete({ where: { id } });
    return true;
  }

  async getPropertiesByOwner(ownerId) {
    return prisma.property.findMany({
      where: { id_owner: ownerId },
      include: { images: true }
    });
  }

  // Puedes agregar otros métodos si es necesario
}

module.exports = { PropertyService };
