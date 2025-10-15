const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class PaymentService {
  /**
   * Create a payment record for a subscription. Does not attempt to process payment.
   * - subscription: subscription object returned by Prisma
   * - plan: plan object used for naming/concept
   */
  async createPaymentForSubscription(subscription, plan) {
    if (!subscription) return null;
    try {
      const payment = await prisma.payment.create({
        data: {
          id_payer: subscription.id_owner,
          id_receiver: null,
          related_type: 'subscription',
          id_related: subscription.id,
          concept: `Pago de la suscripción - ${plan ? plan.name : ''}`,
          description: null,
          amount: subscription.plan_price,
          // currency uses default in schema
          method: null,
          payment_date: null,
          due_date: null,
          reference_code: null,
          notes: 'Auto-generated payment for subscription creation',
          // created_at, status defaults will apply
        }
      });

      return payment;
    } catch (err) {
      console.error('PaymentService.createPaymentForSubscription error:', err);
      return null;
    }
  }
}

module.exports = { PaymentService };
