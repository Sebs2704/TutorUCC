const mongoose = require('mongoose');

const AdministradorSchema = new mongoose.Schema({
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
    activo: {
        type:    Boolean,
        default: true,
    },
    creadoEn: {
        type:    Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Administrador', AdministradorSchema);
