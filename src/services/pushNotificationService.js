const { sendPushNotification, sendBulkPushNotifications } = require('../utils/expoPush');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

/**
 * Envía notificación de bienvenida a nuevo usuario
 * @param {string} pushToken - Token de push del usuario
 * @param {string} nombre - Nombre del usuario
 */
const sendWelcomeNotification = async (pushToken, nombre) => {
  try {
    await sendPushNotification(
      pushToken,
      '¡Bienvenido a Habitta! 🏠',
      `Hola ${nombre}, ¡gracias por unirte a nuestra comunidad!`,
      {
        type: 'user_notification',
        action: 'open_app'
      }
    );
    
    console.log(`📱 Notificación de bienvenida enviada a ${nombre}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de bienvenida:', error);
    throw error;
  }
};

/**
 * Envía notificación de verificación de cuenta completada
 * @param {string} pushToken - Token de push del usuario
 * @param {string} nombre - Nombre del usuario
 */
const sendAccountVerifiedNotification = async (pushToken, nombre) => {
  try {
    await sendPushNotification(
      pushToken,
      'Cuenta verificada ✅',
      `¡Perfecto ${nombre}! Tu cuenta ha sido verificada exitosamente.`,
      {
        type: 'user_notification',
        action: 'open_app'
      }
    );
    
    console.log(`📱 Notificación de cuenta verificada enviada a ${nombre}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de cuenta verificada:', error);
    throw error;
  }
};

/**
 * Envía notificación de aprobación como propietario
 * @param {string} pushToken - Token de push del usuario
 * @param {string} nombre - Nombre del usuario
 */
const sendOwnerApprovedNotification = async (pushToken, nombre) => {
  try {
    await sendPushNotification(
      pushToken,
      '¡Propietario verificado! 🎉',
      `${nombre}, ya puedes publicar tus propiedades en Habitta.`,
      {
        type: 'owner_notification',
        action: 'view_properties'
      }
    );
    
    console.log(`📱 Notificación de propietario aprobado enviada a ${nombre}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de propietario aprobado:', error);
    throw error;
  }
};

/**
 * Envía notificación de nueva aplicación recibida
 * @param {string} pushToken - Token de push del propietario
 * @param {string} propertyTitle - Título de la propiedad
 * @param {string} applicantName - Nombre del solicitante
 */
const sendNewApplicationNotification = async (pushToken, propertyTitle, applicantName) => {
  try {
    await sendPushNotification(
      pushToken,
      'Nueva solicitud recibida 📝',
      `${applicantName} está interesado en tu propiedad "${propertyTitle}".`,
      {
        type: 'owner_notification',
        action: 'view_applications',
        propertyTitle,
        applicantName
      }
    );
    
    console.log(`📱 Notificación de nueva aplicación enviada`);
  } catch (error) {
    console.error('❌ Error enviando notificación de nueva aplicación:', error);
    throw error;
  }
};

/**
 * Envía notificación de aplicación aprobada
 * @param {string} pushToken - Token de push del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendApplicationApprovedNotification = async (pushToken, propertyTitle) => {
  try {
    await sendPushNotification(
      pushToken,
      '¡Solicitud aprobada! 🎉',
      `Tu solicitud para "${propertyTitle}" ha sido aprobada.`,
      {
        type: 'user_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    
    console.log(`📱 Notificación de aplicación aprobada enviada`);
  } catch (error) {
    console.error('❌ Error enviando notificación de aplicación aprobada:', error);
    throw error;
  }
};

/**
 * Envía notificación de aplicación rechazada
 * @param {string} pushToken - Token de push del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendApplicationRejectedNotification = async (pushToken, propertyTitle) => {
  try {
    await sendPushNotification(
      pushToken,
      'Solicitud no aprobada 😔',
      `Tu solicitud para "${propertyTitle}" no fue aprobada esta vez.`,
      {
        type: 'user_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    
    console.log(`📱 Notificación de aplicación rechazada enviada`);
  } catch (error) {
    console.error('❌ Error enviando notificación de aplicación rechazada:', error);
    throw error;
  }
};

/**
 * Envía notificación a múltiples usuarios (broadcast)
 * @param {Array} userTokens - Array de objetos con {pushToken, nombre}
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {object} data - Datos adicionales
 */
const sendBroadcastNotification = async (userTokens, title, body, data = {}) => {
  try {
    const messages = userTokens
      .filter(user => user.pushToken) // Solo usuarios con push token
      .map(user => ({
        to: user.pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data
      }));

    if (messages.length === 0) {
      console.warn('⚠️ No hay usuarios con push tokens para broadcast');
      return [];
    }

    const tickets = await sendBulkPushNotifications(messages);
    console.log(`📱 Broadcast enviado a ${messages.length} usuarios`);
    
    return tickets;
  } catch (error) {
    console.error('❌ Error enviando broadcast:', error);
    throw error;
  }
};

// Exportar todas las funciones usando CommonJS
module.exports = {
  sendWelcomeNotification,
  sendAccountVerifiedNotification,
  sendOwnerApprovedNotification,
  sendNewApplicationNotification,
  sendApplicationApprovedNotification,
  sendApplicationRejectedNotification,
  sendBroadcastNotification,
  // También exportar como PushNotificationService para compatibilidad
  PushNotificationService: {
    sendWelcomeNotification,
    sendAccountVerifiedNotification,
    sendOwnerApprovedNotification,
    sendNewApplicationNotification,
    sendApplicationApprovedNotification,
    sendApplicationRejectedNotification,
    sendBroadcastNotification
  }
};