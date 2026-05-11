const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    correo: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: process.env.ALLOW_ANY_EMAIL === 'true'
            ? [/^[\w.-]+@[\w.-]+\.\w+$/, 'Correo inválido']
            : [/^[\w.-]+@campusucc\.edu\.co$/, 'Solo se permiten correos institucionales (@campusucc.edu.co)'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false // No se devuelve en consultas por defecto
    },
    rol: {
        type: String,
        enum: ['estudiante', 'tutor', 'admin'],
        default: 'estudiante'
    },
    activo: {
        type: Boolean,
        default: true
    },
    resetToken: {
        type: String,
        select: false
    },
    resetTokenExpira: {
        type: Date,
        select: false
    },
    creadoEn: {
        type: Date,
        default: Date.now
    }
});

// Encriptar contraseña antes de guardar
UsuarioSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
UsuarioSchema.methods.compararPassword = async function (passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);
