const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class LegalDocumentService {
  async create(data) {
    return await prisma.legalDocument.create({ data });
  }

  async getAll() {
    return await prisma.legalDocument.findMany();
  }

  async getById(id) {
    return await prisma.legalDocument.findUnique({ where: { id } });
  }

  async update(id, data) {
    return await prisma.legalDocument.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return await prisma.legalDocument.delete({ where: { id } });
  }
}

module.exports = { LegalDocumentService };