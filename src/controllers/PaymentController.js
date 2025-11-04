const { PaymentService } = require('../services/PaymentService.prisma');
const paymentService = new PaymentService();

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
