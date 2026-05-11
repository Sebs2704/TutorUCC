const express = require('express');
const router = express.Router();
const { registro, login, perfil, solicitarReset, resetPassword, cambiarPassword } = require('../controllers/authController');
const { proteger } = require('../middlewares/auth');
const { loginLimiter, registroLimiter } = require('../middlewares/rateLimiter');

// POST /api/auth/registro
router.post('/registro', registroLimiter, registro);

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// GET /api/auth/perfil
router.get('/perfil', proteger, perfil);

// POST /api/auth/recuperar — solicitar reset por correo
router.post('/recuperar', solicitarReset);

// POST /api/auth/reset/:token — aplicar nueva contraseña
router.post('/reset/:token', resetPassword);

// PATCH /api/auth/cambiar-password — cambio autenticado
router.patch('/cambiar-password', proteger, cambiarPassword);

module.exports = router;
