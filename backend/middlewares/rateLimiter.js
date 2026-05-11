const rateLimit = require('express-rate-limit');

// Máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo.' },
    skipSuccessfulRequests: true,
});

// Máximo 5 registros por IP cada hora (evita spam de cuentas)
const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiadas solicitudes de registro. Intenta más tarde.' },
});

module.exports = { loginLimiter, registroLimiter };
