const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class PaymentService {
  /**
   * Create a payment record for a subscription. Does not attempt to process the payment gateway.
   * - subscription: subscription object returned by Prisma
   * - plan: plan object used for naming/concept
   * Returns the created payment or null.
   */
  async createPaymentForSubscription(subscription, plan) {
    try {
      if (!subscription) return null;

      const amount = subscription.plan_price ?? (plan ? plan.price : null);
      if (!amount || amount <= 0) return null; // nothing to charge

      const payment = await prisma.payment.create({
        data: {
          id_payer: subscription.id_owner,
          id_receiver: null,
          related_type: 'subscription',
          id_related: subscription.id,
          concept: `Pago suscripción: ${plan ? plan.name : 'suscripción'}`,
          description: `Pago automático por suscripción de la propiedad ${subscription.id_property}`,
          amount: Number(amount),
          currency: 'COP',
          method: null,
          payment_date: null,
          due_date: null,
          reference_code: `sub_${Date.now()}_${Math.floor(Math.random()*10000)}`,
          notes: 'Auto-generated payment for subscription creation',
          status: 'pending'
        }
      });

      return payment;
    } catch (err) {
      console.error('PaymentService.createPaymentForSubscription error:', err);
      return null;
    }
  }

  /**
   * Obtener pagos relacionados a un usuario (como pagador o receptor)
   * Devuelve los registros ordenados por created_at desc
   */
  async getPaymentsByUser(userId) {
    try {
      if (!userId) return [];
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { id_payer: userId },
            { id_receiver: userId }
          ]
        },
        orderBy: { created_at: 'desc' }
      });
      return payments;
    } catch (err) {
      console.error('PaymentService.getPaymentsByUser error:', err);
      return [];
    }
  }
}

module.exports = { PaymentService };
