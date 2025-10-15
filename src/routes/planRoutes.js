const express = require('express');
const router = express.Router();
const PlanController = require('../controllers/PlanController');

// GET /api/plans - Obtener todos los planes disponibles
router.get('/', PlanController.getAll);

module.exports = router;
