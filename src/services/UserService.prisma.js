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
      where: {
        status: { not: 'Deleted' }
      },
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
    return prisma.user.findFirst({
      where: { 
        email,
        status: { not: 'Deleted' }
      }
    });
  }

  async emailExists(email, excludeId = null) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        status: { not: 'Deleted' },
        ...(excludeId && { NOT: { id: excludeId } })
      }
    });
    return !!user;
  }

  async createUser(userData) {
    // Verificar si existe un usuario activo con ese email
    const existingActiveUser = await this.emailExists(userData.email);
    if (existingActiveUser) {
      throw new Error('El email ya está registrado');
    }

    // Verificar si existe un usuario eliminado con ese email
    const deletedUser = await prisma.user.findFirst({
      where: {
        email: userData.email,
        status: 'Deleted'
      }
    });

    // Si existe un usuario eliminado, actualizar sus datos en lugar de crear uno nuevo
    if (deletedUser) {
      const hashedPassword = await HashUtils.hashPassword(userData.password);
      const updatedUser = await prisma.user.update({
        where: { id: deletedUser.id },
        data: {
          name: userData.name,
          password: hashedPassword,
          phone: userData.phone,
          role: userData.role || 'user',
          status: userData.status || 'Unverified',
          verificationCode: userData.verificationCode || null,
          creation_date: new Date() // Actualizar fecha de creación
        }
      });
      return updatedUser;
    }

    // Si no existe usuario eliminado, crear uno nuevo
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

    // Preparar datos para actualización
    const updateData = { ...userData };

    // Si la contraseña está vacía o no se proporciona, no la incluimos en la actualización
    if (!userData.password || userData.password.trim() === '') {
      delete updateData.password;
    } else {
      // Si la contraseña tiene contenido, la hasheamos
      updateData.password = await HashUtils.hashPassword(userData.password);
    }

    return prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async deleteUser(id) {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar que no esté ya eliminado
    if (existingUser.status === 'Deleted') {
      throw new Error('El usuario ya ha sido eliminado');
    }

    // Usar transacción para garantizar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener todas las propiedades del usuario
      const userProperties = await tx.property.findMany({
        where: { id_owner: id },
        select: { id: true }
      });

      const propertyIds = userProperties.map(p => p.id);

      // 2. Rechazar todas las aplicaciones activas de sus propiedades
      if (propertyIds.length > 0) {
        await tx.application.updateMany({
          where: {
            id_property: {
              in: propertyIds
            },
            status: {
              notIn: ['rejected', 'withdrawn', 'terminated']
            }
          },
          data: {
            status: 'rejected'
          }
        });

        // 3. Obtener todas las suscripciones de las propiedades
        const subscriptions = await tx.subscription.findMany({
          where: {
            id_property: {
              in: propertyIds
            }
          },
          select: { id: true }
        });

        const subscriptionIds = subscriptions.map(s => s.id);

        // 4. Cancelar todas las suscripciones
        if (subscriptionIds.length > 0) {
          await tx.subscription.updateMany({
            where: {
              id: {
                in: subscriptionIds
              }
            },
            data: {
              status: 'cancelled'
            }
          });

          // 5. Cancelar pagos pendientes/procesando/atrasados de esas suscripciones
          await tx.payment.updateMany({
            where: {
              related_type: 'subscription',
              id_related: {
                in: subscriptionIds
              },
              status: {
                in: ['pending', 'processing', 'overdue']
              }
            },
            data: {
              status: 'cancelled'
            }
          });
        }
      }

      // 6. Cambiar status de todas las propiedades del usuario a 'deleted'
      await tx.property.updateMany({
        where: { id_owner: id },
        data: { publication_status: 'deleted' }
      });

      // 7. Soft delete del usuario: cambiar status a 'Deleted'
      const deletedUser = await tx.user.update({
        where: { id },
        data: { 
          status: 'Deleted',
          pushToken: '' // Limpiar push token al eliminar
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          creation_date: true
        }
      });

      return deletedUser;
    });

    return result;
  }

  async login(loginData) {
    const user = await prisma.user.findFirst({
      where: { email: loginData.email }
    });
    
    // Si no existe el usuario o está eliminado, retornar el mismo error
    if (!user || user.status === 'Deleted') {
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

    // If user is Unverified, return only the user object (no token)
    if (user.status === 'Unverified') {
      return { user: userWithoutPassword };
    }

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

  async resendVerificationCode(email) {
    // Buscar usuario por email (excluyendo eliminados)
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }


    // Generar nuevo código y actualizar usuario
    const { generateVerificationCode, sendConfirmationEmail } = require('./emailService');
    const newCode = generateVerificationCode();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: newCode },
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


    // Enviar email con el nuevo código (no bloquear la respuesta)
    sendConfirmationEmail(updatedUser.email, updatedUser.name, newCode).catch(err => {
      console.error('Error enviando código de verificación:', err);
    });

    return updatedUser;
  }

  async resendVerificationCodeById(id) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }


    const { generateVerificationCode, sendConfirmationEmail } = require('./emailService');
    const newCode = generateVerificationCode();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { verificationCode: newCode },
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


    sendConfirmationEmail(updatedUser.email, updatedUser.name, newCode).catch(err => {
      console.error('Error enviando código de verificación:', err);
    });

    return updatedUser;
  }

  async confirmVerificationById(id, verificationCode) {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.verificationCode || user.verificationCode !== verificationCode) {
      throw new Error('Código de verificación inválido');
    }

    // Actualizar status a Verified y limpiar el código
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'Verified',
        verificationCode: null
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
    // Enviar correo de bienvenida (no bloquear la respuesta)
    const { sendWelcomeEmail } = require('./emailService');
    sendWelcomeEmail(updatedUser.email, updatedUser.name).catch(err => {
      console.error('Error enviando correo de bienvenida:', err);
    });

    // Build user object without password and return token as in login
    const userWithoutPassword = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      verificationCode: updatedUser.verificationCode,
      creation_date: updatedUser.creation_date
    };

    const token = JWTUtils.generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  }

  async getStatusById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true }
    });
    if (!user) return null;
    return { id: user.id, status: user.status };
  }

  async updatePushToken(userId, pushToken) {
    try {
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { pushToken },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          pushToken: true,
          creation_date: true
        }
      });

      console.log(`✅ Push token actualizado para usuario ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error actualizando push token:', error);
      throw error;
    }
  }

  async clearPushToken(userId) {
    try {
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { pushToken: "" }, // Limpiar el token
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          pushToken: true,
          creation_date: true
        }
      });

      console.log(`✅ Push token limpiado para usuario ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error('❌ Error limpiando push token:', error);
      throw error;
    }
  }

  // Mark user as Verified and send notification (best-effort)
  async markUserVerifiedAndNotify(userId) {
    if (!userId) return null;
    try {
      // Check current status first to make this operation idempotent
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true, email: true, name: true } });
      if (!existing) return null;
      if (existing.status === 'Verified') return existing;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: 'Verified' },
        select: { id: true, email: true, name: true, status: true }
      });

      if (updatedUser && updatedUser.email) {
        try {
          await sendOwnerVerifiedEmail(updatedUser.email, updatedUser.name || '');
        } catch (emailErr) {
          console.error('UserService.markUserVerifiedAndNotify - email error:', emailErr);
        }
      }

      return updatedUser;
    } catch (err) {
      console.error('UserService.markUserVerifiedAndNotify error:', err);
      return null;
    }
  }
}

module.exports = { UserService };
