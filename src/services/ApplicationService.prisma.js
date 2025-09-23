const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ApplicationService {
  async createApplication(applicationData) {
    // Verificar que la propiedad existe
    const property = await prisma.property.findUnique({
      where: { id: applicationData.id_property }
    });
    
    if (!property) {
      const error = new Error('La propiedad especificada no existe.');
      error.status = 404;
      throw error;
    }

    // Verificar que el usuario no tenga ya una aplicación para esta propiedad
    const existingApplication = await prisma.application.findFirst({
      where: {
        id_renter: applicationData.id_renter,
        id_property: applicationData.id_property
      }
    });

    if (existingApplication) {
      const error = new Error('Ya tienes una aplicación para esta propiedad.');
      error.status = 400;
      throw error;
    }

    // Crear la aplicación
    const application = await prisma.application.create({
      data: {
        id_renter: applicationData.id_renter,
        id_property: applicationData.id_property,
        status: applicationData.status || 'pending',
        description: applicationData.description || null
      },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      }
    });

    return application;
  }

  async getApplication(id) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true, 
            id_owner: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      }
    });

    if (!application) {
      const error = new Error('Aplicación no encontrada.');
      error.status = 404;
      throw error;
    }

    return application;
  }

  async getAllApplications() {
    return prisma.application.findMany({
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true, 
            id_owner: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      },
      orderBy: { application_date: 'desc' }
    });
  }

  async getApplicationsByProperty(propertyId) {
    return prisma.application.findMany({
      where: { id_property: propertyId },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      },
      orderBy: { application_date: 'desc' }
    });
  }

  async getApplicationsByRenter(renterId) {
    return prisma.application.findMany({
      where: { id_renter: renterId },
      include: {
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true, 
            id_owner: true,
            images: {
              take: 1,
              select: { url_image: true }
            },
            owner: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      },
      orderBy: { application_date: 'desc' }
    });
  }

  async getApplicationsByOwner(ownerId) {
    return prisma.application.findMany({
      where: { 
        property: { 
          id_owner: ownerId 
        } 
      },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      },
      orderBy: { application_date: 'desc' }
    });
  }

  async updateApplication(id, applicationData) {
    // Verificar que la aplicación existe
    const existingApplication = await prisma.application.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      const error = new Error('Aplicación no encontrada.');
      error.status = 404;
      throw error;
    }

    // Actualizar la aplicación
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: applicationData.status,
        description: applicationData.description
      },
      include: {
        renter: {
          select: { id: true, name: true, email: true, phone: true }
        },
        property: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true, 
            id_owner: true,
            images: {
              take: 1,
              select: { url_image: true }
            }
          }
        }
      }
    });

    return updatedApplication;
  }

  async deleteApplication(id) {
    // Verificar que la aplicación existe
    const existingApplication = await prisma.application.findUnique({
      where: { id }
    });

    if (!existingApplication) {
      const error = new Error('Aplicación no encontrada.');
      error.status = 404;
      throw error;
    }

    // Eliminar documentos legales asociados primero
    await prisma.legalDocument.deleteMany({
      where: { id_application: id }
    });

    // Eliminar la aplicación
    await prisma.application.delete({
      where: { id }
    });

    return true;
  }
}

module.exports = { ApplicationService };