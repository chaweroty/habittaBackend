const { Expo } = require('expo-server-sdk');

// Crear una nueva instancia de Expo SDK
const expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN, // Opcional por ahora
  useFcmV1: true // Usar la nueva versión de FCM
});

/**
 * Envía una notificación push usando Expo
 * @param {string} pushToken - Token de push del dispositivo
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {object} data - Datos adicionales (opcional)
 * @param {object} options - Opciones adicionales (opcional)
 */
const sendPushNotification = async (pushToken, title, body, data = {}, options = {}) => {
  try {
    // Verificar que el token sea válido
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`❌ Token push inválido: ${pushToken}`);
      throw new Error(`Token push inválido: ${pushToken}`);
    }

    // Configurar el mensaje
    const message = {
      to: pushToken,
      sound: options.sound || 'default',
      title: title,
      body: body,
      data: data,
      priority: options.priority || 'high',
      channelId: options.channelId || 'default',
      ...(options.badge && { badge: options.badge }),
      ...(options.ttl && { ttl: options.ttl })
    };

    // Enviar la notificación
    const ticket = await expo.sendPushNotificationsAsync([message]);
    
    console.log(`📱 Notificación push enviada a ${pushToken}`);
    console.log('📋 Ticket:', ticket);
    
    return ticket[0];
    
  } catch (error) {
    console.error('❌ Error enviando notificación push:', error);
    throw error;
  }
};

/**
 * Envía notificaciones push a múltiples dispositivos
 * @param {Array} messages - Array de mensajes con formato Expo
 */
const sendBulkPushNotifications = async (messages) => {
  try {
    // Filtrar solo tokens válidos
    const validMessages = messages.filter(message => 
      Expo.isExpoPushToken(message.to)
    );

    if (validMessages.length === 0) {
      console.warn('⚠️ No hay tokens válidos para enviar notificaciones');
      return [];
    }

    // Dividir en chunks (Expo recomienda máximo 100 por batch)
    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`📱 Chunk de ${chunk.length} notificaciones enviado`);
      } catch (error) {
        console.error('❌ Error enviando chunk de notificaciones:', error);
      }
    }

    return tickets;
    
  } catch (error) {
    console.error('❌ Error enviando notificaciones bulk:', error);
    throw error;
  }
};

/**
 * Verifica el estado de los tickets de notificaciones
 * @param {Array} tickets - Array de tickets de Expo
 */
const checkPushTicketStatus = async (tickets) => {
  try {
    const ticketIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    if (ticketIds.length === 0) {
      console.log('ℹ️ No hay tickets para verificar');
      return [];
    }

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);
        console.log(`✅ Estado de ${chunk.length} tickets verificado`);
      } catch (error) {
        console.error('❌ Error verificando estado de tickets:', error);
      }
    }

    return receipts;
    
  } catch (error) {
    console.error('❌ Error verificando tickets:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  checkPushTicketStatus
};