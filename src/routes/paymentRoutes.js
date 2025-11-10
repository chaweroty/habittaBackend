const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { authenticate } = require('../middleware/auth');

// GET /api/payments/my - Obtener pagos relacionados al usuario autenticado (como pagador o receptor)
router.get('/my', authenticate, PaymentController.getMyPayments);

// POST /api/payments/createPaymentIntent/:id - Crear PaymentIntent de Stripe
router.post('/createPaymentIntent/:id', authenticate, PaymentController.createPaymentIntent);

// NOTA: La ruta /webhook se registra directamente en app.js ANTES del middleware express.json()
// para que pueda recibir el raw body (Buffer) requerido por Stripe para verificar la firma

module.exports = router;
