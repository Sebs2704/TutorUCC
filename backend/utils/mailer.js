const nodemailer = require('nodemailer');

const _crearTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,   // App Password de 16 dígitos, NO la contraseña normal
    },
});

const enviarCorreo = async ({ to, subject, html }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    try {
        await _crearTransporter().sendMail({
            from: `"TutorUCC" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
    } catch (err) {
        console.error('[Mailer] Error enviando correo:', err.message);
    }
};

const plantillaBase = (titulo, cuerpo) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
  <div style="background:#0d8f95;padding:24px;text-align:center;">
    <h2 style="color:#fff;margin:0;">TutorUCC</h2>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;">Universidad Cooperativa de Colombia</p>
  </div>
  <div style="padding:28px 32px;">
    <h3 style="color:#0d8f95;margin-top:0;">${titulo}</h3>
    ${cuerpo}
  </div>
  <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:0.8rem;margin:0;">© 2026 TutorUCC · Universidad Cooperativa de Colombia</p>
  </div>
</div>`;

module.exports = { enviarCorreo, plantillaBase };
