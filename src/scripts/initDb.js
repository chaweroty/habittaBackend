const { Database } = require('../config/database');
const { HashUtils } = require('../utils/hash');

async function initializeDatabase() {
  const db = Database.getInstance();
  
  try {
    console.log('🔄 Inicializando base de datos...');
    
    // Crear tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user' NOT NULL,
        creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_creation_date (creation_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await db.query(createUsersTable);
    console.log('✅ Tabla de usuarios creada');
    
    // Verificar si ya existe el admin
    const adminExists = await db.query('SELECT COUNT(*) as count FROM users WHERE email = ?', ['admin@habitta.com']);
    
    if (adminExists[0].count === 0) {
      // Crear usuario administrador por defecto
      const adminPassword = await HashUtils.hashPassword('admin123');
      await db.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['Administrador', 'admin@habitta.com', adminPassword, '1234567890', 'admin']
      );
      console.log('✅ Usuario administrador creado');
      console.log('📧 Email: admin@habitta.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }
    
    // Verificar si ya existe el usuario demo
    const userExists = await db.query('SELECT COUNT(*) as count FROM users WHERE email = ?', ['user@habitta.com']);
    
    if (userExists[0].count === 0) {
      // Crear usuario demo
      const userPassword = await HashUtils.hashPassword('user123');
      await db.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['Usuario Demo', 'user@habitta.com', userPassword, '0987654321', 'user']
      );
      console.log('✅ Usuario demo creado');
      console.log('📧 Email: user@habitta.com');
      console.log('🔑 Password: user123');
    } else {
      console.log('ℹ️  Usuario demo ya existe');
    }
    
    console.log('🎉 Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Ejecutar la inicialización
initializeDatabase();
