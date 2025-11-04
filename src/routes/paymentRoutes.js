const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { authenticate } = require('../middleware/auth');

// GET /api/payments/my - Obtener pagos relacionados al usuario autenticado (como pagador o receptor)
router.get('/my', authenticate, PaymentController.getMyPayments);

router.post('/createPaymentIntent/:id', authenticate, PaymentController.createPaymentIntent);

// Stripe webhook endpoint (must accept raw body and no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);
module.exports = router;
