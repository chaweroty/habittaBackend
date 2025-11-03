const { PaymentService } = require('../services/PaymentService.prisma');
const { PrismaClient } = require('../generated/prisma');
const paymentService = new PaymentService();
const prisma = new PrismaClient();

class PaymentController {
  async getMyPayments(req, res, next) {
    try {
      const userId = req.user && req.user.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }

      const payments = await paymentService.getPaymentsByUser(userId);

      // Preparar lista de userIds a consultar (evitar incluir el propio userId)
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

      // Mapear cada payment y añadir counterparty_name
      const mapped = payments.map(p => {
        let counterparty_name = 'Habitta';

        if (p.id_payer === userId) {
          // Usuario es quien paga -> contraparte es receiver
          if (p.id_receiver) counterparty_name = usersMap.get(p.id_receiver) || 'Habitta';
        } else if (p.id_receiver === userId) {
          // Usuario es receptor -> contraparte es payer
          if (p.id_payer) counterparty_name = usersMap.get(p.id_payer) || 'Habitta';
        } else {
          // Si no está claramente en payer/receiver, intentar usar receiver > payer > Habitta
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

      res.json({ success: true, data: mapped });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
