const { PaymentService } = require('../services/PaymentService.prisma');
const { PrismaClient } = require('../generated/prisma');
const paymentService = new PaymentService();
const prisma = new PrismaClient();

class PaymentController {
  async getMyPayments(req, res, next) {
    try {
      const userId = req.user && req.user.userId;

      const mapped = await paymentService.getPaymentsForUser(userId);
      res.json({ success: true, data: mapped });
    } catch (error) {
      next(error);
    }
  }

  async getLatestPaymentByApplication(req, res, next) {
    try {
      const { applicationId } = req.params;
      const currentUserId = req.user && req.user.userId;

      if (!currentUserId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      // Verificar que la aplicación existe y que el usuario tiene permisos
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          property: { select: { id_owner: true } }
        }
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Aplicación no encontrada'
        });
      }

      const isRenter = application.id_renter === currentUserId;
      const isOwner = application.property.id_owner === currentUserId;
      const isAdmin = req.user.role === 'admin';

      if (!isRenter && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver los pagos de esta aplicación'
        });
      }

      const payment = await paymentService.getLatestPaymentByApplication(applicationId);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async createPaymentIntent(req, res, next) {
    try {
      const id_pay = req.params.id;
      
      const response = await paymentService.createPaymentIntent({id_pay});
      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      // Expect raw body (Buffer) provided by express.raw middleware on the route
      const sigHeader = req.headers['stripe-signature'];
      const rawBody = req.body;

      const result = await paymentService.handleStripeWebhook(rawBody, sigHeader);

      // Respond 200 OK to Stripe
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();
