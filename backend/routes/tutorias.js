const express = require('express');
const router  = express.Router();
const { disponibilidad, agendar, misTutorias, tutorTutorias, cancelar, confirmar, cancelarTutor, finalizar } = require('../controllers/tutoriaController');
const { proteger } = require('../middlewares/auth');
const { esTutor }  = require('../middlewares/esTutor');

router.get('/disponibilidad',         proteger, disponibilidad);
router.post('/',                      proteger, agendar);
router.get('/mis-tutorias',           proteger, misTutorias);
router.get('/mis-tutorias-tutor',     esTutor,  tutorTutorias);
router.patch('/:id/cancelar',         proteger, cancelar);
router.patch('/:id/confirmar',        esTutor,  confirmar);
router.patch('/:id/cancelar-tutor',   esTutor,  cancelarTutor);
router.patch('/:id/finalizar',        esTutor,  finalizar);

module.exports = router;
