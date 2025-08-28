const bcrypt = require('bcryptjs');

class HashUtils {
  static async hashPassword(password) {
    const SALT_ROUNDS = 12;
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = { HashUtils };
