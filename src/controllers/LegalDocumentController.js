const { LegalDocumentService } = require('../services/LegalDocumentService.prisma');
const { PrismaClient } = require('../generated/prisma');
const { sendOwnerVerifiedEmail } = require('../services/emailService');
const { UserService } = require('../services/UserService.prisma');
const legalDocumentService = new LegalDocumentService();
const prisma = new PrismaClient();
const userService = new UserService();

class LegalDocumentController {
  async verifyIdentity(req, res, next) {
    try {
      const id_user = req.user && req.user.userId;
      if (!id_user) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      const { description, url_document, status } = req.body;

      const legalDocument = await legalDocumentService.createForUser({
        id_user,
        description,
        url_document,
        status
      });

      res.status(201).json({
        success: true,
        message: 'Documento de verificación de identidad creado exitosamente',
        data: legalDocument
      });
    } catch (error) {
      next(error);
    }
  }

  async createForApplication(req, res, next) {
    try {
      const currentUserId = req.user && req.user.userId;
      if (!currentUserId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      const { id_application, type, description, url_document, status } = req.body;

      if (!id_application || !type || !url_document) {
        return res.status(400).json({
          success: false,
          message: 'id_application, type y url_document son requeridos'
        });
      }

      // Verificar que la application existe y que el usuario es el renter o el owner
      const application = await prisma.application.findUnique({
        where: { id: id_application },
        include: {
          property: { select: { id_owner: true } }
        }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application no encontrada'
        });
      }

      const isRenter = application.id_renter === currentUserId;
      const isOwner = application.property.id_owner === currentUserId;
      const isAdmin = req.user.role === 'admin';

      if (!isRenter && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear documentos en esta application'
        });
      }

      const legalDocument = await legalDocumentService.createForApplication({
        id_application,
        type,
        description,
        url_document,
        status
      });

      res.status(201).json({
        success: true,
        message: 'Documento legal asociado a la application creado exitosamente',
        data: legalDocument
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingIdentityDocuments(req, res, next) {
    try {
      const docs = await legalDocumentService.getPendingIdentityDocuments();
      res.json({ success: true, data: docs });
    } catch (error) {
      next(error);
    }
  }

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

  // Admin: solo puede cambiar status y notes de cualquier legal document
  async updateByAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await legalDocumentService.update(id, updateData);
      // If admin approved an identity_document belonging to a user, delegate
      // marking the user as Verified and sending the notification to UserService.
      try {
        if (
          updateData.status === 'approved' &&
          updated.type === 'identity_document' &&
          updated.belongs_to === 'user' &&
          updated.id_user
        ) {
          await userService.markUserVerifiedAndNotify(updated.id_user);
        }
      } catch (sideEffectErr) {
        console.error('Error handling post-approval side effects for legal document via UserService:', sideEffectErr);
      }

      res.json({ success: true, message: 'Documento actualizado por admin', data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Para belongs_to 'user' o 'property': solo id_user puede modificar type, description y url_document
  async updateByOwnerOrUploader(req, res, next) {
    try {
      const { id } = req.params;
      const doc = await legalDocumentService.getById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Documento legal no encontrado' });

      if (!['user', 'property'].includes(doc.belongs_to)) {
        return res.status(403).json({ success: false, message: 'Este endpoint solo aplica a documentos pertenecientes a user o property' });
      }

      const currentUserId = req.user && req.user.userId;
      if (!currentUserId || doc.id_user !== currentUserId) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para actualizar este documento' });
      }

      const { type, description, url_document } = req.body;
      const updateData = {};
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (url_document !== undefined) updateData.url_document = url_document;

      const updated = await legalDocumentService.update(id, updateData);
      res.json({ success: true, message: 'Documento actualizado', data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Para legal documents que pertenecen a una application: renter puede editar type, description y status si es el renter
  async updateApplicationByRenter(req, res, next) {
    try {
      const { id } = req.params;
      const doc = await legalDocumentService.getById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Documento legal no encontrado' });

      if (doc.belongs_to !== 'application' || !doc.id_application) {
        return res.status(403).json({ success: false, message: 'Este endpoint solo aplica a documentos de application' });
      }

      // Obtener la aplicación para verificar renter
      const application = await prisma.application.findUnique({ where: { id: doc.id_application } });
      if (!application) return res.status(404).json({ success: false, message: 'Application asociada no encontrada' });

      const currentUserId = req.user && req.user.userId;
      if (!currentUserId || application.id_renter !== currentUserId) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para actualizar este documento de application' });
      }

      const { type, description, status } = req.body;
      const updateData = {};
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;

      const updated = await legalDocumentService.update(id, updateData);
      res.json({ success: true, message: 'Documento de application actualizado por renter', data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Para legal documents que pertenecen a una application: owner (propietario) puede editar status y notes si es el owner de la property en la application
  async updateApplicationByOwner(req, res, next) {
    try {
      const { id } = req.params;
      const doc = await legalDocumentService.getById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Documento legal no encontrado' });

      if (doc.belongs_to !== 'application' || !doc.id_application) {
        return res.status(403).json({ success: false, message: 'Este endpoint solo aplica a documentos de application' });
      }

      // Obtener la aplicación con la propiedad para verificar owner
      const application = await prisma.application.findUnique({
        where: { id: doc.id_application },
        include: { property: { select: { id_owner: true } } }
      });

      if (!application) return res.status(404).json({ success: false, message: 'Application asociada no encontrada' });

      const currentUserId = req.user && req.user.userId;
      if (!currentUserId || application.property.id_owner !== currentUserId) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para actualizar este documento de application como owner' });
      }

      const { status, notes } = req.body;
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await legalDocumentService.update(id, updateData);
      res.json({ success: true, message: 'Documento de application actualizado por owner', data: updated });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los documentos pertenecientes a un usuario (belongs_to = 'user')
  async getByUser(req, res, next) {
    try {
      const { userId } = req.params;

      const docs = await legalDocumentService.getDocumentsByUser(userId);
      res.json({ success: true, data: docs });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los documentos pertenecientes a una application (belongs_to = 'application')
  async getByApplication(req, res, next) {
    try {
      const { applicationId } = req.params;
      const currentUserId = req.user && req.user.userId;

      if (!currentUserId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      // Verificar que la application existe y que el usuario tiene permisos
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          property: { select: { id_owner: true } }
        }
      });

      if (!application) {
        return res.status(404).json({ success: false, message: 'Application no encontrada' });
      }

      const isRenter = application.id_renter === currentUserId;
      const isOwner = application.property.id_owner === currentUserId;
      const isAdmin = req.user.role === 'admin';

      if (!isRenter && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver los documentos de esta application'
        });
      }

      const docs = await legalDocumentService.getDocumentsByApplication(applicationId);
      res.json({ success: true, data: docs });
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