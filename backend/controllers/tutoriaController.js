const mongoose = require('mongoose');
const Tutoria  = require('../models/Tutoria');
const nodemailer = require('nodemailer');

/* ─────────────────────────────────────────────────────────────────
   CORREO
───────────────────────────────────────────────────────────────── */
const _transporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const _enviarCorreo = async ({ nombreEstudiante, correoEstudiante, nombreMateria, nombreTutor, horario, aula, semestre, comentario }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
    try {
        await _transporter().sendMail({
            from: `"TutorUCC" <${process.env.EMAIL_USER}>`,
            to:   correoEstudiante,
            subject: '✅ Solicitud de tutoría recibida — TutorUCC',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                    <div style="background:#0d8f95;padding:24px;text-align:center;">
                        <h2 style="color:#fff;margin:0;">TutorUCC</h2>
                        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;">Universidad Cooperativa de Colombia</p>
                    </div>
                    <div style="padding:28px 32px;">
                        <p style="font-size:1rem;color:#374151;">Hola <strong>${nombreEstudiante}</strong>,</p>
                        <p style="color:#374151;">Tu solicitud de tutoría ha sido recibida exitosamente.</p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;width:40%;">Materia</td><td style="padding:10px 12px;color:#4b5563;">${nombreMateria}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Tutor</td><td style="padding:10px 12px;color:#4b5563;">${nombreTutor}</td></tr>
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Horario</td><td style="padding:10px 12px;color:#4b5563;">${horario}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Aula</td><td style="padding:10px 12px;color:#4b5563;">${aula}</td></tr>
                            <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Semestre</td><td style="padding:10px 12px;color:#4b5563;">${semestre}</td></tr>
                            <tr><td style="padding:10px 12px;font-weight:600;color:#374151;">Estado</td><td style="padding:10px 12px;"><span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:999px;font-size:0.85rem;font-weight:600;">Pendiente</span></td></tr>
                            ${comentario ? `<tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;color:#374151;">Comentario</td><td style="padding:10px 12px;color:#4b5563;">${comentario}</td></tr>` : ''}
                        </table>
                        <p style="color:#6b7280;font-size:0.9rem;">El tutor confirmará la sesión próximamente.</p>
                    </div>
                    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                        <p style="color:#9ca3af;font-size:0.8rem;margin:0;">© 2026 TutorUCC · Universidad Cooperativa de Colombia</p>
                    </div>
                </div>`
        });
    } catch (err) {
        console.error('Error enviando correo:', err.message);
    }
};

/* ─────────────────────────────────────────────────────────────────
   HELPERS DE FECHA
───────────────────────────────────────────────────────────────── */
const _DIAS = { 'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6,'Domingo':0 };

const _diaJSDeHorario = (horario) => {
    for (const [nombre, num] of Object.entries(_DIAS)) {
        if (horario.startsWith(nombre)) return num;
    }
    return -1;
};

// Próxima fecha donde hoy sigue siendo válido
const _fechaParaAgendar = (horario) => {
    const diaJS = _diaJSDeHorario(horario);
    if (diaJS === -1) return null;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    let diff = diaJS - hoy.getDay();
    if (diff < 0) diff += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diff);
    return fecha;
};

// Siempre la semana siguiente (reasignación)
const _proximaFechaHorario = (horario) => {
    const diaJS = _diaJSDeHorario(horario);
    if (diaJS === -1) return null;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    let diff = diaJS - hoy.getDay();
    if (diff <= 0) diff += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diff);
    return fecha;
};

/* ─────────────────────────────────────────────────────────────────
   CUPOS
───────────────────────────────────────────────────────────────── */
const MAXIMO_ESTUDIANTES = 20;

const _contarOcupados = async (tutorId, horario, fecha) => {
    const inicio = new Date(fecha); inicio.setHours(0,0,0,0);
    const fin    = new Date(fecha); fin.setHours(23,59,59,999);
    return Tutoria.countDocuments({
        tutor:        tutorId,   // ObjectId
        horario,
        fechaTutoria: { $gte: inicio, $lte: fin },
        estado:       { $in: ['pendiente','confirmada'] }
    });
};

/* ─────────────────────────────────────────────────────────────────
   HELPER: aplanar resultado populate para el frontend
   El frontend espera t.tutor (string) y t.materia (string)
───────────────────────────────────────────────────────────────── */
const _aplanar = (t) => ({
    ...t,
    tutor:   t.tutor?.nombre   ?? t.tutor,
    materia: t.materia?.nombre ?? t.materia,
});

/* ═══════════════════════════════════════════════════════════════════
   ENDPOINTS
═══════════════════════════════════════════════════════════════════ */

// @route  GET /api/tutorias/disponibilidad?tutorId=&horario=
// @access Privado
const disponibilidad = async (req, res) => {
    try {
        const { tutorId, horario } = req.query;
        if (!tutorId || !horario)
            return res.status(400).json({ mensaje: 'Parámetros requeridos: tutorId, horario' });
        if (!mongoose.Types.ObjectId.isValid(tutorId))
            return res.status(400).json({ mensaje: 'tutorId inválido' });

        const fechaTutoria = _fechaParaAgendar(horario);
        if (!fechaTutoria)
            return res.status(400).json({ mensaje: 'Horario no reconocido' });

        const ocupados     = await _contarOcupados(tutorId, horario, fechaTutoria);
        const proximaFecha = new Date(fechaTutoria);
        proximaFecha.setDate(proximaFecha.getDate() + 7);

        res.json({
            ocupados,
            maximo:     MAXIMO_ESTUDIANTES,
            disponible: ocupados < MAXIMO_ESTUDIANTES,
            fechaTutoria,
            proximaFecha,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  POST /api/tutorias
// @access Privado (estudiante)
const agendar = async (req, res) => {
    try {
        const { materiaId, semestre, tutorId, horario, aula,
                comentario, fechaTutoriaOverride, horarioTutorId } = req.body;

        if (!materiaId || !semestre || !tutorId || !horario || !aula)
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });

        if (!mongoose.Types.ObjectId.isValid(tutorId) || !mongoose.Types.ObjectId.isValid(materiaId))
            return res.status(400).json({ mensaje: 'IDs inválidos' });

        const Usuario = require('../models/Usuario');
        const Materia = require('../models/Materia');

        const [estudiante, tutorDoc, materiaDoc] = await Promise.all([
            Usuario.findById(req.usuarioId),
            Usuario.findById(tutorId),
            Materia.findById(materiaId),
        ]);

        if (!estudiante) return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
        if (!tutorDoc)   return res.status(404).json({ mensaje: 'Tutor no encontrado' });
        if (!materiaDoc) return res.status(404).json({ mensaje: 'Materia no encontrada' });

        let fechaTutoria;
        if (fechaTutoriaOverride) {
            fechaTutoria = new Date(fechaTutoriaOverride);
            if (isNaN(fechaTutoria)) return res.status(400).json({ mensaje: 'Fecha inválida' });
        } else {
            fechaTutoria = _fechaParaAgendar(horario);
        }

        if (fechaTutoria) {
            const ocupados = await _contarOcupados(tutorId, horario, fechaTutoria);
            if (ocupados >= MAXIMO_ESTUDIANTES) {
                const proximaFecha = new Date(fechaTutoria);
                proximaFecha.setDate(proximaFecha.getDate() + 7);
                return res.status(409).json({
                    mensaje: 'Este horario ya está lleno para esa fecha.',
                    ocupados, maximo: MAXIMO_ESTUDIANTES, proximaFecha,
                });
            }
        }

        const tutoria = await Tutoria.create({
            estudiante:       estudiante._id,
            tutor:            tutorDoc._id,
            materia:          materiaDoc._id,
            horarioTutor:     horarioTutorId || null,
            nombreEstudiante: estudiante.nombre,
            correoEstudiante: estudiante.correo,
            semestre,
            horario,
            aula,
            comentario: comentario || '',
            fechaTutoria,
            estado: 'pendiente',
        });

        // Correo (sin await — no bloquea la respuesta)
        _enviarCorreo({
            nombreEstudiante: estudiante.nombre,
            correoEstudiante: estudiante.correo,
            nombreMateria:    materiaDoc.nombre,
            nombreTutor:      tutorDoc.nombre,
            horario, aula, semestre,
            comentario: comentario || '',
        });

        // Notificación al tutor (directo con su ObjectId)
        try {
            const Notificacion = require('../models/Notificacion');
            await Notificacion.create({
                destinatario: tutorDoc._id,
                tipo:    'nueva_tutoria',
                tutoria: tutoria._id,
                mensaje: `Nueva solicitud de ${estudiante.nombre}: ${materiaDoc.nombre} (${horario}).`,
            });
        } catch (_) { /* notificación opcional */ }

        res.status(201).json({ mensaje: 'Tutoría agendada correctamente', tutoria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/tutorias/mis-tutorias
// @access Privado (estudiante)
const misTutorias = async (req, res) => {
    try {
        const tutorias = await Tutoria
            .find({ estudiante: req.usuarioId })
            .populate('tutor',   'nombre')
            .populate('materia', 'nombre semestre')
            .sort({ creadoEn: -1 })
            .lean();

        res.json({ tutorias: tutorias.map(_aplanar) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/tutorias/mis-tutorias-tutor
// @access Privado (tutor)
const tutorTutorias = async (req, res) => {
    try {
        const tutorias = await Tutoria
            .find({ tutor: req.usuarioId })
            .populate('estudiante', 'nombre correo')
            .populate('materia',    'nombre semestre')
            .sort({ creadoEn: -1 })
            .lean();

        // El frontend usa t.nombreEstudiante, t.correoEstudiante (desnormalizado)
        // y t.materia como string — lo aplanamos
        const result = tutorias.map(t => ({
            ...t,
            materia:          t.materia?.nombre   ?? t.materia,
            nombreEstudiante: t.nombreEstudiante  || t.estudiante?.nombre || '',
            correoEstudiante: t.correoEstudiante  || t.estudiante?.correo || '',
        }));

        res.json({ tutorias: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/tutorias/:id/cancelar
// @access Privado (estudiante)
const cancelar = async (req, res) => {
    try {
        const tutoria = await Tutoria.findOne({ _id: req.params.id, estudiante: req.usuarioId });
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        if (tutoria.estado === 'finalizada')
            return res.status(400).json({ mensaje: 'No puedes cancelar una tutoría finalizada' });

        tutoria.estado = 'cancelada';
        await tutoria.save();
        res.json({ mensaje: 'Tutoría cancelada', tutoria });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/tutorias/:id/confirmar
// @access Privado (tutor)
const confirmar = async (req, res) => {
    try {
        const tutoria = await Tutoria
            .findOne({ _id: req.params.id, tutor: req.usuarioId })
            .populate('materia', 'nombre');
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        if (tutoria.estado !== 'pendiente')
            return res.status(400).json({ mensaje: 'Solo se pueden confirmar tutorías pendientes' });

        tutoria.estado = 'confirmada';
        await tutoria.save();

        const Notificacion = require('../models/Notificacion');
        const Usuario = require('../models/Usuario');
        const tutorDoc = await Usuario.findById(req.usuarioId).select('nombre');

        await Notificacion.create({
            destinatario: tutoria.estudiante,
            tipo:    'confirmacion',
            tutoria: tutoria._id,
            mensaje: `Tu tutoría de ${tutoria.materia?.nombre ?? tutoria.materia} con ${tutorDoc?.nombre} (${tutoria.horario}) ha sido confirmada. ✅`,
        });

        res.json({ mensaje: 'Tutoría confirmada', tutoria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/tutorias/:id/cancelar-tutor
// @access Privado (tutor)
const cancelarTutor = async (req, res) => {
    try {
        const { motivo } = req.body;
        if (!motivo?.trim()) return res.status(400).json({ mensaje: 'El motivo de cancelación es obligatorio' });

        const tutoria = await Tutoria
            .findOne({ _id: req.params.id, tutor: req.usuarioId })
            .populate('materia', 'nombre');
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        if (tutoria.estado === 'finalizada' || tutoria.estado === 'cancelada')
            return res.status(400).json({ mensaje: 'Esta tutoría no puede ser cancelada' });

        const nombreMateria = tutoria.materia?.nombre ?? String(tutoria.materia);
        const Usuario = require('../models/Usuario');
        const tutorDoc = await Usuario.findById(req.usuarioId).select('nombre');

        tutoria.estado = 'cancelada';
        tutoria.motivoCancelacion = motivo.trim();
        await tutoria.save();

        // Reasignación automática a la próxima semana
        const proximaFecha = _proximaFechaHorario(tutoria.horario);
        let nuevaTutoria = null;

        if (proximaFecha) {
            nuevaTutoria = await Tutoria.create({
                estudiante:       tutoria.estudiante,
                tutor:            tutoria.tutor,
                materia:          tutoria.materia._id ?? tutoria.materia,
                horarioTutor:     tutoria.horarioTutor,
                nombreEstudiante: tutoria.nombreEstudiante,
                correoEstudiante: tutoria.correoEstudiante,
                semestre:         tutoria.semestre,
                horario:          tutoria.horario,
                aula:             tutoria.aula,
                comentario:       tutoria.comentario,
                fechaTutoria:     proximaFecha,
                estado:           'pendiente',
                reasignadaDe:     tutoria._id,
            });
        }

        const Notificacion = require('../models/Notificacion');

        await Notificacion.create({
            destinatario: tutoria.estudiante,
            tipo:    'cancelacion_tutor',
            tutoria: tutoria._id,
            mensaje: `Tu tutoría de ${nombreMateria} fue cancelada por el tutor. Motivo: "${motivo.trim()}".`,
        });

        if (nuevaTutoria && proximaFecha) {
            const fechaStr = proximaFecha.toLocaleDateString('es-CO', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });
            await Notificacion.create({
                destinatario: tutoria.estudiante,
                tipo:    'reasignacion',
                tutoria: nuevaTutoria._id,
                mensaje: `Tu tutoría de ${nombreMateria} fue reasignada para el ${fechaStr} con ${tutorDoc?.nombre}.`,
            });
        }

        res.json({ mensaje: 'Tutoría cancelada y reasignada', tutoria, nuevaTutoria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/tutorias/:id/finalizar
// @access Privado (tutor)
const finalizar = async (req, res) => {
    try {
        const tutoria = await Tutoria.findOne({ _id: req.params.id, tutor: req.usuarioId });
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        if (tutoria.estado !== 'confirmada')
            return res.status(400).json({ mensaje: 'Solo se pueden finalizar tutorías confirmadas' });

        tutoria.estado = 'finalizada';
        await tutoria.save();
        res.json({ mensaje: 'Tutoría finalizada', tutoria });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { disponibilidad, agendar, misTutorias, tutorTutorias, cancelar, confirmar, cancelarTutor, finalizar };
