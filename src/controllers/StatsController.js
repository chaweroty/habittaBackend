const { StatsService } = require('../services/StatsService.prisma');

const statsService = new StatsService();

class StatsController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getOwnerStats = this.getOwnerStats.bind(this);
    this.getOwnerIncome = this.getOwnerIncome.bind(this);
  }

  // GET /stats/owner/:ownerId
  async getOwnerStats(req, res, next) {
    try {
      const ownerId = req.params.ownerId;
      
      // Verificar que el usuario autenticado sea el propietario o admin
      if (req.user.userId !== ownerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estas estadísticas'
        });
      }

      const stats = await statsService.getOwnerStats(ownerId);

      res.json({
        success: true,
        message: 'Estadísticas del propietario obtenidas exitosamente',
        data: stats
      });

    } catch (error) {
      console.error('❌ Error en StatsController.getOwnerStats:', error);
      next(error);
    }
  }

  // GET /stats/income/:ownerId?period=3months
  async getOwnerIncome(req, res, next) {
    try {
      const ownerId = req.params.ownerId;
      const period = req.query.period || '6months'; // default to 6 months
      
      // Verificar que el usuario autenticado sea el propietario o admin
      if (req.user.userId !== ownerId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estas estadísticas'
        });
      }

      const income = await statsService.getOwnerIncome(ownerId, period);

      res.json({
        success: true,
        message: 'Ingresos del propietario obtenidos exitosamente',
        data: income
      });

    } catch (error) {
      console.error('❌ Error en StatsController.getOwnerIncome:', error);
      next(error);
    }
  }
}

module.exports = { StatsController };