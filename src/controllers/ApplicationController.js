const { ApplicationService } = require('../services/ApplicationService.prisma');
const { PrismaClient } = require('../generated/prisma');
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
        const currentStatus = application.status;
        
        // Lógica para propietarios y admins
        if (isOwner || isAdmin) {
          const allowedTransitions = {
            'pending': ['pre_approved', 'rejected'],
            'pre_approved': ['approved', 'rejected'],
            'approved': ['rejected'], // Solo si necesita revertir
            'rejected': ['pending', 'pre_approved'], // Reactivar si es necesario
            'withdrawn': [] // No se puede cambiar una aplicación retirada
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
          // Los renters solo pueden:
          // 1. Aceptar una pre-aprobación (pre_approved → approved)
          // 2. Retirar su aplicación (cualquier estado → withdrawn)
          const allowedRenterTransitions = {
            'pending': ['withdrawn'],
            'pre_approved': ['approved', 'withdrawn'],
            'approved': ['withdrawn'],
            'rejected': ['withdrawn'],
            'withdrawn': []
          };
          
          if (!allowedRenterTransitions[currentStatus]?.includes(status)) {
            return res.status(400).json({
              success: false,
              message: `Como solicitante, solo puedes ${currentStatus === 'pre_approved' ? 'aceptar la pre-aprobación o ' : ''}retirar tu aplicación`
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

      const updatedApplication = await applicationService.updateApplication(id, updateData);
      
      // Mensaje personalizado según la acción
      let message = 'Aplicación actualizada exitosamente';
      if (status === 'pre_approved') {
        message = 'Aplicación pre-aprobada. El solicitante puede confirmar para finalizar el proceso.';
      } else if (status === 'approved') {
        message = 'Aplicación aprobada exitosamente';
      } else if (status === 'rejected') {
        message = 'Aplicación rechazada';
      } else if (status === 'withdrawn') {
        message = 'Aplicación retirada por el solicitante';
      }
      
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