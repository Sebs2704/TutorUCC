const Notificacion = require('../models/Notificacion');

// @route  GET /api/notificaciones
// @access Privado
const getMias = async (req, res) => {
    try {
        const notificaciones = await Notificacion.find({ destinatario: req.usuarioId })
            .sort({ creadoEn: -1 })
            .limit(50);
        res.json({ notificaciones });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/notificaciones/:id/leer
// @access Privado
const marcarLeida = async (req, res) => {
    try {
        await Notificacion.findOneAndUpdate(
            { _id: req.params.id, destinatario: req.usuarioId },
            { leida: true }
        );
        res.json({ mensaje: 'Ok' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/notificaciones/leer-todas
// @access Privado
const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.updateMany(
            { destinatario: req.usuarioId, leida: false },
            { leida: true }
        );
        res.json({ mensaje: 'Ok' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { getMias, marcarLeida, marcarTodasLeidas };
