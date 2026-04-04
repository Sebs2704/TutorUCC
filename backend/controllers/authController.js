const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

// Generar token JWT
const generarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// @route  POST /api/auth/registro
// @desc   Registrar nuevo usuario
// @access Público
const registro = async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExiste = await Usuario.findOne({ correo });
        if (usuarioExiste) {
            return res.status(400).json({ mensaje: 'Ya existe una cuenta con ese correo' });
        }

        // Crear usuario
        const usuario = await Usuario.create({ nombre, correo, password, rol });

        const token = generarToken(usuario._id);

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        // Mostrar errores de validación de Mongoose de forma amigable
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ mensaje: mensajes.join(', ') });
        }
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  POST /api/auth/login
// @desc   Iniciar sesión
// @access Público
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Validar campos
        if (!correo || !password) {
            return res.status(400).json({ mensaje: 'Por favor ingresa correo y contraseña' });
        }

        // Buscar usuario (incluir password que está oculto por defecto)
        const usuario = await Usuario.findOne({ correo }).select('+password');
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        // Verificar que la cuenta esté activa
        if (!usuario.activo) {
            return res.status(401).json({ mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador' });
        }

        // Verificar contraseña
        const passwordCorrecta = await usuario.compararPassword(password);
        if (!passwordCorrecta) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const token = generarToken(usuario._id);

        res.status(200).json({
            mensaje: 'Sesión iniciada correctamente',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  GET /api/auth/perfil
// @desc   Obtener perfil del usuario autenticado
// @access Privado
const perfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuarioId);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json({ usuario });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { registro, login, perfil };
