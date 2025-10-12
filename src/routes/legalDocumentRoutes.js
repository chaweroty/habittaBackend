const express = require('express');
const router = express.Router();
const LegalDocumentController = require('../controllers/LegalDocumentController');

// Obtener todos los documentos legales
router.get('/', LegalDocumentController.getAll);

// Obtener un documento legal por ID
router.get('/:id', LegalDocumentController.getById);

// Crear un nuevo documento legal
router.post('/', LegalDocumentController.create);

// Actualizar un documento legal por ID
router.put('/:id', LegalDocumentController.update);

// Eliminar un documento legal por ID
router.delete('/:id', LegalDocumentController.delete);

module.exports = router;