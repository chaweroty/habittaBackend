const { Database } = require('../config/database');

class SubscriptionRepository {
  async createFreeSubscriptionForUser(id_user) {
    const db = Database.getInstance();
    const sql = `INSERT INTO subscriptions (id_user, plan, tipo, start_date, end_date) VALUES (?, 'basico', 'gratuito', NOW(), NULL)`;
    await db.query(sql, [id_user]);
    return { id_user, plan: 'basico', tipo: 'gratuito' };
  }
}

module.exports = new SubscriptionRepository();
