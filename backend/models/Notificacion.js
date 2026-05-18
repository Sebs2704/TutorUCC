const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
    destinatario: { type: String, required: true },
    tipo: {
        type: String,
        enum: ['confirmacion', 'cancelacion_tutor', 'reasignacion', 'nueva_tutoria'],
        required: true
    },
    tutoria: { type: String },
    mensaje:  { type: String, required: true },
    leida:    { type: Boolean, default: false },
    creadoEn: { type: Date,   default: Date.now, expires: '30d' }
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);
