/**
 * notificaciones.js
 * Carga notificaciones vía REST y escucha eventos en tiempo real via Socket.io.
 * Si el WebSocket no está disponible, mantiene un polling de respaldo cada 60 s.
 */
const Notificaciones = (() => {
  let _cache     = [];
  let _listeners = [];
  let _socket    = null;
  let _pollTimer = null;
  const POLL_MS  = 60000; // fallback: 60 segundos

  const _notificar = () => _listeners.forEach(fn => fn(_cache));

  const _cargar = async () => {
    if (!Api.token()) return [];
    const data = await Api.get('/notificaciones');
    _cache = data.notificaciones || [];
    _notificar();
    return _cache;
  };

  // Inserta la nueva notificación al principio del cache sin llamar al servidor
  const _agregarEnTiempoReal = (notif) => {
    // Evitar duplicados si el poll ya la trajo
    if (_cache.some(n => n._id === notif._id)) return;
    _cache = [notif, ..._cache];
    _notificar();
    // Avisa al resto de módulos para que recarguen sus datos si corresponde
    document.dispatchEvent(new CustomEvent('tutorucc:notificacion-rt', { detail: notif }));
  };

  const _conectarSocket = () => {
    if (_socket || typeof io === 'undefined') return;

    const token = Api.token();
    if (!token) return;

    // La URL base del servidor es la misma que API_URL pero sin /api
    const socketUrl = CONFIG.API_URL.replace(/\/api\/?$/, '');

    _socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
    });

    _socket.on('connect', () => {
      console.log('[WS] Conectado al servidor de notificaciones');
    });

    _socket.on('nueva-notificacion', (notif) => {
      _agregarEnTiempoReal(notif);
    });

    _socket.on('connect_error', (err) => {
      console.warn('[WS] Error de conexión, usando polling:', err.message);
      _iniciarPollFallback();
    });

    _socket.on('disconnect', () => {
      console.warn('[WS] Desconectado, activando polling de respaldo');
      _iniciarPollFallback();
    });
  };

  const _iniciarPollFallback = () => {
    if (_pollTimer) return;
    _pollTimer = setInterval(() => {
      if (!document.hidden) _cargar();
    }, POLL_MS);
  };

  const getAll      = () => _cache;
  const getNoLeidas = () => _cache.filter(n => !n.leida);

  const onUpdate = (fn) => {
    _listeners.push(fn);
    // Iniciar socket la primera vez que alguien se suscribe
    _conectarSocket();
  };

  const recargar = () => _cargar();

  const marcarLeida = async (id) => {
    await Api.patch(`/notificaciones/${id}/leer`);
    _cache = _cache.map(n => n._id === id ? { ...n, leida: true } : n);
    _notificar();
  };

  const marcarTodasLeidas = async () => {
    await Api.patch('/notificaciones/leer-todas');
    _cache = _cache.map(n => ({ ...n, leida: true }));
    _notificar();
  };

  return { getAll, getNoLeidas, recargar, onUpdate, marcarLeida, marcarTodasLeidas };
})();
