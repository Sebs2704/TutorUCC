const express = require('express');
const router  = express.Router();
const { agendar, misTutorias, cancelar } = require('../controllers/tutoriaController');
const { proteger } = require('../middlewares/auth');

router.post('/',                  proteger, agendar);
router.get('/mis-tutorias',       proteger, misTutorias);
router.patch('/:id/cancelar',     proteger, cancelar);

module.exports = router;
