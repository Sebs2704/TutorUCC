const mongoose = require('mongoose');

const TutoriaSchema = new mongoose.Schema({
    estudiante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    correoEstudiante: { type: String, required: true },
    nombreEstudiante: { type: String, required: true },
    materia:   { type: String, required: true },
    semestre:  { type: String, required: true },
    tutor:     { type: String, required: true },
    horario:   { type: String, required: true },
    aula:      { type: String, required: true },
    comentario:{ type: String, default: '' },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'finalizada', 'cancelada'],
        default: 'pendiente'
    },
    creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tutoria', TutoriaSchema);
