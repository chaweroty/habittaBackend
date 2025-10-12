const { LegalDocumentService } = require('../services/LegalDocumentService.prisma');
const legalDocumentService = new LegalDocumentService();

class LegalDocumentController {
  async create(req, res, next) {
    try {
      const legalDocument = await legalDocumentService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Documento legal creado exitosamente',
        data: legalDocument
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const legalDocuments = await legalDocumentService.getAll();
      res.json({
        success: true,
        data: legalDocuments
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const legalDocument = await legalDocumentService.getById(id);
      if (!legalDocument) {
        return res.status(404).json({
          success: false,
          message: 'Documento legal no encontrado'
        });
      }
      res.json({
        success: true,
        data: legalDocument
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedLegalDocument = await legalDocumentService.update(id, req.body);
      res.json({
        success: true,
        message: 'Documento legal actualizado exitosamente',
        data: updatedLegalDocument
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await legalDocumentService.delete(id);
      res.json({
        success: true,
        message: 'Documento legal eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LegalDocumentController();