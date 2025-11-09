const { Router } = require('express');
const { MaintenanceController } = require('../controllers/MaintenanceController');
const { authenticate, authorize } = require('../middleware/auth');
const maintenanceController = new MaintenanceController();

const router = Router();

// GET /maintenances/my - Obtener mantenimientos del usuario autenticado (como inquilino)
// DEBE IR ANTES que /:id
router.get('/my', authenticate, maintenanceController.getMyMaintenances);

// GET /maintenances/my-owner - Obtener mantenimientos del usuario autenticado (como propietario)
// DEBE IR ANTES que /:id
router.get('/my-owner', authenticate, authorize(['owner']), maintenanceController.getMyOwnerMaintenances);

// GET /maintenances/property/:propertyId - Obtener mantenimientos de una propiedad
// DEBE IR ANTES que /:id
router.get('/property/:propertyId', authenticate, maintenanceController.getMaintenancesByProperty);

// POST /maintenances - Crear un mantenimiento
router.post('/', authenticate, maintenanceController.createMaintenance);

// GET /maintenances - Obtener todos los mantenimientos (solo admin)
router.get('/', authenticate, authorize(['admin']), maintenanceController.getAllMaintenances);

// GET /maintenances/:id - Obtener un mantenimiento por ID
router.get('/:id', authenticate, maintenanceController.getMaintenance);

// PATCH /maintenances/:id - Actualizar un mantenimiento
router.patch('/:id', authenticate, maintenanceController.updateMaintenance);

// DELETE /maintenances/:id - Eliminar un mantenimiento
router.delete('/:id', authenticate, maintenanceController.deleteMaintenance);

module.exports = router;
