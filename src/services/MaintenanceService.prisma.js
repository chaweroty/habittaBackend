const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class MaintenanceService {
  /**
   * Crear un nuevo mantenimiento
   * @param {Object} maintenanceData - Datos del mantenimiento
   * @returns {Promise<Object>} Mantenimiento creado
   */
  async createMaintenance(maintenanceData) {
    const { created_by, id_owner, id_user, scheduled_date, ...otherData } = maintenanceData;

    // Validar que created_by sea 'owner' o 'user'
    if (!['owner', 'user'].includes(created_by)) {
      const error = new Error('created_by debe ser "owner" o "user"');
      error.status = 400;
      throw error;
    }

    // Definir el status inicial según quién lo crea
    let initialStatus;
    if (created_by === 'user') {
      // Si lo crea el inquilino, inicia en 'pending' (sin fecha obligatoria)
      initialStatus = 'pending';
    } else {
      // Si lo crea el propietario, inicia en 'accepted' (debe tener fecha)
      initialStatus = 'accepted';
      if (!scheduled_date) {
        const error = new Error('El propietario debe especificar scheduled_date al crear el mantenimiento');
        error.status = 400;
        throw error;
      }
    }

    // Crear el mantenimiento
    const maintenance = await prisma.maintenance.create({
      data: {
        ...otherData,
        id_owner,
        id_user,
        created_by,
        status: initialStatus,
        scheduled_date: scheduled_date || null
      },
      include: {
        property: { select: { id: true, title: true, address: true } },
        owner: { select: { id: true, name: true, email: true, phone: true, pushToken: true } },
        user: { select: { id: true, name: true, email: true, phone: true, pushToken: true } },
        payment: true
      }
    });

    return maintenance;
  }

  /**
   * Obtener un mantenimiento por ID
   * @param {string} id - ID del mantenimiento
   * @returns {Promise<Object|null>} Mantenimiento encontrado
   */
  async getMaintenance(id) {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id_maintenance: id },
      include: {
        property: { select: { id: true, title: true, address: true, city: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true
      }
    });

    if (!maintenance) {
      const error = new Error('Mantenimiento no encontrado');
      error.status = 404;
      throw error;
    }

    return maintenance;
  }

  /**
   * Obtener todos los mantenimientos (admin)
   * @returns {Promise<Array>} Lista de mantenimientos
   */
  async getAllMaintenances() {
    return prisma.maintenance.findMany({
      include: {
        property: { select: { id: true, title: true, address: true } },
        owner: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        payment: { select: { id_pay: true, amount: true, status: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obtener mantenimientos de un propietario
   * @param {string} ownerId - ID del propietario
   * @returns {Promise<Array>} Lista de mantenimientos
   */
  async getMaintenancesByOwner(ownerId) {
    return prisma.maintenance.findMany({
      where: { id_owner: ownerId },
      include: {
        property: { select: { id: true, title: true, address: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        payment: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obtener mantenimientos de un inquilino
   * @param {string} userId - ID del inquilino
   * @returns {Promise<Array>} Lista de mantenimientos
   */
  async getMaintenancesByUser(userId) {
    return prisma.maintenance.findMany({
      where: { id_user: userId },
      include: {
        property: { select: { id: true, title: true, address: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        payment: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obtener mantenimientos de una propiedad específica
   * @param {string} propertyId - ID de la propiedad
   * @returns {Promise<Array>} Lista de mantenimientos
   */
  async getMaintenancesByProperty(propertyId) {
    return prisma.maintenance.findMany({
      where: { id_property: propertyId },
      include: {
        owner: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        payment: { select: { id_pay: true, amount: true, status: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Actualizar un mantenimiento
   * @param {string} id - ID del mantenimiento
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Mantenimiento actualizado
   */
  async updateMaintenance(id, updateData) {
    const { status, confirmed_date, completed_date, ...otherData } = updateData;

    // Si se está cambiando a 'confirmed', registrar confirmed_date
    const dataToUpdate = { ...otherData };
    if (status === 'confirmed' && !confirmed_date) {
      dataToUpdate.confirmed_date = new Date();
    } else if (confirmed_date) {
      dataToUpdate.confirmed_date = confirmed_date;
    }

    // Si se está cambiando a 'completed', registrar completed_date
    if (status === 'completed' && !completed_date) {
      dataToUpdate.completed_date = new Date();
    } else if (completed_date) {
      dataToUpdate.completed_date = completed_date;
    }

    if (status) {
      dataToUpdate.status = status;
    }

    const maintenance = await prisma.maintenance.update({
      where: { id_maintenance: id },
      data: dataToUpdate,
      include: {
        property: { select: { id: true, title: true, address: true } },
        owner: { select: { id: true, name: true, email: true, phone: true, pushToken: true } },
        user: { select: { id: true, name: true, email: true, phone: true, pushToken: true } },
        payment: true
      }
    });

    return maintenance;
  }

  /**
   * Eliminar un mantenimiento
   * @param {string} id - ID del mantenimiento
   * @returns {Promise<Object>} Mantenimiento eliminado
   */
  async deleteMaintenance(id) {
    // Verificar que existe
    await this.getMaintenance(id);

    return prisma.maintenance.delete({
      where: { id_maintenance: id }
    });
  }

  /**
   * Validar transiciones de estado
   * @param {string} currentStatus - Estado actual
   * @param {string} newStatus - Nuevo estado
   * @param {string} userRole - Rol del usuario ('owner' o 'user')
   * @param {string} createdBy - Quién creó el mantenimiento
   * @returns {boolean} true si la transición es válida
   */
  validateStatusTransition(currentStatus, newStatus, userRole, createdBy) {
    // Estados finales no pueden cambiar
    if (['rejected', 'completed'].includes(currentStatus)) {
      return false;
    }

    // Transiciones permitidas según el estado actual
    const allowedTransitions = {
      pending: {
        owner: ['accepted', 'rejected'],
        user: []
      },
      accepted: {
        owner: ['rejected'],
        user: ['confirmed', 'rejected']
      },
      confirmed: {
        owner: ['completed'],
        user: ['completed']
      }
    };

    return allowedTransitions[currentStatus]?.[userRole]?.includes(newStatus) || false;
  }
}

module.exports = { MaintenanceService };
