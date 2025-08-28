const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class JWTUtils {
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const options = {
      expiresIn: JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, JWT_SECRET, options);
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = { JWTUtils };
