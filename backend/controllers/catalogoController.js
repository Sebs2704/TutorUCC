const Materia      = require('../models/Materia');
const HorarioTutor = require('../models/HorarioTutor');

const ORDEN_SEMESTRES = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

// @route  GET /api/catalogo/semestres
// @access Privado
const getSemestres = async (req, res) => {
    try {
        const semestres = await Materia.distinct('semestre', { activo: true });
        semestres.sort((a, b) => ORDEN_SEMESTRES.indexOf(a) - ORDEN_SEMESTRES.indexOf(b));
        res.json({ semestres });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/catalogo/materias?semestre=X
// @access Privado
const getMaterias = async (req, res) => {
    try {
        const { semestre } = req.query;
        if (!semestre) return res.status(400).json({ mensaje: 'Parámetro semestre requerido' });
        const materias = await Materia.find({ semestre, activo: true }).sort({ nombre: 1 });
        res.json({ materias });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/catalogo/tutores/:id
// @access Privado
const getTutores = async (req, res) => {
    try {
        const horarios = await HorarioTutor
            .find({ materia: req.params.id, activo: true })
            .populate('tutor', 'nombre');   // join a usuarios

        const tutores = horarios.map(h => ({
            tutorId:        h.tutor._id,
            horarioTutorId: h._id,
            nombre:         h.tutor.nombre,
            horario:        h.horario,
            aula:           h.aula,
        }));

        res.json({ tutores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { getSemestres, getMaterias, getTutores };
