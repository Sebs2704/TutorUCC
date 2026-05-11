const mongoose = require('mongoose');

const DocenteSchema = new mongoose.Schema({
    usuario: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Usuario',
        required: true,
        unique:   true,
    },
    nombre: {
        type:     String,
        required: true,
        trim:     true,
    },
    correo: {
        type:     String,
        required: true,
        unique:   true,
        lowercase: true,
        trim:     true,
    },
    departamento: {
        type:    String,
        default: 'Ingeniería de Sistemas',
        trim:    true,
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

module.exports = mongoose.model('Docente', DocenteSchema);
