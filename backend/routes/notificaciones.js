const express = require('express');
const router  = express.Router();
const { getMias, marcarLeida, marcarTodasLeidas } = require('../controllers/notificacionController');
const { proteger } = require('../middlewares/auth');

router.get('/',                  proteger, getMias);
router.patch('/leer-todas',      proteger, marcarTodasLeidas);
router.patch('/:id/leer',        proteger, marcarLeida);

module.exports = router;
