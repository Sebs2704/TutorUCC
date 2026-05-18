const mongoose = require('mongoose');

const TutoriaSchema = new mongoose.Schema({
    // ── IDs de referencia (String, sin relación estructural) ──────
    estudiante:   { type: String, required: true },
    tutor:        { type: String, required: true },
    materia:      { type: String, required: true },
    horarioTutor: { type: String, default: null  },
    reasignadaDe: { type: String, default: null  },

    // ── Datos embebidos para display rápido y correos ─────────────
    nombreEstudiante: { type: String, required: true },
    correoEstudiante: { type: String, required: true },
    nombreTutor:      { type: String, required: true },
    nombreMateria:    { type: String, required: true },
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
