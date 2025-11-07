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

// ==================== NOTIFICACIONES DE ESTADOS DE APPLICATION ====================

/**
 * Envía notificación cuando se requieren documentos adicionales (a renter)
 * @param {string} renterPushToken - Token de push del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendDocumentsRequiredNotification = async (renterPushToken, propertyTitle) => {
  try {
    await sendPushNotification(
      renterPushToken,
      'Documentos requeridos 📄',
      `Se necesitan documentos adicionales para tu solicitud de "${propertyTitle}".`,
      {
        type: 'user_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de documentos requeridos enviada al solicitante`);
  } catch (error) {
    console.error('❌ Error enviando notificación de documentos requeridos:', error);
  }
};

/**
 * Envía notificación cuando una aplicación es pre-aprobada (a renter)
 * @param {string} renterPushToken - Token de push del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendPreApprovedNotification = async (renterPushToken, propertyTitle) => {
  try {
    await sendPushNotification(
      renterPushToken,
      '¡Pre-aprobación! 🎯',
      `Tu solicitud para "${propertyTitle}" ha sido pre-aprobada. Confirma para continuar.`,
      {
        type: 'user_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de pre-aprobación enviada al solicitante`);
  } catch (error) {
    console.error('❌ Error enviando notificación de pre-aprobación:', error);
  }
};

/**
 * Envía notificación cuando el renter confirma y la aplicación pasa a 'approved' (a owner)
 * @param {string} ownerPushToken - Token de push del propietario
 * @param {string} renterName - Nombre del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendApplicationConfirmedByRenterNotification = async (ownerPushToken, renterName, propertyTitle) => {
  try {
    await sendPushNotification(
      ownerPushToken,
      'Solicitud confirmada ✅',
      `${renterName} ha confirmado su interés en "${propertyTitle}". Puedes proceder con el contrato.`,
      {
        type: 'owner_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de confirmación enviada al propietario`);
  } catch (error) {
    console.error('❌ Error enviando notificación de confirmación:', error);
  }
};

/**
 * Envía notificación cuando el contrato es firmado (a la contraparte)
 * @param {string} pushToken - Token de push del destinatario
 * @param {string} recipientName - Nombre del destinatario
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendContractSignedNotification = async (pushToken, recipientName, propertyTitle, typeNotification) => {
  try {
    await sendPushNotification(
      pushToken,
      'Contrato firmado 📑',
      `${recipientName}, el contrato para "${propertyTitle}" ha sido firmado exitosamente.`,
      {
        type: typeNotification,
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de contrato firmado enviada`);
  } catch (error) {
    console.error('❌ Error enviando notificación de contrato firmado:', error);
  }
};

/**
 * Envía notificación cuando el renter retira su solicitud (a owner)
 * @param {string} ownerPushToken - Token de push del propietario
 * @param {string} renterName - Nombre del solicitante
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendApplicationWithdrawnNotification = async (ownerPushToken, renterName, propertyTitle) => {
  try {
    await sendPushNotification(
      ownerPushToken,
      'Solicitud retirada 🚫',
      `${renterName} ha retirado su solicitud para "${propertyTitle}".`,
      {
        type: 'owner_notification',
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de retiro enviada al propietario`);
  } catch (error) {
    console.error('❌ Error enviando notificación de retiro:', error);
  }
};

/**
 * Envía notificación cuando el contrato/aplicación termina (a la contraparte)
 * @param {string} pushToken - Token de push del destinatario
 * @param {string} propertyTitle - Título de la propiedad
 */
const sendApplicationTerminatedNotification = async (pushToken, propertyTitle, typeNotification) => {
  try {
    await sendPushNotification(
      pushToken,
      'Contrato finalizado 🏁',
      `El contrato para "${propertyTitle}" ha finalizado.`,
      {
        type: typeNotification,
        action: 'view_applications',
        propertyTitle
      }
    );
    console.log(`📱 Notificación de finalización enviada`);
  } catch (error) {
    console.error('❌ Error enviando notificación de finalización:', error);
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
  // Nuevas notificaciones de estados de Application
  sendDocumentsRequiredNotification,
  sendPreApprovedNotification,
  sendApplicationConfirmedByRenterNotification,
  sendContractSignedNotification,
  sendApplicationWithdrawnNotification,
  sendApplicationTerminatedNotification,
  // También exportar como PushNotificationService para compatibilidad
  PushNotificationService: {
    sendWelcomeNotification,
    sendAccountVerifiedNotification,
    sendOwnerApprovedNotification,
    sendNewApplicationNotification,
    sendApplicationApprovedNotification,
    sendApplicationRejectedNotification,
    sendBroadcastNotification,
    sendDocumentsRequiredNotification,
    sendPreApprovedNotification,
    sendApplicationConfirmedByRenterNotification,
    sendContractSignedNotification,
    sendApplicationWithdrawnNotification,
    sendApplicationTerminatedNotification
  }
};