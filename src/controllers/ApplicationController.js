const { ApplicationService } = require('../services/ApplicationService.prisma');
const { PrismaClient } = require('../generated/prisma');
const {
  sendNewApplicationNotification,
  sendDocumentsRequiredNotification,
  sendPreApprovedNotification,
  sendApplicationConfirmedByRenterNotification,
  sendContractSignedNotification,
  sendApplicationRejectedNotification,
  sendApplicationWithdrawnNotification,
  sendApplicationTerminatedNotification
} = require('../services/pushNotificationService');
const { is } = require('zod/locales');
const applicationService = new ApplicationService();
const prisma = new PrismaClient();

class ApplicationController {
  async createApplication(req, res, next) {
    try {
      // El id_renter viene del token JWT (usuario autenticado)
      const applicationData = {
        ...req.body,
        id_renter: req.user.userId  // Cambié de req.user.id a req.user.userId
      };

      const application = await applicationService.createApplication(applicationData);
      
      res.status(201).json({
        success: true,
        message: 'Aplicación creada exitosamente',
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplication(req, res, next) {
    try {
      const { id } = req.params;
      const application = await applicationService.getApplication(id);
      
      // Verificar permisos: solo el renter, el owner de la propiedad o admin pueden ver la aplicación
      const isRenter = application.renter.id === req.user.userId;
      const isOwner = application.property.id_owner === req.user.userId;
      const isAdmin = req.user.role === 'admin';
      
      if (!isRenter && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta aplicación'
        });
      }

      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllApplications(req, res, next) {
    try {
      // Solo admins pueden ver todas las aplicaciones
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver todas las aplicaciones'
        });
      }

      const applications = await applicationService.getAllApplications();
      
      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  async getApplicationsByProperty(req, res, next) {
    try {
      const { propertyId } = req.params;
      
      // Verificar que el usuario es el dueño de la propiedad o admin
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id_owner: true }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Propiedad no encontrada'
        });
      }

      const isOwner = property.id_owner === req.user.userId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver las aplicaciones de esta propiedad'
        });
      }

      const applications = await applicationService.getApplicationsByProperty(propertyId);
      
      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      // Obtener aplicaciones del usuario autenticado
      const applications = await applicationService.getApplicationsByRenter(req.user.userId);
      
      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOwnerApplications(req, res, next) {
    try {
      // Obtener todas las aplicaciones de las propiedades del propietario autenticado
      const applications = await applicationService.getApplicationsByOwner(req.user.userId);
      
      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  async updateApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { status, description } = req.body;
      
      // Obtener la aplicación para verificar permisos
      const application = await applicationService.getApplication(id);
      
      // Obtener el estado actual de la aplicación
      const currentStatus = application.status;
      
      // Verificar permisos: solo el owner de la propiedad o admin pueden actualizar el status
      const isOwner = application.property.id_owner === req.user.userId;
      const isRenter = application.renter.id === req.user.userId;
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin && !isRenter) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar esta aplicación'
        });
      }

      // Validar transiciones de estado según el rol
      if (status) {
        
        // Lógica para propietarios y admins
        if (isOwner || isAdmin) {
          const allowedTransitions = {
            'pending': ['documents_required', 'rejected'],
            'documents_required': ['pre_approved', 'rejected'],
            'pre_approved': ['pending'],
            'approved': ['signed', 'rejected'],
            'signed': ['terminated'],
            'rejected': [],
            'withdrawn': [], // No se puede cambiar una aplicación retirada
            'terminated': [] // Estado final
          };
          
          if (!allowedTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
              success: false,
              message: `No se puede cambiar el estado de "${currentStatus}" a "${status}"`
            });
          }
        }
        
        // Lógica para renters
        if (isRenter && !isOwner && !isAdmin) {
          // Los renters pueden:
          // 1. Aceptar una pre-aprobación (pre_approved → approved)
          // 2. Retirar su aplicación (mayoría de estados → withdrawn)
          // 3. Desde documents_required puede retirar la aplicación
          const allowedRenterTransitions = {
            'pending': ['withdrawn'],
            'documents_required': ['withdrawn'],
            'pre_approved': ['approved', 'withdrawn'],
            'approved': ['withdrawn'],
            'signed': ['terminated'],
            'rejected': [],
            'withdrawn': [],
            'terminated': [] // Estado final
          };
          
          if (!allowedRenterTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
              success: false,
              message: `Como solicitante, no puedes cambiar el estado de "${currentStatus}" a "${status}"`
            });
          }
        }
      }

      // Preparar datos de actualización según el rol
      let updateData = {};
      
      if (isRenter && !isOwner && !isAdmin) {
        // Los renters solo pueden actualizar descripción y status (con restricciones)
        if (description !== undefined) updateData.description = description;
        if (status && ['approved', 'withdrawn'].includes(status)) updateData.status = status;
      } else {
        // Propietarios y admins pueden actualizar todo
        if (status !== undefined) updateData.status = status;
        if (description !== undefined) updateData.description = description;
      }

      // Si el status cambia a 'signed', establecer automáticamente start_date, end_date y rentAmount
      if (status === 'signed' && currentStatus !== 'signed') {
        const now = new Date();
        const oneMonthLater = new Date(now);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        
        updateData.start_date = now;
        updateData.end_date = oneMonthLater;
        updateData.rentAmount = application.property.price;
        updateData.paymentFrequency = 'monthly';
        console.log('Asignando start_date, end_date, rentAmount y paymentFrequency al firmar el contrato');
      }

      const updatedApplication = await applicationService.updateApplication(id, updateData);
      
      // ========== ENVÍO DE NOTIFICACIONES SEGÚN EL ESTADO ==========
      if (status && status !== currentStatus) {
        try {
          const propertyTitle = application.property.title || 'la propiedad';
          const renterName = `${application.renter.name}`;
          const ownerName = application.property.owner ? 
            `${application.property.owner.name}` : 
            'el propietario';
          
          // Determinar la contraparte según quién hizo la actualización
          const isOwnerUpdating = isOwner || isAdmin;
          const isRenterUpdating = isRenter && !isOwner;
          
          // Obtener pushToken de la contraparte
          const counterpartyPushToken = isOwnerUpdating 
            ? application.renter.pushToken 
            : application.property.owner?.pushToken;

          const typeNotification = isOwnerUpdating ? 'owner_notification' : 'user_notification';
          
          // Si no hay pushToken, no se puede enviar notificación
          if (!counterpartyPushToken) {
            console.warn(`⚠️ No se pudo enviar notificación: Usuario sin pushToken`);
          } else {
            // Enviar notificación según el nuevo estado
            switch (status) {
              case 'documents_required':
                // Owner requiere documentos → Notificar a renter
                await sendDocumentsRequiredNotification(counterpartyPushToken, propertyTitle);
                break;
                
              case 'pre_approved':
                // Owner pre-aprueba → Notificar a renter
                await sendPreApprovedNotification(counterpartyPushToken, propertyTitle);
                break;
                
              case 'approved':
                // Renter confirma pre-aprobación → Notificar a owner
                if (isRenterUpdating) {
                  await sendApplicationConfirmedByRenterNotification(counterpartyPushToken, renterName, propertyTitle);
                }
                break;
                
              case 'signed':
                // Contrato firmado → Notificar a la contraparte
                const recipientName = isOwnerUpdating ? renterName : ownerName;
                await sendContractSignedNotification(counterpartyPushToken, recipientName, propertyTitle, typeNotification);
                break;
                
              case 'rejected':
                // Owner rechaza → Notificar a renter (solo si no es el renter quien actualiza)
                if (isOwnerUpdating) {
                  await sendApplicationRejectedNotification(counterpartyPushToken, propertyTitle);
                }
                break;
                
              case 'withdrawn':
                // Renter retira solicitud → Notificar a owner
                if (isRenterUpdating) {
                  await sendApplicationWithdrawnNotification(counterpartyPushToken, renterName, propertyTitle);
                }
                break;
                
              case 'terminated':
                // Contrato finalizado → Notificar a la contraparte
                await sendApplicationTerminatedNotification(counterpartyPushToken, propertyTitle, typeNotification);
                break;
                
              default:
                console.log(`ℹ️ No hay notificación configurada para el estado: ${status}`);
            }
          }
        } catch (notificationError) {
          // No fallar la operación si la notificación falla
          console.error('❌ Error enviando notificación:', notificationError);
        }
      }
      
      // Mensaje personalizado según la acción
      let message = 'Aplicación actualizada exitosamente';
      if (status === 'documents_required') {
        message = 'Se requieren documentos adicionales del solicitante';
      } else if (status === 'pre_approved') {
        message = 'Aplicación pre-aprobada. El solicitante puede confirmar para finalizar el proceso.';
      } else if (status === 'approved') {
        message = 'Aplicación aprobada exitosamente';
      } else if (status === 'signed') {
        message = 'Contrato firmado exitosamente';
      } else if (status === 'terminated') {
        message = 'Proceso de aplicación terminado';
      } else if (status === 'rejected') {
        message = 'Aplicación rechazada';
      } else if (status === 'withdrawn') {
        message = 'Aplicación retirada por el solicitante';
      }
      
      if (status === 'signed') {
        // Cambiar el estado de la propiedad a 'rented' cuando la aplicación se firma
        const propertyService = new (require('../services/PropertyService.prisma')).PropertyService();
        await propertyService.setStatusRented(application.id_property);
        
        // Crear pago de alquiler
        const paymentService = new (require('../services/PaymentService.prisma')).PaymentService();
        await paymentService.createPayment({
          id_payer: application.id_renter,
          id_receiver: application.property.id_owner,
          related_type: 'rent',
          id_related: updatedApplication.id,
          concept: `Alquiler de ${application.property.title}`,
          description: `Pago mensual de alquiler - Período: ${new Date().toLocaleDateString('es-CO')} a ${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('es-CO')}`,
          amount: updatedApplication.rentAmount,
          currency: 'COP',
          due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          status: 'pending'
        });
      } else if (status === 'terminated') {
        // Cambiar el estado de la propiedad a 'published' cuando la aplicación se termina
        const propertyService = new (require('../services/PropertyService.prisma')).PropertyService();
        await propertyService.setStatusPublished(application.id_property);
      }
      
      // Llamar al servicio de reseñas para manejar la creación automática
      const reviewService = new (require('../services/ReviewService.prisma')).ReviewService();
      await reviewService.createReviewsForApplicationTransition(application, currentStatus, status, req.user.userId);

      res.json({
        success: true,
        message,
        data: updatedApplication
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteApplication(req, res, next) {
    try {
      const { id } = req.params;
      
      // Obtener la aplicación para verificar permisos
      const application = await applicationService.getApplication(id);
      
      // Verificar permisos: solo el renter o admin pueden eliminar la aplicación
      const isRenter = application.renter.id === req.user.userId;
      const isAdmin = req.user.role === 'admin';
      
      if (!isRenter && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar esta aplicación'
        });
      }

      await applicationService.deleteApplication(id);
      
      res.json({
        success: true,
        message: 'Aplicación eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();