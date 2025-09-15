const { HashUtils } = require('./src/utils/hash');

async function generateHash() {
  const password = 'Admin123';
  const hashedPassword = await HashUtils.hashPassword(password);
  console.log('Contraseña original:', password);
  console.log('Hash generado:', hashedPassword);
  console.log('\nSQL para insertar:');
  console.log(`INSERT INTO user (id, name, email, password, phone, role) VALUES`);
  console.log(`(UUID(), 'Administrador', 'admin2@gmail.com', '${hashedPassword}', '1234567890', 'admin')`);
  console.log(`ON DUPLICATE KEY UPDATE name = name;`);
}

generateHash().catch(console.error);