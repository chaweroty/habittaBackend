const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../utils/nodemailer.js');

// En CommonJS ya tenemos __dirname disponible

/**
 * Función utilitaria para cargar y procesar templates HTML
 * @param {string} templateName - Nombre del archivo template
 * @param {object} variables - Variables a reemplazar en el template
 * @returns {string} - HTML procesado
 */
const loadAndProcessTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '../scripts', templateName);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Reemplazar variables en el template
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    return htmlContent;
  } catch (error) {
    console.error(`❌ Error cargando template ${templateName}:`, error);
    throw new Error(`No se pudo cargar el template ${templateName}`);
  }
};

/**
 * Envía correo de bienvenida a nuevos usuarios
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 */
const sendWelcomeEmail = async (email, nombre) => {
  try {
    const htmlContent = loadAndProcessTemplate('userwelcome.html', {
      nombre
    });
    
    await sendEmail(
      email,
      '¡Bienvenido a Habitta! 🏠',
      htmlContent
    );
    
    console.log(`✅ Correo de bienvenida enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando correo de bienvenida:', error);
    throw error;
  }
};

/**
 * Envía correo con código de confirmación para verificar cuenta
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 * @param {string} codigo - Código de confirmación de 6 dígitos
 */
const sendConfirmationEmail = async (email, nombre, codigo) => {
  try {
    const htmlContent = loadAndProcessTemplate('userconfirmation.html', {
      nombre,
      codigo
    });
    
    await sendEmail(
      email,
      'Código de Confirmación - Habitta',
      htmlContent
    );
    
    console.log(`✅ Código de confirmación enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando código de confirmación:', error);
    throw error;
  }
};

/**
 * Envía correo de notificación de propietario verificado
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 */
const sendOwnerVerifiedEmail = async (email, nombre) => {
  try {
    const htmlContent = loadAndProcessTemplate('ownerverified.html', {
      nombre
    });
    
    await sendEmail(
      email,
      '¡Verificación Aprobada! Ya puedes publicar propiedades - Habitta',
      htmlContent
    );
    
    console.log(`✅ Notificación de propietario verificado enviada a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando notificación de propietario verificado:', error);
    throw error;
  }
};

/**
 * Envía correo con código para restablecer contraseña
 * @param {string} email - Email del destinatario
 * @param {string} nombre - Nombre del usuario
 * @param {string} codigo - Código de restablecimiento de 6 dígitos
 */
const sendPasswordResetEmail = async (email, nombre, codigo) => {
  try {
    const htmlContent = loadAndProcessTemplate('passwordreset.html', {
      nombre,
      codigo
    });
    
    await sendEmail(
      email,
      'Restablecer Contraseña - Habitta',
      htmlContent
    );
    
    console.log(`✅ Código de restablecimiento de contraseña enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error enviando código de restablecimiento:', error);
    throw error;
  }
};

/**
 * Envía correo de confirmación de pago al pagador
 * @param {string} email - Email del pagador
 * @param {object} paymentData - Datos del pago
 * @param {string} paymentData.nombre_pagador - Nombre del pagador
 * @param {string} paymentData.concepto - Concepto del pago
 * @param {number} paymentData.monto - Monto del pago
 * @param {string} paymentData.moneda - Moneda (ej: COP)
 * @param {string} paymentData.fecha_pago - Fecha del pago
 * @param {string} paymentData.referencia - Código de referencia
 * @param {string} [paymentData.titulo_propiedad] - Título de la propiedad (opcional)
 * @param {boolean} [paymentData.es_alquiler] - Si es pago de alquiler (opcional)
 */
const sendPaymentConfirmationToSender = async (email, paymentData) => {
  try {
    const variables = {
      nombre_pagador: paymentData.nombre_pagador,
      concepto: paymentData.concepto,
      monto: paymentData.monto.toLocaleString('es-CO'),
      moneda: paymentData.moneda,
      fecha_pago: paymentData.fecha_pago,
      referencia: paymentData.referencia,
      titulo_propiedad: paymentData.titulo_propiedad || '',
      es_alquiler: paymentData.es_alquiler ? 'block' : 'none'
    };

    const htmlContent = loadAndProcessTemplate('payment_sender.html', variables);

    await sendEmail(
      email,
      'Confirmación de Pago - Habitta',
      htmlContent
    );

    console.log(`✅ Confirmación de pago enviada al pagador ${email}`);
  } catch (error) {
    console.error('❌ Error enviando confirmación de pago al pagador:', error);
    throw error;
  }
};

/**
 * Envía correo de confirmación de pago al receptor
 * @param {string} email - Email del receptor
 * @param {object} paymentData - Datos del pago
 * @param {string} paymentData.nombre_receptor - Nombre del receptor
 * @param {string} paymentData.nombre_pagador - Nombre del pagador
 * @param {string} paymentData.concepto - Concepto del pago
 * @param {number} paymentData.monto - Monto del pago
 * @param {string} paymentData.moneda - Moneda (ej: COP)
 * @param {string} paymentData.fecha_pago - Fecha del pago
 * @param {string} paymentData.referencia - Código de referencia
 * @param {string} [paymentData.titulo_propiedad] - Título de la propiedad (opcional)
 * @param {boolean} [paymentData.es_alquiler] - Si es pago de alquiler (opcional)
 */
const sendPaymentConfirmationToReceiver = async (email, paymentData) => {
  try {
    const variables = {
      nombre_receptor: paymentData.nombre_receptor,
      nombre_pagador: paymentData.nombre_pagador,
      concepto: paymentData.concepto,
      monto: paymentData.monto.toLocaleString('es-CO'),
      moneda: paymentData.moneda,
      fecha_pago: paymentData.fecha_pago,
      referencia: paymentData.referencia,
      titulo_propiedad: paymentData.titulo_propiedad || '',
      es_alquiler: paymentData.es_alquiler ? 'block' : 'none'
    };

    const htmlContent = loadAndProcessTemplate('payment_receiver.html', variables);

    await sendEmail(
      email,
      'Pago Recibido - Habitta',
      htmlContent
    );

    console.log(`✅ Confirmación de pago recibido enviada al receptor ${email}`);
  } catch (error) {
    console.error('❌ Error enviando confirmación de pago al receptor:', error);
    throw error;
  }
};

/**
 * Función utilitaria para generar códigos de verificación
 * @param {number} length - Longitud del código (por defecto 6)
 * @returns {string} - Código generado
 */
const generateVerificationCode = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

// Exportar todas las funciones usando CommonJS
module.exports = {
  sendWelcomeEmail,
  sendConfirmationEmail,
  sendOwnerVerifiedEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationToSender,
  sendPaymentConfirmationToReceiver,
  generateVerificationCode,
  // También exportar como EmailService para compatibilidad
  EmailService: {
    sendWelcomeEmail,
    sendConfirmationEmail,
    sendOwnerVerifiedEmail,
    sendPasswordResetEmail,
    sendPaymentConfirmationToSender,
    sendPaymentConfirmationToReceiver,
    generateVerificationCode
  }
};