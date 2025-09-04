const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class PropertyService {
  async createProperty(propertyData) {
    // propertyData debe incluir: datos de la propiedad y un array de imágenes
    const { images, ...propertyFields } = propertyData;
    // Crear la propiedad
    const property = await prisma.property.create({
      data: {
        ...propertyFields,
        images: images && images.length > 0
          ? {
              create: images.map(url => ({ url_image: url }))
            }
          : undefined
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
        data: images.map(url => ({ url_image: url, id_property: id }))
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

  // Puedes agregar otros métodos si es necesario
}

module.exports = { PropertyService };
