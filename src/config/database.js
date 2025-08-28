const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'db_habitta',
  port: parseInt(process.env.DB_PORT || '3306'),
};

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    this.pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    Database.instance = this;
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  getConnection() {
    return this.pool;
  }

  async query(sql, params = []) {
    const connection = this.pool;
    const [results] = await connection.execute(sql, params);
    return results;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { Database, dbConfig };
