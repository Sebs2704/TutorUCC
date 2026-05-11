const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const { enviarCorreo, plantillaBase } = require('../utils/mailer');

// Generar token JWT (incluye rol para validación sin DB en middlewares)
const generarToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// @route  POST /api/auth/registro
// @desc   Registrar nuevo usuario
// @access Público
const ROLES_PUBLICOS = ['estudiante', 'tutor'];

const registro = async (req, res) => {
    try {
        const { nombre, correo, password, rol } = req.body;

        if (!nombre?.trim() || !correo?.trim() || !password)
            return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });

        if (!ROLES_PUBLICOS.includes(rol))
            return res.status(400).json({ mensaje: 'Rol inválido. Solo se permiten: estudiante, tutor' });

        // Verificar si el usuario ya existe
        const usuarioExiste = await Usuario.findOne({ correo });
        if (usuarioExiste) {
            return res.status(400).json({ mensaje: 'Ya existe una cuenta con ese correo' });
        }

        // Crear usuario
        const usuario = await Usuario.create({ nombre, correo, password, rol });

        const token = generarToken(usuario._id, usuario.rol);

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

        const token = generarToken(usuario._id, usuario.rol);

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

// @route  POST /api/auth/recuperar
// @desc   Solicitar recuperación de contraseña (envía email con token)
// @access Público
const solicitarReset = async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ mensaje: 'El correo es obligatorio' });

        const usuario = await Usuario.findOne({ correo });
        // Respondemos igual aunque el usuario no exista (evita enumeración)
        if (!usuario) return res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás un enlace.' });

        const token = crypto.randomBytes(32).toString('hex');
        usuario.resetToken       = token;
        usuario.resetTokenExpira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await usuario.save({ validateModifiedOnly: true });

        const enlace = `${process.env.CLIENT_URL || 'http://localhost:5500'}/reset.html?token=${token}`;

        await enviarCorreo({
            to: correo,
            subject: '🔑 Recuperación de contraseña — TutorUCC',
            html: plantillaBase('Recuperar contraseña', `
                <p style="color:#374151;">Hola <strong>${usuario.nombre}</strong>,</p>
                <p style="color:#374151;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${enlace}" style="background:#0d8f95;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;">
                    Restablecer contraseña
                  </a>
                </div>
                <p style="color:#6b7280;font-size:.9rem;">Este enlace vence en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
                <p style="color:#9ca3af;font-size:.8rem;word-break:break-all;">O copia este enlace: ${enlace}</p>`)
        });

        res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás un enlace.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  POST /api/auth/reset/:token
// @desc   Restablecer contraseña con token
// @access Público
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6)
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });

        const usuario = await Usuario.findOne({
            resetToken: token,
            resetTokenExpira: { $gt: new Date() }
        }).select('+resetToken +resetTokenExpira');

        if (!usuario)
            return res.status(400).json({ mensaje: 'El enlace es inválido o ya expiró' });

        usuario.password         = password;
        usuario.resetToken       = undefined;
        usuario.resetTokenExpira = undefined;
        await usuario.save();

        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// @route  PATCH /api/auth/cambiar-password
// @desc   Cambiar contraseña del usuario autenticado
// @access Privado
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva)
            return res.status(400).json({ mensaje: 'Contraseña actual y nueva son obligatorias' });

        if (passwordNueva.length < 6)
            return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });

        const usuario = await Usuario.findById(req.usuarioId).select('+password');
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const correcta = await usuario.compararPassword(passwordActual);
        if (!correcta)
            return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta' });

        usuario.password = passwordNueva;
        await usuario.save();

        res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { registro, login, perfil, solicitarReset, resetPassword, cambiarPassword };
