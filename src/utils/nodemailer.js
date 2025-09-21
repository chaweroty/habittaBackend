const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // tu correo de gmail
    pass: process.env.EMAIL_PASS, // la contraseña de aplicación
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Habitta" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("📧 Correo enviado a", to);
  } catch (err) {
    console.error("❌ Error enviando correo:", err);
  }
};

module.exports = { sendEmail };
