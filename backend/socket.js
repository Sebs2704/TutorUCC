/**
 * socket.js — Singleton que guarda la instancia de io.
 * Los controladores importan este módulo para emitir eventos sin
 * necesitar acceso directo a server.js.
 */
let _io = null;

const init = (io) => { _io = io; };

/**
 * Emite una notificación a un usuario específico por su ID de MongoDB.
 * El cliente debe haberse unido a la sala `user:<id>` al conectarse.
 */
const emitirNotificacion = (usuarioId, notificacion) => {
    if (!_io) return;
    _io.to(`user:${usuarioId}`).emit('nueva-notificacion', notificacion);
};

module.exports = { init, emitirNotificacion };
