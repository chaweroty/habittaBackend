const { StatsService } = require('../services/StatsService.prisma');

const statsService = new StatsService();

class StatsController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getOwnerStats = this.getOwnerStats.bind(this);
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
}

module.exports = { StatsController };