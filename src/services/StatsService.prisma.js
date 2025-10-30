const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class StatsService {
  async getOwnerStats(ownerId) {
    try {
      // 1. Total de propiedades del owner
      const totalProperties = await prisma.property.count({
        where: { id_owner: ownerId }
      });

      // 2. Total de propiedades rentadas del owner
      const rentedProperties = await prisma.property.count({
        where: {
          id_owner: ownerId,
          publication_status: 'rented'
        }
      });

      // 3. Solicitudes pendientes del owner
      const pendingApplications = await prisma.application.count({
        where: {
          property: {
            id_owner: ownerId
          },
          status: 'Pending'
        }
      });

      // 4. Mantenimientos programados (hardcodeado por ahora)
      const scheduledMaintenances = 4;

      // 5. Ingresos de los últimos 6 meses (hardcodeados)
      const monthlyIncome = [
        { month: 'Abril 2025', amount: 2500000 },
        { month: 'Mayo 2025', amount: 3200000 },
        { month: 'Junio 2025', amount: 2800000 },
        { month: 'Julio 2025', amount: 3500000 },
        { month: 'Agosto 2025', amount: 3100000 },
        { month: 'Septiembre 2025', amount: 2900000 }
      ];

      // 6. Últimas aplicaciones (con información del solicitante y propiedad)
      const recentApplications = await prisma.application.findMany({
        where: {
          property: {
            id_owner: ownerId
          }
        },
        select: {
          id: true,
          status: true,
          application_date: true,
          renter: {
            select: {
              name: true
            }
          },
          property: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          application_date: 'desc'
        },
        take: 10 // Últimas 10 aplicaciones
      });

      // Formatear las aplicaciones para el frontend
      const formattedApplications = recentApplications.map(app => ({
        id: app.id,
        applicantName: app.renter.name,
        propertyTitle: app.property.title,
        status: app.status,
        applicationDate: app.application_date
      }));

      return {
        totalProperties,
        rentedProperties,
        pendingApplications,
        scheduledMaintenances,
        monthlyIncome,
        recentApplications: formattedApplications
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del owner:', error);
      throw new Error('Error obteniendo estadísticas del propietario');
    }
  }
}

module.exports = { StatsService };