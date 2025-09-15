const { HashUtils } = require('../utils/hash');
const { JWTUtils } = require('../utils/jwt');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { creation_date: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        creation_date: true
      }
    });
  }

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        creation_date: true
      }
    });
  }

  async getUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async emailExists(email, excludeId = null) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(excludeId && { NOT: { id: excludeId } })
      }
    });
    return !!user;
  }

  async createUser(userData) {
    const existingUser = await this.emailExists(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }
    const hashedPassword = await HashUtils.hashPassword(userData.password);
    const createdUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        role: userData.role || 'user'
      }
    });
    // Ya no se crea suscripción automáticamente
    return createdUser;
  }

  async updateUser(id, userData) {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }
    if (userData.email) {
      const emailExists = await this.emailExists(userData.email, id);
      if (emailExists) {
        throw new Error('El email ya está registrado por otro usuario');
      }
    }
    const hashedPassword = await HashUtils.hashPassword(userData.password);
    userData.password = hashedPassword;
    return prisma.user.update({
      where: { id },
      data: userData
    });
  }

  async deleteUser(id) {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }
    await prisma.subscription.deleteMany({ where: { id_owner: id } });
    await prisma.user.delete({ where: { id } });
    return true;
  }

  async login(loginData) {
    const user = await this.getUserByEmail(loginData.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    const isPasswordValid = await HashUtils.comparePassword(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      creation_date: user.creation_date
    };
    const token = JWTUtils.generateToken(userWithoutPassword);
    return { user: userWithoutPassword, token };
  }

  async register(userData) {
    const newUser = await this.createUser(userData);
    const token = JWTUtils.generateToken(newUser);
    return { user: newUser, token };
  }
}

module.exports = { UserService };
