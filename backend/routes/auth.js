const express = require('express');
const router = express.Router();
const { registro, login, perfil } = require('../controllers/authController');
const { proteger } = require('../middlewares/auth');

// POST /api/auth/registro
router.post('/registro', registro);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/perfil  (ruta protegida)
router.get('/perfil', proteger, perfil);

module.exports = router;
