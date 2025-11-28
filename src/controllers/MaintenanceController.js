const { MaintenanceService } = require('../services/MaintenanceService.prisma');
const { createMaintenanceSchema, updateMaintenanceSchema } = require('../schemas/maintenanceSchema');
const maintenanceService = new MaintenanceService();

class MaintenanceController {
  constructor() {
    this.maintenanceService = maintenanceService;
    this.createMaintenance = this.createMaintenance.bind(this);
    this.getMaintenance = this.getMaintenance.bind(this);
    this.getAllMaintenances = this.getAllMaintenances.bind(this);
    this.getMyMaintenances = this.getMyMaintenances.bind(this);
    this.getMyOwnerMaintenances = this.getMyOwnerMaintenances.bind(this);
    this.getMaintenancesByProperty = this.getMaintenancesByProperty.bind(this);
    this.updateMaintenance = this.updateMaintenance.bind(this);
    this.deleteMaintenance = this.deleteMaintenance.bind(this);
  }

  /**
   * POST /maintenances
   * Crear un nuevo mantenimiento
   */
  async createMaintenance(req, res, next) {
    try {
      // Validar el body con Zod
      const parseResult = createMaintenanceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: parseResult.error.errors
        });
      }

      const maintenance = await this.maintenanceService.createMaintenance(parseResult.data);

      res.status(201).json({
        success: true,
        message: 'Mantenimiento creado exitosamente',
        data: maintenance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /maintenances/:id
   * Obtener un mantenimiento por ID
   */
  async getMaintenance(req, res, next) {
    try {
      const { id } = req.params;
      const maintenance = await this.maintenanceService.getMaintenance(id);

      // Verificar permisos: solo el owner, el user o admin pueden ver
      const isOwner = maintenance.id_owner === req.user.userId;
      const isUser = maintenance.id_user === req.user.userId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isUser && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este mantenimiento'
        });
      }

      res.json({
        success: true,
        data: maintenance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /maintenances
   * Obtener todos los mantenimientos (solo admin)
   */
  async getAllMaintenances(req, res, next) {
    try {
      // Solo admins pueden ver todos los mantenimientos
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver todos los mantenimientos'
        });
      }

      const maintenances = await this.maintenanceService.getAllMaintenances();

      res.json({
        success: true,
        data: maintenances
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /maintenances/my
   * Obtener mantenimientos del usuario autenticado (como inquilino)
   */
  async getMyMaintenances(req, res, next) {
    try {
      const maintenances = await this.maintenanceService.getMaintenancesByUser(req.user.userId);

      res.json({
        success: true,
        data: maintenances
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /maintenances/my-owner
   * Obtener mantenimientos del usuario autenticado (como propietario)
   */
  async getMyOwnerMaintenances(req, res, next) {
    try {
      const maintenances = await this.maintenanceService.getMaintenancesByOwner(req.user.userId);

      res.json({
        success: true,
        data: maintenances
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /maintenances/property/:propertyId
   * Obtener mantenimientos de una propiedad específica
   */
  async getMaintenancesByProperty(req, res, next) {
    try {
      const { propertyId } = req.params;

      // Verificar que el usuario es el dueño de la propiedad o admin
      const { PrismaClient } = require('../generated/prisma');
      const prisma = new PrismaClient();
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
          message: 'No tienes permisos para ver los mantenimientos de esta propiedad'
        });
      }

      const maintenances = await this.maintenanceService.getMaintenancesByProperty(propertyId);

      res.json({
        success: true,
        data: maintenances
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /maintenances/:id
   * Actualizar un mantenimiento
   */
  async updateMaintenance(req, res, next) {
    try {
      const { id } = req.params;
      const { status, ...otherData } = req.body;

      // Validar el body con Zod
      const parseResult = updateMaintenanceSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: parseResult.error.errors
        });
      }

      // Obtener el mantenimiento actual
      const maintenance = await this.maintenanceService.getMaintenance(id);
      const currentStatus = maintenance.status;

      // Verificar permisos
      const isOwner = maintenance.id_owner === req.user.userId;
      const isUser = maintenance.id_user === req.user.userId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isUser && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar este mantenimiento'
        });
      }

      // Validar transiciones de estado si se está cambiando el status
      if (status && status !== currentStatus) {
        const userRole = isOwner || isAdmin ? 'owner' : 'user';
        const isValidTransition = this.maintenanceService.validateStatusTransition(
          currentStatus,
          status,
          userRole,
          maintenance.created_by
        );

        if (!isValidTransition) {
          return res.status(400).json({
            success: false,
            message: `No se puede cambiar el estado de "${currentStatus}" a "${status}" con tu rol`
          });
        }

        // Validaciones adicionales según el estado
        if (status === 'accepted' && !parseResult.data.scheduled_date && !maintenance.scheduled_date) {
          return res.status(400).json({
            success: false,
            message: 'Debes especificar scheduled_date al aceptar un mantenimiento'
          });
        }

        if (status === 'confirmed' && maintenance.responsibility === 'user' && !maintenance.id_payment && !parseResult.data.id_payment) {
          return res.status(400).json({
            success: false,
            message: 'Debes vincular un pago (id_payment) cuando el usuario es responsable del costo'
          });
        }
      }

      const updatedMaintenance = await this.maintenanceService.updateMaintenance(id, parseResult.data);

      // Mensaje personalizado según la acción
      let message = 'Mantenimiento actualizado exitosamente';
      if (status === 'accepted') {
        message = 'Mantenimiento aceptado y programado';
      } else if (status === 'confirmed') {
        message = 'Mantenimiento confirmado';
      } else if (status === 'rejected') {
        message = 'Mantenimiento rechazado';
      } else if (status === 'completed') {
        message = 'Mantenimiento marcado como completado';
      }

      res.json({
        success: true,
        message,
        data: updatedMaintenance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /maintenances/:id
   * Eliminar un mantenimiento
   */
  async deleteMaintenance(req, res, next) {
    try {
      const { id } = req.params;

      // Obtener el mantenimiento para verificar permisos
      const maintenance = await this.maintenanceService.getMaintenance(id);

      // Solo el que lo creó o admin pueden eliminar
      const isCreator = (maintenance.created_by === 'owner' && maintenance.id_owner === req.user.userId) ||
                        (maintenance.created_by === 'user' && maintenance.id_user === req.user.userId);
      const isAdmin = req.user.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este mantenimiento'
        });
      }

      await this.maintenanceService.deleteMaintenance(id);

      res.json({
        success: true,
        message: 'Mantenimiento eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { MaintenanceController };
