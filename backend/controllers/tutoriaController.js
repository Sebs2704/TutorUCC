const Tutoria  = require('../models/Tutoria');
const nodemailer = require('nodemailer');

// Configurar transporter de correo
const _transporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Enviar correo de confirmación
const _enviarCorreo = async (tutoria) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    try {
        const transporter = _transporter();
        await transporter.sendMail({
            from: `"TutorUCC" <${process.env.EMAIL_USER}>`,
            to: tutoria.correoEstudiante,
            subject: '✅ Solicitud de tutoría recibida — TutorUCC',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                    <div style="background:#0d8f95;padding:24px;text-align:center;">
                        <h2 style="color:#fff;margin:0;">TutorUCC</h2>
                        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;">Universidad Cooperativa de Colombia</p>
                    </div>
                    <div style="padding:28px 32px;">
                        <p style="font-size:1rem;color:#374151;">Hola <strong>${tutoria.nombreEstudiante}</strong>,</p>
                        <p style="color:#374151;">Tu solicitud de tutoría ha sido recibida exitosamente. Aquí están los detalles:</p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;width:40%;">Materia</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.materia}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Tutor</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.tutor}</td></tr>
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Horario</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.horario}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Aula</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.aula}</td></tr>
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Semestre</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.semestre}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Estado</td><td style="padding:10px 12px;"><span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:999px;font-size:0.85rem;font-weight:600;">Pendiente</span></td></tr>
                            ${tutoria.comentario ? `<tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Comentario</td><td style="padding:10px 12px;color:#4b5563;">${tutoria.comentario}</td></tr>` : ''}
                        </table>
                        <p style="color:#6b7280;font-size:0.9rem;">El tutor confirmará la sesión próximamente. Puedes revisar el estado en tu calendario dentro de la plataforma.</p>
                    </div>
                    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="color:#9ca3af;font-size:0.8rem;margin:0;">© 2026 TutorUCC · Universidad Cooperativa de Colombia</p>
                    </div>
                </div>
            `
        });
    } catch (err) {
        console.error('Error enviando correo:', err.message);
    }
};

// @route  POST /api/tutorias
// @desc   Agendar una tutoría
// @access Privado
const agendar = async (req, res) => {
    try {
        const { materia, semestre, tutor, horario, aula, comentario } = req.body;

        if (!materia || !semestre || !tutor || !horario || !aula) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }

        // Buscar usuario desde el token
        const Usuario = require('../models/Usuario');
        const usuario = await Usuario.findById(req.usuarioId);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const tutoria = await Tutoria.create({
            estudiante:       usuario._id,
            correoEstudiante: usuario.correo,
            nombreEstudiante: usuario.nombre,
            materia,
            semestre,
            tutor,
            horario,
            aula,
            comentario: comentario || '',
            estado: 'pendiente'
        });

        // Enviar correo (no bloquear si falla)
        _enviarCorreo(tutoria);

        res.status(201).json({
            mensaje: 'Tutoría agendada correctamente',
            tutoria
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/tutorias/mis-tutorias
// @desc   Obtener tutorías del estudiante autenticado
// @access Privado
const misTutorias = async (req, res) => {
    try {
        const tutorias = await Tutoria.find({ estudiante: req.usuarioId }).sort({ creadoEn: -1 });
        res.status(200).json({ tutorias });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/tutorias/:id/cancelar
// @desc   Cancelar una tutoría propia
// @access Privado
const cancelar = async (req, res) => {
    try {
        const tutoria = await Tutoria.findOne({ _id: req.params.id, estudiante: req.usuarioId });
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        if (tutoria.estado === 'finalizada') return res.status(400).json({ mensaje: 'No puedes cancelar una tutoría finalizada' });

        tutoria.estado = 'cancelada';
        await tutoria.save();
        res.status(200).json({ mensaje: 'Tutoría cancelada', tutoria });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { agendar, misTutorias, cancelar };
