const mongoose = require('mongoose');

const TutoriaSchema = new mongoose.Schema({
    // ── Referencias reales (ObjectId) ──────────────────────────────
    estudiante:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',      required: true },
    tutor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',      required: true },
    materia:      { type: mongoose.Schema.Types.ObjectId, ref: 'Materia',      required: true },
    horarioTutor: { type: mongoose.Schema.Types.ObjectId, ref: 'HorarioTutor', default: null  },
    reasignadaDe: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutoria',      default: null  },

    // ── Campos desnormalizados para display rápido y correos ───────
    nombreEstudiante: { type: String, required: true },
    correoEstudiante: { type: String, required: true },
    semestre:         { type: String, required: true },
    horario:          { type: String, required: true },
    aula:             { type: String, required: true },

    // ── Datos propios de la sesión ─────────────────────────────────
    comentario:        { type: String, default: '' },
    estado:            { type: String, enum: ['pendiente','confirmada','finalizada','cancelada'], default: 'pendiente' },
    fechaTutoria:      { type: Date,   default: null },
    motivoCancelacion: { type: String, default: '' },
    creadoEn:          { type: Date,   default: Date.now },
});

// Índices para las consultas más frecuentes
TutoriaSchema.index({ tutor:      1, estado: 1 });
TutoriaSchema.index({ estudiante: 1, estado: 1 });
TutoriaSchema.index({ tutor: 1, horario: 1, fechaTutoria: 1 });

module.exports = mongoose.model('Tutoria', TutoriaSchema);
