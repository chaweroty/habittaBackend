const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class SubscriptionService {
  /**
   * Create an automatic subscription for a given property and plan.
   * - property: created property object from Prisma
   * - plan: plan object (may be null) or planId number
   */
  async createAutomaticForProperty(property, planOrId) {
    try {
      let plan = planOrId;
      if (!plan) return null;

      // If planOrId is an id, fetch the plan
      if (typeof planOrId === 'number' || typeof planOrId === 'string') {
        plan = await prisma.plan.findUnique({ where: { id: Number(planOrId) } });
        if (!plan) return null;
      }

      // Calcular plan_price: si plan.price < 1 se interpreta como porcentaje
      let planPrice = plan.price;
      if (planPrice < 1) {
        planPrice = property.price * plan.price;
      }

      // Calcular final_date a partir de duration_days (int): 30 = 1 mes, 15 = 15 días
      let finalDate = null;
      if (plan.duration_days && plan.duration_days > 0) {
        const now = new Date();
        const dateWithDays = new Date(now);
        dateWithDays.setDate(dateWithDays.getDate() + plan.duration_days);
        finalDate = dateWithDays;
      }

      const subscription = await prisma.subscription.create({
        data: {
          id_owner: property.id_owner,
          id_property: property.id,
          id_plan: plan.id,
          start_date: new Date(),
          final_date: finalDate,
          status: 'active',
          auto_renew: false,
          plan_price: planPrice
        }
      });

      // If plan is not the free/default plan (id !== 1), create a payment record
      try {
        if (plan.id !== 1) {
          const { PaymentService } = require('./PaymentService.prisma');
          const paymentService = new PaymentService();
          await paymentService.createPaymentForSubscription(subscription, plan);
        }
      } catch (paymentErr) {
        // Log payment errors but don't fail subscription creation
        console.error('Error creating payment for subscription:', paymentErr);
      }

      return subscription;
    } catch (err) {
      // Do not throw to keep property creation resilient; return null to indicate failure
      console.error('SubscriptionService.createAutomaticForProperty error:', err);
      return null;
    }
  }
}

module.exports = { SubscriptionService };
