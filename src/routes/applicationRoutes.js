const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/ApplicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateApplication, validateApplicationUpdate } = require('../middleware/validation');

// POST /api/applications - Crear una nueva aplicación (cualquier usuario autenticado)
router.post('/', authenticate, validateApplication, ApplicationController.createApplication);

// GET /api/applications/my - Obtener mis aplicaciones (user)
router.get('/my', authenticate, authorize(['user']), ApplicationController.getMyApplications);

// GET /api/applications/my-owner - Obtener aplicaciones de mis propiedades (owner)
router.get('/my-owner', authenticate, authorize(['owner']), ApplicationController.getMyOwnerApplications);

// GET /api/applications - Obtener todas las aplicaciones (solo admin)
router.get('/', authenticate, authorize(['admin']), ApplicationController.getAllApplications);

// GET /api/applications/property/:propertyId - Obtener aplicaciones de una propiedad específica (propietarios y admin)
router.get('/property/:propertyId', authenticate, ApplicationController.getApplicationsByProperty);

// GET /api/applications/:id - Obtener una aplicación específica (verificación de permisos en el controlador)
router.get('/:id', authenticate, ApplicationController.getApplication);

// PUT /api/applications/:id - Actualizar una aplicación (verificación de permisos en el controlador)
router.put('/:id', authenticate, validateApplicationUpdate, ApplicationController.updateApplication);

// DELETE /api/applications/:id - Eliminar una aplicación (verificación de permisos en el controlador)
router.delete('/:id', authenticate, ApplicationController.deleteApplication);

module.exports = router;