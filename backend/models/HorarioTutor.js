const mongoose = require('mongoose');

const horarioTutorSchema = new mongoose.Schema({
    tutor: {
        id:     { type: String, required: true },
        nombre: { type: String, required: true },
        correo: { type: String, required: true },
    },
    materia: {
        id:       { type: String, required: true },
        nombre:   { type: String, required: true },
        semestre: { type: String, required: true },
    },
    horario: { type: String, required: true, trim: true },
    aula:    { type: String, required: true, trim: true },
    activo:  { type: Boolean, default: true },
});

horarioTutorSchema.index({ 'materia.id': 1, activo: 1 });
horarioTutorSchema.index({ 'tutor.id':   1, activo: 1 });

module.exports = mongoose.model('HorarioTutor', horarioTutorSchema);
