/**
 * misTutorias.js
 * Carga y cachea las tutorías del estudiante. Usado por Calendario, Agendadas y Cancelación.
 */
const MisTutorias = (() => {
  let _cache     = null;
  let _listeners = [];

  const _cargar = async () => {
    if (!Api.token()) return [];
    const data = await Api.get('/tutorias/mis-tutorias');
    _cache = data.tutorias || [];
    _listeners.forEach(fn => fn(_cache));
    return _cache;
  };

  const getAll   = () => _cache || [];
  const recargar = () => _cargar();
  const onUpdate = (fn) => { _listeners.push(fn); };

  const ESTADO_LABEL = {
    pendiente:  'Pendiente',
    confirmada: 'Confirmada',
    finalizada: 'Finalizada',
    cancelada:  'Cancelada',
  };
  const ESTADO_COLOR = {
    pendiente:  { bg: '#fef3c7', color: '#92400e' },
    confirmada: { bg: '#d1fae5', color: '#065f46' },
    finalizada: { bg: '#dbeafe', color: '#1e40af' },
    cancelada:  { bg: '#fee2e2', color: '#991b1b' },
  };

  const badgeHTML = (estado) => {
    const c = ESTADO_COLOR[estado] || ESTADO_COLOR.pendiente;
    return `<span style="background:${c.bg};color:${c.color};padding:2px 10px;border-radius:999px;font-size:.78rem;font-weight:700;">${ESTADO_LABEL[estado] || estado}</span>`;
  };

  _cargar();

  return { getAll, recargar, onUpdate, badgeHTML, ESTADO_LABEL, ESTADO_COLOR };
})();
