const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateParams } = require('../middleware/validation');
const { z } = require('zod');
const { StatsController } = require('../controllers/StatsController');

const statsController = new StatsController();
const router = Router();

// Schema para validar el parámetro ownerId
const ownerIdParamsSchema = z.object({
  ownerId: z.string().uuid('El ID del propietario debe ser un UUID válido')
});

// GET /stats/owner/:ownerId - Obtener estadísticas del propietario
router.get('/owner/:ownerId', 
  authenticate, 
  authorize(['owner', 'admin']), 
  validateParams(ownerIdParamsSchema), 
  statsController.getOwnerStats
);

// GET /stats/income/:ownerId?period=3months - Obtener ingresos del propietario por período
router.get('/income/:ownerId', 
  authenticate, 
  authorize(['owner', 'admin']), 
  validateParams(ownerIdParamsSchema), 
  statsController.getOwnerIncome
);

module.exports = router;