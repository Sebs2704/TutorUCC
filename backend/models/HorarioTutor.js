const mongoose = require('mongoose');

const horarioTutorSchema = new mongoose.Schema({
    tutor:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
    horario: { type: String, required: true, trim: true },
    aula:    { type: String, required: true, trim: true },
    activo:  { type: Boolean, default: true },
});

horarioTutorSchema.index({ materia: 1, activo: 1 });
horarioTutorSchema.index({ tutor:   1, activo: 1 });

module.exports = mongoose.model('HorarioTutor', horarioTutorSchema);
