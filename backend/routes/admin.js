const express    = require('express');
const router     = express.Router();
const { esAdmin} = require('../middlewares/esAdmin');
const ctrl       = require('../controllers/adminController');

router.use(esAdmin);

// Estadísticas generales
router.get('/stats', ctrl.getStats);

// Estudiantes
router.get   ('/estudiantes',      ctrl.getEstudiantes);
router.post  ('/estudiantes',      ctrl.crearEstudiante);
router.put   ('/estudiantes/:id',  ctrl.actualizarEstudiante);
router.delete('/estudiantes/:id',  ctrl.eliminarEstudiante);

// Docentes
router.get   ('/docentes',      ctrl.getDocentes);
router.post  ('/docentes',      ctrl.crearDocente);
router.put   ('/docentes/:id',  ctrl.actualizarDocente);
router.delete('/docentes/:id',  ctrl.eliminarDocente);

// Materias
router.get   ('/materias',      ctrl.getMaterias);
router.post  ('/materias',      ctrl.crearMateria);
router.put   ('/materias/:id',  ctrl.actualizarMateria);
router.delete('/materias/:id',  ctrl.eliminarMateria);

// Horarios de tutores
router.get   ('/horarios',      ctrl.getHorarios);
router.post  ('/horarios',      ctrl.crearHorario);
router.put   ('/horarios/:id',  ctrl.actualizarHorario);
router.delete('/horarios/:id',  ctrl.eliminarHorario);

// Tutorías (solo lectura + eliminación)
router.get   ('/tutorias',      ctrl.getTutorias);
router.delete('/tutorias/:id',  ctrl.eliminarTutoria);

module.exports = router;
