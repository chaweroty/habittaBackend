const { PlanService } = require('../services/PlanService.prisma');
const planService = new PlanService();

class PlanController {
  async getAll(req, res, next) {
    try {
      const plans = await planService.getAll();
      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlanController();
