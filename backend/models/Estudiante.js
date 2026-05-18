const mongoose = require('mongoose');

const EstudianteSchema = new mongoose.Schema({
    nombre: {
        type:     String,
        required: true,
        trim:     true,
    },
    correo: {
        type:      String,
        required:  true,
        unique:    true,
        lowercase: true,
        trim:      true,
    },
    codigo: {
        type:      String,
        required:  true,
        unique:    true,
        trim:      true,
        match:     [/^\d{6}$/, 'El código debe ser de exactamente 6 dígitos numéricos'],
    },
    activo: {
        type:    Boolean,
        default: true,
    },
    creadoEn: {
        type:    Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Estudiante', EstudianteSchema);
