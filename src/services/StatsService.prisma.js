const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class StatsService {
  async getOwnerStats(ownerId) {
    try {
      // 1. Total de propiedades del owner
      const totalProperties = await prisma.property.count({
        where: {
          id_owner: ownerId,
          publication_status: { not: 'deleted' }
        }
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
          status: 'pending'
        }
      });

      // 4. Mantenimientos programados (hardcodeado por ahora)
      const scheduledMaintenances = 4;

      // 5. Ingresos de los últimos 6 meses (calculados desde pagos completados)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const completedPayments = await prisma.payment.findMany({
        where: {
          id_receiver: ownerId,
          status: 'completed',
          payment_date: {
            gte: sixMonthsAgo
          }
        },
        select: {
          amount: true,
          payment_date: true
        },
        orderBy: {
          payment_date: 'asc'
        }
      });

      // Agrupar pagos por mes
      const monthlyIncomeMap = {};
      completedPayments.forEach(payment => {
        const date = new Date(payment.payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });

        if (!monthlyIncomeMap[monthKey]) {
          monthlyIncomeMap[monthKey] = {
            month: monthName,
            amount: 0
          };
        }
        monthlyIncomeMap[monthKey].amount += Number(payment.amount);
      });

      // Convertir a array y ordenar por fecha
      const monthlyIncome = Object.values(monthlyIncomeMap).sort((a, b) => {
        const dateA = new Date(a.month + ' 1, ' + new Date().getFullYear());
        const dateB = new Date(b.month + ' 1, ' + new Date().getFullYear());
        return dateA - dateB;
      });

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

  async getOwnerIncome(ownerId, period) {
    try {
      let startDate = null;

      const now = new Date();
      switch (period) {
        case '3months':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          // No filter, startDate remains null
          break;
        default:
          throw new Error('Período inválido. Use: 3months, 6months, 1year, all');
      }

      const whereClause = {
        id_receiver: ownerId,
        status: 'completed'
      };

      if (startDate) {
        whereClause.payment_date = {
          gte: startDate
        };
      }

      const completedPayments = await prisma.payment.findMany({
        where: whereClause,
        select: {
          amount: true,
          payment_date: true
        },
        orderBy: {
          payment_date: 'asc'
        }
      });

      // Agrupar pagos por mes
      const monthlyIncomeMap = {};
      completedPayments.forEach(payment => {
        const date = new Date(payment.payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });

        if (!monthlyIncomeMap[monthKey]) {
          monthlyIncomeMap[monthKey] = {
            month: monthName,
            amount: 0
          };
        }
        monthlyIncomeMap[monthKey].amount += Number(payment.amount);
      });

      // Convertir a array y ordenar por fecha
      const monthlyIncome = Object.values(monthlyIncomeMap).sort((a, b) => {
        const dateA = new Date(a.month + ' 1, ' + new Date().getFullYear());
        const dateB = new Date(b.month + ' 1, ' + new Date().getFullYear());
        return dateA - dateB;
      });

      return monthlyIncome;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del owner:', error);
      throw new Error('Error obteniendo estadísticas del propietario');
    }
  }
}

module.exports = { StatsService };