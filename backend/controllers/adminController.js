const mongoose   = require('mongoose');

// Escapa caracteres especiales de regex para evitar ReDoS con input de usuario
const _esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Usuario    = require('../models/Usuario');
const Docente    = require('../models/Docente');
const Estudiante = require('../models/Estudiante');
const Materia    = require('../models/Materia');
const HorarioTutor = require('../models/HorarioTutor');
const Tutoria    = require('../models/Tutoria');

/* ──────────────────── STATS ──────────────────── */
const getStats = async (req, res) => {
    try {
        const [totalEstudiantes, totalDocentes, totalMaterias, totalHorarios, totalTutorias, byEstado] =
            await Promise.all([
                Estudiante.countDocuments({}),
                Docente.countDocuments({}),
                Materia.countDocuments({ activo: true }),
                HorarioTutor.countDocuments({ activo: true }),
                Tutoria.countDocuments({}),
                Tutoria.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
            ]);
        const estados = {};
        byEstado.forEach(e => { estados[e._id] = e.total; });
        res.json({ totalEstudiantes, totalDocentes, totalMaterias, totalHorarios, totalTutorias, estados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/* ──────────────────── ESTUDIANTES ──────────────────── */
const getEstudiantes = async (req, res) => {
    try {
        const { nombre, codigo } = req.query;
        const filtro = {};
        if (nombre) filtro.nombre = { $regex: _esc(nombre), $options: 'i' };
        if (codigo) filtro.codigo = { $regex: _esc(codigo), $options: 'i' };
        const estudiantes = await Estudiante.find(filtro)
            .populate('usuario', 'activo')
            .sort({ nombre: 1 })
            .lean();
        res.json({ estudiantes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const crearEstudiante = async (req, res) => {
    try {
        const { nombre, correo, password, codigo } = req.body;
        if (!nombre || !correo || !password || !codigo) {
            return res.status(400).json({ mensaje: 'Nombre, correo, contraseña y código son obligatorios' });
        }
        if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({ mensaje: 'El código debe ser de exactamente 6 dígitos numéricos' });
        }
        const existeCorreo  = await Usuario.findOne({ correo });
        if (existeCorreo) return res.status(400).json({ mensaje: 'Ya existe un usuario con ese correo' });
        const existeCodigo  = await Estudiante.findOne({ codigo });
        if (existeCodigo)  return res.status(400).json({ mensaje: 'Ya existe un estudiante con ese código' });

        const usuarioDoc    = await Usuario.create({ nombre, correo, password, rol: 'estudiante' });
        const estudianteDoc = await Estudiante.create({
            usuario: usuarioDoc._id,
            nombre:  usuarioDoc.nombre,
            correo:  usuarioDoc.correo,
            codigo,
        });
        res.status(201).json({ mensaje: 'Estudiante creado correctamente', estudiante: estudianteDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarEstudiante = async (req, res) => {
    try {
        const estudianteDoc = await Estudiante.findById(req.params.id);
        if (!estudianteDoc) return res.status(404).json({ mensaje: 'Estudiante no encontrado' });

        const { nombre, correo, codigo, password } = req.body;

        if (codigo && !/^\d{6}$/.test(codigo)) {
            return res.status(400).json({ mensaje: 'El código debe ser de exactamente 6 dígitos numéricos' });
        }
        if (codigo && codigo !== estudianteDoc.codigo) {
            const existeCodigo = await Estudiante.findOne({ codigo, _id: { $ne: estudianteDoc._id } });
            if (existeCodigo) return res.status(400).json({ mensaje: 'Ese código ya está en uso' });
        }

        const usuarioDoc = await Usuario.findById(estudianteDoc.usuario).select('+password');
        if (!usuarioDoc) return res.status(404).json({ mensaje: 'Usuario asociado no encontrado' });

        if (nombre)   { usuarioDoc.nombre  = nombre;  estudianteDoc.nombre  = nombre; }
        if (correo)   { usuarioDoc.correo  = correo;  estudianteDoc.correo  = correo; }
        if (codigo)   { estudianteDoc.codigo = codigo; }
        if (password) { usuarioDoc.password = password; }

        await usuarioDoc.save();
        await estudianteDoc.save();

        res.json({ mensaje: 'Estudiante actualizado correctamente', estudiante: estudianteDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarEstudiante = async (req, res) => {
    try {
        const estudianteDoc = await Estudiante.findById(req.params.id);
        if (!estudianteDoc) return res.status(404).json({ mensaje: 'Estudiante no encontrado' });

        const tutoriasActivas = await Tutoria.countDocuments({
            estudiante: estudianteDoc.usuario,
            estado: { $in: ['pendiente', 'confirmada'] },
        });
        if (tutoriasActivas > 0) {
            return res.status(400).json({ mensaje: 'No se puede eliminar: el estudiante tiene tutorías activas' });
        }

        await Tutoria.deleteMany({ estudiante: estudianteDoc.usuario });
        await Estudiante.findByIdAndDelete(estudianteDoc._id);
        await Usuario.findByIdAndDelete(estudianteDoc.usuario);

        res.json({ mensaje: 'Estudiante eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/* ──────────────────── DOCENTES ──────────────────── */
const getDocentes = async (req, res) => {
    try {
        const { nombre } = req.query;
        const filtro = {};
        if (nombre) filtro.nombre = { $regex: _esc(nombre), $options: 'i' };
        const docentes = await Docente.find(filtro)
            .populate('usuario', 'activo')
            .sort({ nombre: 1 })
            .lean();
        res.json({ docentes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const crearDocente = async (req, res) => {
    try {
        const { nombre, correo, password, departamento } = req.body;
        if (!nombre || !correo || !password) {
            return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
        }
        const existe = await Usuario.findOne({ correo });
        if (existe) return res.status(400).json({ mensaje: 'Ya existe un usuario con ese correo' });

        const usuarioDoc = await Usuario.create({ nombre, correo, password, rol: 'tutor' });
        const docenteDoc = await Docente.create({
            usuario:      usuarioDoc._id,
            nombre:       usuarioDoc.nombre,
            correo:       usuarioDoc.correo,
            departamento: departamento || 'Ingeniería de Sistemas',
        });
        res.status(201).json({ mensaje: 'Docente creado correctamente', docente: docenteDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarDocente = async (req, res) => {
    try {
        const docenteDoc = await Docente.findById(req.params.id);
        if (!docenteDoc) return res.status(404).json({ mensaje: 'Docente no encontrado' });

        const { nombre, correo, departamento, password } = req.body;
        const usuarioDoc = await Usuario.findById(docenteDoc.usuario).select('+password');
        if (!usuarioDoc) return res.status(404).json({ mensaje: 'Usuario asociado no encontrado' });

        if (nombre)       { usuarioDoc.nombre  = nombre;       docenteDoc.nombre  = nombre; }
        if (correo)       { usuarioDoc.correo  = correo;       docenteDoc.correo  = correo; }
        if (departamento) { docenteDoc.departamento = departamento; }
        if (password)     { usuarioDoc.password = password; }

        await usuarioDoc.save();
        await docenteDoc.save();

        res.json({ mensaje: 'Docente actualizado correctamente', docente: docenteDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarDocente = async (req, res) => {
    try {
        const docenteDoc = await Docente.findById(req.params.id);
        if (!docenteDoc) return res.status(404).json({ mensaje: 'Docente no encontrado' });

        const tutoriasActivas = await Tutoria.countDocuments({
            tutor:  docenteDoc.usuario,
            estado: { $in: ['pendiente', 'confirmada'] },
        });
        if (tutoriasActivas > 0) {
            return res.status(400).json({ mensaje: 'No se puede eliminar: el docente tiene tutorías activas' });
        }

        await HorarioTutor.deleteMany({ tutor: docenteDoc.usuario });
        await Tutoria.deleteMany({ tutor: docenteDoc.usuario });
        await Docente.findByIdAndDelete(docenteDoc._id);
        await Usuario.findByIdAndDelete(docenteDoc.usuario);

        res.json({ mensaje: 'Docente eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/* ──────────────────── MATERIAS ──────────────────── */
const ORDEN_SEM = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

const getMaterias = async (req, res) => {
    try {
        const { nombre, semestre } = req.query;
        const filtro = {};
        if (nombre)   filtro.nombre   = { $regex: _esc(nombre), $options: 'i' };
        if (semestre) filtro.semestre = semestre;
        const materias = await Materia.find(filtro).lean();
        materias.sort((a, b) => {
            const si = ORDEN_SEM.indexOf(a.semestre);
            const bi = ORDEN_SEM.indexOf(b.semestre);
            return si !== bi ? si - bi : a.nombre.localeCompare(b.nombre);
        });
        res.json({ materias });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const crearMateria = async (req, res) => {
    try {
        const { nombre, semestre } = req.body;
        if (!nombre || !semestre) {
            return res.status(400).json({ mensaje: 'Nombre y semestre son obligatorios' });
        }
        const materia = await Materia.create({ nombre, semestre });
        res.status(201).json({ mensaje: 'Materia creada correctamente', materia });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarMateria = async (req, res) => {
    try {
        const { nombre, semestre, activo } = req.body;
        const materia = await Materia.findByIdAndUpdate(
            req.params.id,
            { ...(nombre && { nombre }), ...(semestre && { semestre }), ...(activo !== undefined && { activo }) },
            { new: true, runValidators: true }
        );
        if (!materia) return res.status(404).json({ mensaje: 'Materia no encontrada' });
        res.json({ mensaje: 'Materia actualizada correctamente', materia });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarMateria = async (req, res) => {
    try {
        const materia = await Materia.findById(req.params.id);
        if (!materia) return res.status(404).json({ mensaje: 'Materia no encontrada' });

        await HorarioTutor.deleteMany({ materia: materia._id });
        await Materia.findByIdAndDelete(materia._id);

        res.json({ mensaje: 'Materia y sus horarios eliminados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/* ──────────────────── HORARIOS ──────────────────── */
const getHorarios = async (req, res) => {
    try {
        const { buscar } = req.query;
        let matchIds = null;

        if (buscar) {
            // Resuelve IDs en MongoDB antes de consultar horariotutors
            const rx = { $regex: _esc(buscar), $options: 'i' };
            const [materias, tutores] = await Promise.all([
                Materia.find({ nombre: rx }).select('_id').lean(),
                Usuario.find({ nombre: rx, rol: 'tutor' }).select('_id').lean(),
            ]);
            matchIds = {
                $or: [
                    { materia: { $in: materias.map(m => m._id) } },
                    { tutor:   { $in: tutores.map(t => t._id)  } },
                ],
            };
        }

        const horarios = await HorarioTutor.find(matchIds || {})
            .populate('tutor',   'nombre correo')
            .populate('materia', 'nombre semestre')
            .lean();

        // Ordenar por semestre en JS (populate impide sort de Mongo sobre campos joined)
        horarios.sort((a, b) => {
            const si = ORDEN_SEM.indexOf(a.materia?.semestre);
            const bi = ORDEN_SEM.indexOf(b.materia?.semestre);
            return si !== bi ? si - bi : (a.materia?.nombre ?? '').localeCompare(b.materia?.nombre ?? '');
        });

        res.json({ horarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const crearHorario = async (req, res) => {
    try {
        const { tutorId, materiaId, horario, aula } = req.body;
        if (!tutorId || !materiaId || !horario || !aula) {
            return res.status(400).json({ mensaje: 'Docente, materia, horario y aula son obligatorios' });
        }
        const horarioDoc = await HorarioTutor.create({
            tutor:   tutorId,
            materia: materiaId,
            horario,
            aula,
        });
        res.status(201).json({ mensaje: 'Horario creado correctamente', horario: horarioDoc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarHorario = async (req, res) => {
    try {
        const { horario, aula, activo } = req.body;
        const horarioDoc = await HorarioTutor.findByIdAndUpdate(
            req.params.id,
            { ...(horario && { horario }), ...(aula && { aula }), ...(activo !== undefined && { activo }) },
            { new: true, runValidators: true }
        );
        if (!horarioDoc) return res.status(404).json({ mensaje: 'Horario no encontrado' });
        res.json({ mensaje: 'Horario actualizado correctamente', horario: horarioDoc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarHorario = async (req, res) => {
    try {
        const horarioDoc = await HorarioTutor.findById(req.params.id);
        if (!horarioDoc) return res.status(404).json({ mensaje: 'Horario no encontrado' });
        await HorarioTutor.findByIdAndDelete(horarioDoc._id);
        res.json({ mensaje: 'Horario eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/* ──────────────────── TUTORÍAS ──────────────────── */
const getTutorias = async (req, res) => {
    try {
        const { estado, buscar } = req.query;
        const filtro = {};
        if (estado) filtro.estado = estado;

        if (buscar) {
            const rx = { $regex: _esc(buscar), $options: 'i' };
            // nombreEstudiante está desnormalizado como string — se busca directo
            // materia requiere pre-lookup de IDs
            const materias = await Materia.find({ nombre: rx }).select('_id').lean();
            filtro.$or = [
                { nombreEstudiante: rx },
                { materia: { $in: materias.map(m => m._id) } },
            ];
        }

        const tutorias = await Tutoria.find(filtro)
            .populate('tutor',   'nombre')
            .populate('materia', 'nombre semestre')
            .sort({ creadoEn: -1 })
            .lean();
        res.json({ tutorias });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarTutoria = async (req, res) => {
    try {
        const tutoria = await Tutoria.findByIdAndDelete(req.params.id);
        if (!tutoria) return res.status(404).json({ mensaje: 'Tutoría no encontrada' });
        res.json({ mensaje: 'Tutoría eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    getStats,
    getEstudiantes, crearEstudiante, actualizarEstudiante, eliminarEstudiante,
    getDocentes,    crearDocente,    actualizarDocente,    eliminarDocente,
    getMaterias,    crearMateria,    actualizarMateria,    eliminarMateria,
    getHorarios,    crearHorario,    actualizarHorario,    eliminarHorario,
    getTutorias,    eliminarTutoria,
};
