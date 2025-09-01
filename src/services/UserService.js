const { HashUtils } = require('../utils/hash');
const { JWTUtils } = require('../utils/jwt');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers() {
    return this.userRepository.findAll();
  }

  async getUserById(id) {
    return this.userRepository.findById(id);
  }

  async createUser(userData) {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.emailExists(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await HashUtils.hashPassword(userData.password);

    // Crear usuario con contraseña hasheada
    const userToCreate = {
      ...userData,
      password: hashedPassword
    };

    // Crear usuario en la base de datos
    const createdUser = await this.userRepository.create(userToCreate);

    // Si el usuario no es admin, crear suscripción gratuita
    if (createdUser.role !== 'admin') {
      const SubscriptionRepository = require('../repositories/SubscriptionRepository');
      await SubscriptionRepository.createFreeSubscriptionForUser(createdUser.id);
    }

    return createdUser;
  }

  async updateUser(id, userData) {
    // Verificar si el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si el email ya está en uso por otro usuario
    if (userData.email) {
      const emailExists = await this.userRepository.emailExists(userData.email, id);
      if (emailExists) {
        throw new Error('El email ya está registrado por otro usuario');
      }
    }

    return this.userRepository.update(id, userData);
  }

  async deleteUser(id) {
    // Verificar si el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    return this.userRepository.delete(id);
  }

  async login(loginData) {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await HashUtils.comparePassword(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Crear usuario sin contraseña para la respuesta
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      creation_date: user.creation_date
    };

    // Generar token JWT
    const token = JWTUtils.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  }

  async register(userData) {
    // Crear el usuario
    const newUser = await this.createUser(userData);

    // Generar token JWT para el nuevo usuario
    const token = JWTUtils.generateToken(newUser);

    return {
      user: newUser,
      token
    };
  }
}

module.exports = { UserService };
