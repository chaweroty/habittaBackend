const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { authenticate } = require('../middleware/auth');

// GET /api/payments/my - Obtener pagos relacionados al usuario autenticado (como pagador o receptor)
router.get('/my', authenticate, PaymentController.getMyPayments);

module.exports = router;
