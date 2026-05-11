const TutorTutorias = (() => {
  let _cache     = null;
  let _listeners = [];

  const _cargar = async () => {
    if (!Api.token()) return [];
    const data = await Api.get('/tutorias/mis-tutorias-tutor');
    _cache = data.tutorias || [];
    _listeners.forEach(fn => fn(_cache));
    return _cache;
  };

  const getAll   = () => _cache || [];
  const recargar = () => _cargar();
  const onUpdate = (fn) => { _listeners.push(fn); };

  return { getAll, recargar, onUpdate };
})();
