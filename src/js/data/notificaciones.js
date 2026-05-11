/**
 * notificaciones.js
 * Carga, cachea y notifica cambios en las notificaciones del usuario.
 */
const Notificaciones = (() => {
  let _cache     = [];
  let _listeners = [];

  const _cargar = async () => {
    if (!Api.token()) return [];
    const data = await Api.get('/notificaciones');
    _cache = data.notificaciones || [];
    _listeners.forEach(fn => fn(_cache));
    return _cache;
  };

  const getAll      = () => _cache;
  const getNoLeidas = () => _cache.filter(n => !n.leida);
  const recargar    = () => _cargar();
  const onUpdate    = (fn) => _listeners.push(fn);

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
