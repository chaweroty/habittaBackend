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
  generateVerificationCode,
  // También exportar como EmailService para compatibilidad
  EmailService: {
    sendWelcomeEmail,
    sendConfirmationEmail,
    sendOwnerVerifiedEmail,
    sendPasswordResetEmail,
    generateVerificationCode
  }
};