const { PrismaClient } = require('../generated/prisma');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const prisma = new PrismaClient();
const { sendPaymentConfirmationToSender, sendPaymentConfirmationToReceiver } = require('./emailService');
const { sendPaymentCompletedToSenderNotification, sendPaymentReceivedNotification } = require('./pushNotificationService');

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
   * Create a general payment record
   * Returns the created payment.
   */
  async createPayment(paymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          id_payer: paymentData.id_payer,
          id_receiver: paymentData.id_receiver || null,
          related_type: paymentData.related_type,
          id_related: paymentData.id_related,
          concept: paymentData.concept,
          description: paymentData.description || null,
          amount: Number(paymentData.amount),
          currency: paymentData.currency || 'COP',
          method: paymentData.method || null,
          payment_date: paymentData.payment_date || null,
          due_date: paymentData.due_date || null,
          reference_code: paymentData.reference_code || `pay_${Date.now()}_${Math.floor(Math.random()*10000)}`,
          notes: paymentData.notes || null,
          status: paymentData.status || 'pending'
        }
      });

      return payment;
    } catch (err) {
      console.error('PaymentService.createPayment error:', err);
      throw err;
    }
  }

  /**
   * Obtener el pago más reciente relacionado con una aplicación específica
   * Devuelve el pago con la fecha de creación más reciente
   */
  async getLatestPaymentByApplication(applicationId) {
    try {
      if (!applicationId) return null;

      const payment = await prisma.payment.findFirst({
        where: {
          id_related: applicationId,
          related_type: 'rent'
        },
        orderBy: { created_at: 'desc' }
      });

      return payment;
    } catch (err) {
      console.error('PaymentService.getLatestPaymentByApplication error:', err);
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

  /**
   * Obtener pagos enriquecidos para un usuario:
   * - incluye counterparty_name (nombre de la contraparte o 'Habitta')
   * - incluye is_payer, is_receiver y my_role
   */
  async getPaymentsForUser(userId) {
    try {
      if (!userId) return [];

      // Obtener pagos crudos
      const payments = await this.getPaymentsByUser(userId);

      // Recolectar ids de usuarios a buscar
      const idsToFetch = new Set();
      payments.forEach(p => {
        if (p.id_receiver && p.id_receiver !== userId) idsToFetch.add(p.id_receiver);
        if (p.id_payer && p.id_payer !== userId) idsToFetch.add(p.id_payer);
      });

      let usersMap = new Map();
      if (idsToFetch.size > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: Array.from(idsToFetch) } },
          select: { id: true, name: true }
        });
        users.forEach(u => usersMap.set(u.id, u.name));
      }

      // Enriquecer pagos
      const mapped = payments.map(p => {
        let counterparty_name = 'Habitta';

        if (p.id_payer === userId) {
          if (p.id_receiver) counterparty_name = usersMap.get(p.id_receiver) || 'Habitta';
        } else if (p.id_receiver === userId) {
          if (p.id_payer) counterparty_name = usersMap.get(p.id_payer) || 'Habitta';
        } else {
          if (p.id_receiver) counterparty_name = usersMap.get(p.id_receiver) || 'Habitta';
          else if (p.id_payer) counterparty_name = usersMap.get(p.id_payer) || 'Habitta';
        }

        const is_payer = p.id_payer === userId;
        const is_receiver = p.id_receiver === userId;
        const my_role = is_payer ? 'payer' : (is_receiver ? 'receiver' : 'other');

        return {
          ...p,
          counterparty_name,
          is_payer,
          is_receiver,
          my_role
        };
      });

      return mapped;
    } catch (err) {
      console.error('PaymentService.getPaymentsForUser error:', err);
      return [];
    }
  }

  async createPaymentIntent({id_pay}) {
    // Aquí se integraría con la API de Stripe para crear un Payment Intent
    // Crea PaymentIntent en Stripe
    try {
      const paymentRecord = await prisma.payment.findUnique({ where: { id_pay: id_pay } });
      if (!paymentRecord) throw new Error('Registro de pago no encontrado');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentRecord.amount * 100,
        currency: paymentRecord.currency,
        automatic_payment_methods: { enabled: true },
        metadata: { id_related: paymentRecord.id_related, related_type: paymentRecord.related_type, concept: paymentRecord.concept },
      });

      console.log('Created Stripe PaymentIntent:', paymentIntent.payment_method_types);

      const paymentUpdate = await prisma.payment.update({
        where: { id_pay: id_pay },
        data: {
          reference_code: paymentIntent.id,
          status: 'pending'
        }
      });

      // Devolver client_secret y el objeto completo del payment actualizado
      return { client_secret: paymentIntent.client_secret, payment: paymentUpdate };
    }
    catch (err) {
      console.error('PaymentService.createPaymentIntent error:', err);
      throw err;
    }
  }

  /**
   * Procesar evento webhook de Stripe (verifica firma y actualiza pago)
   * - rawBody: Buffer (raw request body)
   * - sigHeader: string (Stripe-Signature header)
   */
  async handleStripeWebhook(rawBody, sigHeader) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event;

      console.log('Processing Stripe webhook event');

      if (!webhookSecret) {
        // If webhook secret is not configured, try to parse without verification (not recommended)
        event = JSON.parse(rawBody.toString());
      } else {
        event = stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
      }

      const type = event.type;
      const intent = event.data.object;

      // Map event types to payment status and update the payment record whose reference_code == intent.id
      const statusMap = {
        'payment_intent.succeeded': { status: 'completed', setDate: true },
        'payment_intent.payment_failed': { status: 'failed', setDate: false },
        'payment_intent.canceled': { status: 'failed', setDate: false },
        'payment_intent.processing': { status: 'processing', setDate: false }
      };

      if (!statusMap[type]) {
        // Ignore other events
        return { handled: false, message: `Ignored event type ${type}` };
      }

      const mapping = statusMap[type];

      // Determinar el método de pago solo si el pago fue exitoso y hay payment_method
      let paymentMethodType = null;
      if (mapping.status === 'completed' && intent.payment_method) {
        try {
          const paymentMethod = await stripe.paymentMethods.retrieve(intent.payment_method);
          const methodType = paymentMethod.type;
          
          // Mapear tipos de método a nuestras categorías
          if (methodType === 'card') {
            paymentMethodType = 'card';
          } else if (methodType === 'google_pay' || methodType === 'amazon_pay' || methodType === 'apple_pay') {
            paymentMethodType = 'app_transfer';
          } else {
            paymentMethodType = 'other';
          }
        } catch (err) {
          console.warn('Could not retrieve payment method:', err.message);
          paymentMethodType = 'other';
        }
      }

      const updateData = {
        status: mapping.status,
        payment_date: mapping.setDate && mapping.status === 'completed' ? new Date() : undefined
      };

      // Solo actualizar method si tenemos un valor
      if (paymentMethodType) {
        updateData.method = paymentMethodType;
      }

      const updated = await prisma.payment.updateMany({
        where: { reference_code: intent.id },
        data: updateData
      });

      console.log(`Updated ${updated.count} payment(s) for PaymentIntent ${intent.id} to status ${mapping.status}`);

      // Si el pago se completó exitosamente, enviar confirmaciones por email
      if (mapping.status === 'completed' && updated.count > 0) {
        try {
          // Obtener el ID del pago actualizado para enviar confirmaciones
          const updatedPayment = await prisma.payment.findFirst({
            where: { reference_code: intent.id },
            select: { id_pay: true }
          });

          if (updatedPayment) {
            await this.sendPaymentConfirmations(updatedPayment.id_pay);
          }
        } catch (confirmationError) {
          console.error('Error enviando confirmaciones de pago:', confirmationError);
          // No lanzamos error para no afectar el webhook
        }
      }

      return { handled: true, updatedCount: updated.count, type };
    } catch (err) {
      console.error('PaymentService.handleStripeWebhook error:', err);
      throw err;
    }
  }

  /**
   * Enviar confirmaciones de pago por email y push notifications después de que un pago se complete
   * @param {string} paymentId - ID del pago completado
   */
  async sendPaymentConfirmations(paymentId) {
    try {
      // Obtener el pago con información relacionada
      const payment = await prisma.payment.findUnique({
        where: { id_pay: paymentId },
        include: {
          payer: { select: { name: true, email: true } },
          receiver: { select: { name: true, email: true } },
          application: {
            include: {
              property: { select: { title: true } }
            }
          }
        }
      });

      if (!payment || payment.status !== 'completed') {
        console.log('Pago no encontrado o no completado, omitiendo envío de confirmaciones');
        return;
      }

      // Preparar datos comunes para ambos emails
      const paymentData = {
        concepto: payment.concept,
        monto: payment.amount,
        moneda: payment.currency,
        fecha_pago: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO'),
        referencia: payment.reference_code,
        es_alquiler: payment.related_type === 'rent'
      };

      // Agregar información de propiedad si existe
      if (payment.application?.property) {
        paymentData.titulo_propiedad = payment.application.property.title;
      }

      // Enviar confirmación al pagador
      if (payment.payer?.email) {
        const senderData = {
          ...paymentData,
          nombre_pagador: payment.payer.name
        };

        try {
          await sendPaymentConfirmationToSender(payment.payer.email, senderData);
        } catch (emailError) {
          console.error('Error enviando confirmación al pagador:', emailError);
          // No lanzamos error para no interrumpir el proceso
        }
      }

      // Enviar notificación push al pagador
      if (payment.payer?.pushToken) {
        try {
          await sendPaymentCompletedToSenderNotification(
            payment.payer.pushToken,
            payment.concept,
            payment.amount,
            payment.currency
          );
        } catch (pushError) {
          console.error('Error enviando notificación push al pagador:', pushError);
          // No lanzamos error para no interrumpir el proceso
        }
      }

      // Enviar confirmación al receptor
      if (payment.receiver?.email) {
        const receiverData = {
          ...paymentData,
          nombre_receptor: payment.receiver.name,
          nombre_pagador: payment.payer?.name || 'Usuario'
        };

        try {
          await sendPaymentConfirmationToReceiver(payment.receiver.email, receiverData);
        } catch (emailError) {
          console.error('Error enviando confirmación al receptor:', emailError);
          // No lanzamos error para no interrumpir el proceso
        }
      }

      // Enviar notificación push al receptor
      if (payment.receiver?.pushToken) {
        try {
          await sendPaymentReceivedNotification(
            payment.receiver.pushToken,
            payment.payer?.name || 'Usuario',
            payment.concept,
            payment.amount,
            payment.currency
          );
        } catch (pushError) {
          console.error('Error enviando notificación push al receptor:', pushError);
          // No lanzamos error para no interrumpir el proceso
        }
      }

      console.log(`✅ Confirmaciones de pago enviadas para el pago ${paymentId}`);
    } catch (error) {
      console.error('❌ Error enviando confirmaciones de pago:', error);
      // No lanzamos el error para no interrumpir el flujo de webhook
    }
  }
}

module.exports = { PaymentService };
