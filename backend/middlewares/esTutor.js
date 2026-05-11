const jwt = require('jsonwebtoken');

const esTutor = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ mensaje: 'No autorizado. Token requerido' });
        }
        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'tutor') {
            return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol tutor' });
        }
        req.usuarioId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

module.exports = { esTutor };
