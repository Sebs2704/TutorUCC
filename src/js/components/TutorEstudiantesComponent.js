/**
 * TutorEstudiantesComponent.js
 * Lista de estudiantes tutoreados + descarga de reporte CSV.
 */

const TutorEstudiantesComponent = (() => {

  let _container  = null;
  let _statsEl    = null;

  const _agruparPorEstudiante = () => {
    const map = new Map();
    TutorTutorias.getAll().forEach(t => {
      const key = t.correoEstudiante;
      if (!map.has(key)) {
        map.set(key, {
          nombre:   t.nombreEstudiante,
          correo:   t.correoEstudiante,
          materias: new Set(),
          sesiones: 0,
          finalizadas: 0,
        });
      }
      const est = map.get(key);
      est.materias.add(t.materia);
      est.sesiones++;
      if (t.estado === 'finalizada') est.finalizadas++;
    });
    return [...map.values()].sort((a, b) => b.finalizadas - a.finalizadas);
  };

  const _initials = (nombre) => {
    const parts = nombre.trim().split(' ').filter(Boolean);
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?';
  };

  const _renderStats = (estudiantes) => {
    if (!_statsEl) return;
    const totalFin = TutorTutorias.getAll().filter(t => t.estado === 'finalizada').length;
    _statsEl.innerHTML = `
      <div class="tutor-stat tutor-stat--total">
        <span class="tutor-stat__num">${estudiantes.length}</span>
        <span class="tutor-stat__lbl">Estudiantes únicos</span>
      </div>
      <div class="tutor-stat tutor-stat--finalizada">
        <span class="tutor-stat__num">${totalFin}</span>
        <span class="tutor-stat__lbl">Sesiones finalizadas</span>
      </div>`;
  };

  const _render = () => {
    if (!_container) return;
    const estudiantes = _agruparPorEstudiante();
    _renderStats(estudiantes);

    if (estudiantes.length === 0) {
      _container.innerHTML = `
        <div class="tutor-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>Aún no has realizado tutorías.</p>
        </div>`;
      return;
    }

    _container.innerHTML = `<div class="est-grid">${
      estudiantes.map(est => `
        <div class="est-card">
          <div class="est-card__avatar">${_initials(est.nombre).toUpperCase()}</div>
          <div class="est-card__body">
            <div class="est-card__name">${est.nombre}</div>
            <div class="est-card__email">${est.correo}</div>
            <div class="est-card__materias">${[...est.materias].map(m =>
              `<span class="est-card__tag">${m}</span>`).join('')}
            </div>
          </div>
          <div class="est-card__stats">
            <span class="est-card__stat-num">${est.sesiones}</span>
            <span class="est-card__stat-lbl">sesión${est.sesiones !== 1 ? 'es' : ''}</span>
          </div>
        </div>`).join('')
    }</div>`;
  };

  const descargarCSV = () => {
    const tutorias = TutorTutorias.getAll();
    if (tutorias.length === 0) return;

    const total       = tutorias.length;
    const finalizadas = tutorias.filter(t => t.estado === 'finalizada').length;
    const pendientes  = tutorias.filter(t => t.estado === 'pendiente').length;
    const canceladas  = tutorias.filter(t => t.estado === 'cancelada').length;

    const tutorNombre = (typeof AuthGuard !== 'undefined' && AuthGuard.usuario?.nombre) || 'Tutor';
    const fechaHoy    = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    const filas = tutorias.map((t, i) => {
      const fecha = new Date(t.creadoEn).toLocaleDateString('es-CO',
        { day:'2-digit', month:'2-digit', year:'numeric' });
      return [
        i + 1,
        q(t.nombreEstudiante),
        q(t.correoEstudiante),
        q(t.materia),
        q(`Semestre ${t.semestre}`),
        q(t.horario),
        q(`Aula ${t.aula}`),
        q(cap(t.estado)),
        q(fecha),
        q(t.comentario || ''),
        q(t.motivoCancelacion || ''),
      ].join(';');
    });

    const pct = (n) => total > 0 ? `${Math.round(n / total * 100)}%` : '0%';

    const lineas = [
      // ── Encabezado ──────────────────────────────────────────
      `"REPORTE DE TUTORÍAS — TutorUCC"`,
      `"Universidad Cooperativa de Colombia"`,
      ``,
      `"Tutor:";${q(tutorNombre)}`,
      `"Fecha de generación:";${q(fechaHoy)}`,
      ``,
      // ── Resumen ─────────────────────────────────────────────
      `"════ RESUMEN ════"`,
      `"Total de tutorías:";${total}`,
      `"Finalizadas:";${finalizadas};"(${pct(finalizadas)})"`,
      `"Pendientes:";${pendientes};"(${pct(pendientes)})"`,
      `"Canceladas:";${canceladas};"(${pct(canceladas)})"`,
      ``,
      // ── Tabla de datos ───────────────────────────────────────
      `"════ DETALLE DE TUTORÍAS ════"`,
      `"#";"Estudiante";"Correo";"Materia";"Semestre";"Horario";"Aula";"Estado";"Fecha agendada";"Comentario";"Motivo cancelación"`,
      ...filas,
      ``,
      `"Generado automáticamente por TutorUCC"`,
    ];

    const csv  = lineas.join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `reporte_tutorias_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  TutorTutorias.onUpdate(() => _render());

  const render = (container, statsEl) => {
    _container = container;
    _statsEl   = statsEl || null;
    _render();
  };

  return { render, descargarCSV };
})();
