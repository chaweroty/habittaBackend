const { HashUtils } = require('../utils/hash');
const { JWTUtils } = require('../utils/jwt');
const { PrismaClient } = require('../generated/prisma');
const { 
  sendWelcomeEmail, 
  sendConfirmationEmail, 
  sendOwnerVerifiedEmail, 
  sendPasswordResetEmail,
  generateVerificationCode 
} = require('./emailService');

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
        status: true,
        verificationCode: true,
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
        status: true,
        verificationCode: true,
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
        role: userData.role || 'user',
        status: userData.status || 'Unverified',
        verificationCode: userData.verificationCode || null
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

    // Usar transacción para garantizar consistencia
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar documentos legales del usuario
      await tx.legalDocument.deleteMany({ where: { id_user: id } });

      // 2. Eliminar aplicaciones del usuario (como arrendatario)
      await tx.application.deleteMany({ where: { id_renter: id } });

      // 3. Obtener propiedades del usuario para eliminar sus dependencias
      const userProperties = await tx.property.findMany({ where: { id_owner: id } });

      for (const property of userProperties) {
        // 3.1. Eliminar documentos legales de las propiedades
        await tx.legalDocument.deleteMany({ where: { id_property: property.id } });

        // 3.2. Eliminar aplicaciones de las propiedades
        const propertyApplications = await tx.application.findMany({ where: { id_property: property.id } });
        for (const application of propertyApplications) {
          await tx.legalDocument.deleteMany({ where: { id_application: application.id } });
        }
        await tx.application.deleteMany({ where: { id_property: property.id } });

        // 3.3. Eliminar imágenes de las propiedades
        await tx.imageProperty.deleteMany({ where: { id_property: property.id } });

        // 3.4. Eliminar suscripciones de las propiedades
        await tx.subscription.deleteMany({ where: { id_property: property.id } });
      }

      // 4. Eliminar propiedades del usuario
      await tx.property.deleteMany({ where: { id_owner: id } });

      // 5. Eliminar suscripciones donde el usuario es propietario (por si quedaron algunas)
      await tx.subscription.deleteMany({ where: { id_owner: id } });

      // 6. Finalmente eliminar el usuario
      await tx.user.delete({ where: { id } });
    });

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
      status: user.status,
      verificationCode: user.verificationCode,
      creation_date: user.creation_date
    };
    const token = JWTUtils.generateToken(userWithoutPassword);
    return { user: userWithoutPassword, token };
  }

  async register(userData) {
    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    
    // Crear usuario con código de verificación
    const userDataWithCode = {
      ...userData,
      verificationCode,
      status: 'Unverified'
    };
    
    const newUser = await this.createUser(userDataWithCode);
    const token = JWTUtils.generateToken(newUser);
    
    // Enviar emails de forma asíncrona (no bloquear la respuesta)
    Promise.all([
      sendWelcomeEmail(newUser.email, newUser.name),
      sendConfirmationEmail(newUser.email, newUser.name, verificationCode)
    ]).catch(error => {
      console.error('❌ Error enviando emails de registro:', error);
      // No lanzar error para no afectar el registro
    });
    
    return { user: newUser, token };
  }

  async requestOwnerRole(id) {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: 'owner',
        status: 'Pending'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        verificationCode: true,
        creation_date: true
      }
    });

    // Generar nuevo token con el rol actualizado
    const token = JWTUtils.generateToken(updatedUser);
    
    return { user: updatedUser, token };
  }
}

module.exports = { UserService };
