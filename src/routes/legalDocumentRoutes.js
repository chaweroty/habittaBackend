const express = require('express');
const router = express.Router();
const LegalDocumentController = require('../controllers/LegalDocumentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { createVerifyIdentitySchema } = require('../schemas/legalDocumentSchema');


// Crear un nuevo documento legal (genérico)
router.post('/', authenticate, LegalDocumentController.create);

// Endpoint específico para crear documento de verificación de identidad
// POST /api/legal-documents/verify_identity
router.post('/verify_identity', authenticate, authorize(['owner']), validateBody(createVerifyIdentitySchema), LegalDocumentController.verifyIdentity);

// Endpoint específico para crear documento legal asociado a una application
// POST /api/legal-documents/application
router.post('/application', authenticate, LegalDocumentController.createForApplication);

// GET /api/legal-documents/identity_pending - Obtener todos los identity_documents con status pending (solo admin)
router.get('/identity_pending', authenticate, authorize(['admin']), LegalDocumentController.getPendingIdentityDocuments);

// Obtener documentos de un usuario (belongs_to = 'user')
router.get('/user/:userId', authenticate, LegalDocumentController.getByUser);

// Obtener documentos de una application (belongs_to = 'application')
router.get('/application/:applicationId', authenticate, LegalDocumentController.getByApplication);

// Obtener un documento legal por ID
router.get('/:id', LegalDocumentController.getById);

// Actualizar un documento legal por ID (mantener endpoint genérico si es necesario)
// router.put('/:id', authenticate, LegalDocumentController.update);

// PUT específicos según permisos y belongs_to
// Admin: solo puede cambiar status y notes de cualquier documento
router.put('/:id/admin', authenticate, authorize(['admin']), LegalDocumentController.updateByAdmin);

// Uploader (belongs_to 'user' o 'property'): solo id_user puede modificar type, description y url_document
router.put('/:id/uploader', authenticate, LegalDocumentController.updateByOwnerOrUploader);

// Documentos pertenecientes a una application
// - Renter: si es el renter de la application, puede editar type, description y status
router.put('/:id/application/renter', authenticate, LegalDocumentController.updateApplicationByRenter);

// - Owner: si es el owner de la property asociada a la application, puede editar status y notes
router.put('/:id/application/owner', authenticate, LegalDocumentController.updateApplicationByOwner);

// Eliminar un documento legal por ID
router.delete('/:id', LegalDocumentController.delete);

module.exports = router;