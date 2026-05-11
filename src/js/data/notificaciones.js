/**
 * notificaciones.js
 * Carga, cachea y notifica cambios en las notificaciones del usuario.
 */
const Notificaciones = (() => {
  let _cache     = [];
  let _listeners = [];
  let _intervalo = null;
  const POLL_MS  = 20000; // 20 segundos

  const _cargar = async () => {
    if (!Api.token()) return [];
    const data = await Api.get('/notificaciones');
    _cache = data.notificaciones || [];
    _listeners.forEach(fn => fn(_cache));
    return _cache;
  };

  const _iniciarPolling = () => {
    if (_intervalo) return;
    _intervalo = setInterval(() => {
      if (!document.hidden) _cargar();
    }, POLL_MS);
  };

  const getAll      = () => _cache;
  const getNoLeidas = () => _cache.filter(n => !n.leida);
  const onUpdate    = (fn) => { _listeners.push(fn); _iniciarPolling(); };

  const recargar = () => _cargar();

  const marcarLeida = async (id) => {
    await Api.patch(`/notificaciones/${id}/leer`);
    await _cargar();
  };

  const marcarTodasLeidas = async () => {
    await Api.patch('/notificaciones/leer-todas');
    await _cargar();
  };

  return { getAll, getNoLeidas, recargar, onUpdate, marcarLeida, marcarTodasLeidas };
})();
