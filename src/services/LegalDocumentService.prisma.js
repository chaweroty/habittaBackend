const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class LegalDocumentService {
  async create(data) {
    return await prisma.legalDocument.create({ data });
  }

  /**
   * Crea un documento de verificación de identidad perteneciente al usuario
   * (helper específico para el endpoint verify_identity)
   * @param {{ id_user: string, description?: string|null, url_document: string, status?: string }} data
   */
  async createForUser(data) {
    const payload = {
      id_user: data.id_user,
      belongs_to: 'user',
      type: 'identity_document',
      description: data.description || null,
      url_document: data.url_document,
      status: data.status || 'pending'
    };

    return await prisma.legalDocument.create({ data: payload });
  }

  async getAll() {
    return await prisma.legalDocument.findMany({ orderBy: { upload_date: 'desc' } });
  }

  /**
   * Obtener todos los documentos de verificación de identidad con status pending
   */
  async getPendingIdentityDocuments() {
    return await prisma.legalDocument.findMany({
      where: {
        type: 'identity_document',
        status: 'pending'
      },
      orderBy: { upload_date: 'desc' }
    });
  }

  async getById(id) {
    return await prisma.legalDocument.findUnique({ where: { id } });
  }

  async getDocumentsByUser(userId) {
    return await prisma.legalDocument.findMany({
      where: {
        id_user: userId,
        belongs_to: 'user'
      },
      orderBy: { upload_date: 'desc' }
    });
  }

  async update(id, data) {
    return await prisma.legalDocument.update({ where: { id }, data });
  }

  async delete(id) {
    await prisma.legalDocument.delete({ where: { id } });
    return true;
  }
}

module.exports = { LegalDocumentService };