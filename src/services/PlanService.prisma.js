const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class PlanService {
  async getAll() {
    return await prisma.plan.findMany({ orderBy: { id: 'asc' } });
  }
}

module.exports = { PlanService };
