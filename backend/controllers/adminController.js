const mongoose   = require('mongoose');

// Escapa caracteres especiales de regex para evitar ReDoS con input de usuario
const _esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Usuario       = require('../models/Usuario');
const Docente       = require('../models/Docente');
const Estudiante    = require('../models/Estudiante');
const Administrador = require('../models/Administrador');
const Materia       = require('../models/Materia');
const HorarioTutor  = require('../models/HorarioTutor');
const Tutoria       = require('../models/Tutoria');

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
            nombre: usuarioDoc.nombre,
            correo: usuarioDoc.correo,
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

        const usuarioDoc = await Usuario.findOne({ correo: estudianteDoc.correo }).select('+password');
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

        const usuarioDoc = await Usuario.findOne({ correo: estudianteDoc.correo });
        const uid = usuarioDoc?._id.toString() ?? '';

        const tutoriasActivas = await Tutoria.countDocuments({
            estudiante: uid,
            estado: { $in: ['pendiente', 'confirmada'] },
        });
        if (tutoriasActivas > 0) {
            return res.status(400).json({ mensaje: 'No se puede eliminar: el estudiante tiene tutorías activas' });
        }

        await Tutoria.deleteMany({ estudiante: uid });
        await Estudiante.findByIdAndDelete(estudianteDoc._id);
        if (usuarioDoc) await Usuario.findByIdAndDelete(usuarioDoc._id);

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
        const usuarioDoc = await Usuario.findOne({ correo: docenteDoc.correo }).select('+password');
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

        const usuarioDoc = await Usuario.findOne({ correo: docenteDoc.correo });
        const uid = usuarioDoc?._id.toString() ?? '';

        const tutoriasActivas = await Tutoria.countDocuments({
            tutor:  uid,
            estado: { $in: ['pendiente', 'confirmada'] },
        });
        if (tutoriasActivas > 0) {
            return res.status(400).json({ mensaje: 'No se puede eliminar: el docente tiene tutorías activas' });
        }

        await HorarioTutor.deleteMany({ 'tutor.id': uid });
        await Tutoria.deleteMany({ tutor: uid });
        await Docente.findByIdAndDelete(docenteDoc._id);
        if (usuarioDoc) await Usuario.findByIdAndDelete(usuarioDoc._id);

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
            const rx = { $regex: _esc(buscar), $options: 'i' };
            matchIds = {
                $or: [
                    { 'materia.nombre': rx },
                    { 'tutor.nombre':   rx },
                ],
            };
        }

        const horarios = await HorarioTutor.find(matchIds || {}).lean();

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
        const [tutorDoc, materiaDoc] = await Promise.all([
            Usuario.findById(tutorId).select('nombre correo'),
            Materia.findById(materiaId).select('nombre semestre'),
        ]);
        if (!tutorDoc)   return res.status(404).json({ mensaje: 'Tutor no encontrado' });
        if (!materiaDoc) return res.status(404).json({ mensaje: 'Materia no encontrada' });

        const horarioDoc = await HorarioTutor.create({
            tutor:   { id: tutorDoc._id.toString(), nombre: tutorDoc.nombre, correo: tutorDoc.correo },
            materia: { id: materiaDoc._id.toString(), nombre: materiaDoc.nombre, semestre: materiaDoc.semestre },
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
            filtro.$or = [
                { nombreEstudiante: rx },
                { nombreMateria:    rx },
            ];
        }

        const tutorias = await Tutoria.find(filtro)
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

/* ──────────────────── ADMINISTRADORES ──────────────────── */
const getAdmins = async (req, res) => {
    try {
        const { nombre } = req.query;
        const filtro = {};
        if (nombre) filtro.nombre = { $regex: _esc(nombre), $options: 'i' };
        const admins = await Administrador.find(filtro)
            .sort({ nombre: 1 })
            .lean();
        res.json({ admins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const crearAdmin = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        if (!nombre || !correo || !password)
            return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });

        const existe = await Usuario.findOne({ correo });
        if (existe) return res.status(400).json({ mensaje: 'Ya existe un usuario con ese correo' });

        const usuarioDoc = await Usuario.create({ nombre, correo, password, rol: 'admin' });
        const adminDoc   = await Administrador.create({
            nombre: usuarioDoc.nombre,
            correo: usuarioDoc.correo,
        });
        res.status(201).json({ mensaje: 'Administrador creado correctamente', admin: adminDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarAdmin = async (req, res) => {
    try {
        const adminDoc = await Administrador.findById(req.params.id);
        if (!adminDoc) return res.status(404).json({ mensaje: 'Administrador no encontrado' });

        const { nombre, correo, password } = req.body;
        const usuarioDoc = await Usuario.findOne({ correo: adminDoc.correo }).select('+password');
        if (!usuarioDoc) return res.status(404).json({ mensaje: 'Usuario asociado no encontrado' });

        if (nombre)   { usuarioDoc.nombre = nombre; adminDoc.nombre = nombre; }
        if (correo)   { usuarioDoc.correo = correo; adminDoc.correo = correo; }
        if (password) { usuarioDoc.password = password; }

        await usuarioDoc.save();
        await adminDoc.save();

        res.json({ mensaje: 'Administrador actualizado correctamente', admin: adminDoc });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: msgs.join(', ') });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const eliminarAdmin = async (req, res) => {
    try {
        const adminDoc = await Administrador.findById(req.params.id);
        if (!adminDoc) return res.status(404).json({ mensaje: 'Administrador no encontrado' });

        const usuarioDoc = await Usuario.findOne({ correo: adminDoc.correo });
        if (usuarioDoc && usuarioDoc._id.toString() === req.usuarioId.toString())
            return res.status(400).json({ mensaje: 'No puedes eliminar tu propio usuario administrador' });

        await Administrador.findByIdAndDelete(adminDoc._id);
        if (usuarioDoc) await Usuario.findByIdAndDelete(usuarioDoc._id);

        res.json({ mensaje: 'Administrador eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    getStats,
    getEstudiantes, crearEstudiante, actualizarEstudiante, eliminarEstudiante,
    getDocentes,    crearDocente,    actualizarDocente,    eliminarDocente,
    getAdmins,      crearAdmin,      actualizarAdmin,      eliminarAdmin,
    getMaterias,    crearMateria,    actualizarMateria,    eliminarMateria,
    getHorarios,    crearHorario,    actualizarHorario,    eliminarHorario,
    getTutorias,    eliminarTutoria,
};
