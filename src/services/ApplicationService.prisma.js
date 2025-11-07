const { PrismaClient } = require('../generated/prisma');
const { sendNewApplicationNotification } = require('./pushNotificationService');

const prisma = new PrismaClient();

class ApplicationService {
  async createApplication(applicationData) {
    // Verificar que la propiedad existe y obtener información del propietario
    const property = await prisma.property.findUnique({
      where: { id: applicationData.id_property },
      include: {
        owner: {
          select: { 
            id: true, 
            name: true, 
            pushToken: true 
          }
        }
      }
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

    // Obtener información del solicitante
    const renter = await prisma.user.findUnique({
      where: { id: applicationData.id_renter },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        phone: true 
      }
    });

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

    // 📱 Enviar notificación push al propietario (si tiene push token)
    if (property.owner.pushToken && property.owner.pushToken !== '') {
      try {
        await sendNewApplicationNotification(
          property.owner.pushToken,
          property.title,
          renter.name
        );
        console.log(`📱 Notificación enviada al propietario ${property.owner.name}`);
      } catch (error) {
        console.error('❌ Error enviando notificación push:', error);
        // No lanzar error para no afectar la creación de la aplicación
      }
    } else {
      console.log(`⚠️ Propietario ${property.owner.name} no tiene push token configurado`);
    }

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
    // Obtener aplicaciones junto con renter y property (sin cálculos adicionales)
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
    // Obtener aplicaciones del owner
    const applications = await prisma.application.findMany({
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

    // Añadir ratingAverage al renter usando ReviewService.getReviewSummary
    const { ReviewService } = require('./ReviewService.prisma');
    const reviewService = new ReviewService();

    const renterIds = Array.from(new Set(applications.map(a => a.renter?.id).filter(Boolean)));
    if (renterIds.length === 0) return applications;

    const summaries = await Promise.all(renterIds.map(id => reviewService.getReviewSummary(id)));
    const summaryMap = {};
    renterIds.forEach((id, idx) => {
      summaryMap[id] = summaries[idx] || { positivePercentage: 0 };
    });

    for (const app of applications) {
      const rid = app.renter?.id;
      const s = summaryMap[rid];
      const percent = s && typeof s.positivePercentage === 'number' ? s.positivePercentage : 0;
      app.renter = { ...app.renter, ratingAverage: percent };
    }

    // Log concise summary for owner view
    try {
      const logSummary = {
        timestamp: new Date().toISOString(),
        ownerId,
        totalApplications: applications.length,
        items: applications.map(a => ({
          applicationId: a.id,
          status: a.status,
          propertyId: a.property?.id,
          renterId: a.renter?.id,
          renterName: a.renter?.name,
          ratingAverage: a.renter?.ratingAverage
        }))
      };
      console.log('getApplicationsByOwner summary:', JSON.stringify(logSummary));
    } catch (logErr) {
      console.error('Error logging getApplicationsByOwner summary:', logErr);
    }

    return applications;
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