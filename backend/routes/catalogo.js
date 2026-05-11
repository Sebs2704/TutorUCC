const express = require('express');
const router  = express.Router();
const { getSemestres, getMaterias, getTutores } = require('../controllers/catalogoController');
const { proteger } = require('../middlewares/auth');

router.get('/semestres',      proteger, getSemestres);
router.get('/materias',       proteger, getMaterias);
router.get('/tutores/:id',    proteger, getTutores);

module.exports = router;
