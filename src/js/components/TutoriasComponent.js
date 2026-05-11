/**
 * TutoriasComponent.js
 * Todo viene de la BD: semestres → materias → tutores → disponibilidad → agendar
 * Usa ObjectId (tutorId, materiaId) en todas las llamadas a la API.
 */

const TutoriasComponent = (() => {
  const ICON_BOOK  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
  const ICON_USER  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const ICON_CLOCK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const ICON_DOOR  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9v14h18V3L10 3v6H3z"/><polyline points="10 3 10 9 3 9"/></svg>`;


  const _cache = {};            // semestre → materias[]

  /* ── Estado inicial ── */
  const _estadoInicialHTML = () => `
    <div class="tutorias-empty-state">
      <div class="tutorias-empty-state__icon">${ICON_BOOK}</div>
      <h3 class="tutorias-empty-state__title">Selecciona tu semestre</h3>
      <p class="tutorias-empty-state__subtitle">Elige tu semestre en el filtro de arriba para ver las tutorías disponibles.</p>
    </div>`;

  /* ── Tarjeta de materia ── */
  const _cardMateriaHTML = (m) => `
    <div class="tutoring-card" role="listitem" data-materia-id="${m._id}">
      <div class="tutoring-card__header">
        <div class="tutoring-card__icon-wrap">
          <div class="tutoring-card__icon">${ICON_BOOK}</div>
          <p class="tutoring-card__subject">${m.nombre}</p>
        </div>
      </div>
      <div class="tutoring-card__footer" style="justify-content:flex-end;margin-top:12px;">
        <button type="button" class="btn btn--primary btn--sm btn-ver-tutores"
          data-materia-id="${m._id}">Agendar</button>
      </div>
    </div>`;

  /* ── ID único por slot para el DOM ── */
  const _slotId = (tutorId, horario) =>
    'slot-' + (tutorId + horario).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);

  /* ── Panel de tutores con estado "cargando" ── */
  const _panelTutoresHTML = (materia, tutores) => {
    const filas = tutores.length === 0
      ? `<p style="color:#6b7280;font-size:.9rem;padding:12px 0;">No hay tutores asignados para esta materia aún.</p>`
      : tutores.map(t => `
          <div class="tutor-row"
               id="${_slotId(t.tutorId, t.horario)}"
               data-tutor="${t.nombre}"
               data-tutor-id="${t.tutorId}"
               data-horario="${t.horario}"
               data-aula="${t.aula}"
               data-materia="${materia.nombre}"
               data-materia-id="${materia._id}"
               data-semestre="${materia.semestre}"
               data-horario-tutor-id="${t.horarioTutorId || ''}">
            <div class="tutor-row__info">
              <div class="tutor-row__name">${ICON_USER} ${t.nombre}</div>
              <div class="tutor-row__meta">
                ${ICON_CLOCK} ${t.horario}
                &nbsp;<span class="disp-aula">${ICON_DOOR} Aula <strong>${t.aula}</strong></span>
              </div>
              <div class="disp-wrap">
                <div class="disp-bar-track"><div class="disp-bar-fill disp-bar-fill--loading" style="width:0%"></div></div>
                <span class="disp-label disp-label--loading">Verificando cupos…</span>
              </div>
            </div>
            <div class="tutor-row__actions">
              <button type="button" class="btn btn--primary btn--sm btn-agendar-tutor" disabled
                data-tutor="${t.nombre}"           data-tutor-id="${t.tutorId}"
                data-horario="${t.horario}"         data-aula="${t.aula}"
                data-materia="${materia.nombre}"    data-materia-id="${materia._id}"
                data-semestre="${materia.semestre}" data-horario-tutor-id="${t.horarioTutorId || ''}">
                Cargando…
              </button>
            </div>
          </div>`).join('');

    return `
      <div class="tutores-panel" id="panel-${materia._id}">
        <div class="tutores-panel__header">
          <div class="tutoring-card__icon-wrap">
            <div class="tutoring-card__icon">${ICON_BOOK}</div>
            <div>
              <p class="tutoring-card__subject">${materia.nombre}</p>
              <p class="tutoring-card__semester">Semestre ${materia.semestre} — Tutores disponibles</p>
            </div>
          </div>
          <button type="button" class="btn btn--outline btn--sm btn-cerrar-panel">✕ Cerrar</button>
        </div>
        <div class="tutores-panel__list">${filas}</div>
      </div>`;
  };

  /* ── Carga disponibilidad en paralelo para todos los slots ── */
  const _cargarDisponibilidad = async (wrap, tutores) => {
    await Promise.all(tutores.map(async (t) => {
      const rowEl = wrap.querySelector(`#${_slotId(t.tutorId, t.horario)}`);
      if (!rowEl) return;
      const params = new URLSearchParams({ tutorId: t.tutorId, horario: t.horario });
      const info   = await Api.get(`/tutorias/disponibilidad?${params}`);
      _actualizarFila(rowEl, info.fechaTutoria !== undefined ? info : null);
    }));
  };

  /* ── Actualiza visualmente una fila con los datos de disponibilidad ── */
  const _actualizarFila = (rowEl, info) => {
    const barFill   = rowEl.querySelector('.disp-bar-fill');
    const label     = rowEl.querySelector('.disp-label');
    const actionsEl = rowEl.querySelector('.tutor-row__actions');

    const _btnBase = (extraClass = '', fechaAttr = '') => `
      <button type="button" class="btn btn--sm btn-agendar-tutor ${extraClass}"
        data-tutor="${rowEl.dataset.tutor}"
        data-tutor-id="${rowEl.dataset.tutorId}"
        data-horario="${rowEl.dataset.horario}"
        data-aula="${rowEl.dataset.aula}"
        data-materia="${rowEl.dataset.materia}"
        data-materia-id="${rowEl.dataset.materiaId}"
        data-semestre="${rowEl.dataset.semestre}"
        data-horario-tutor-id="${rowEl.dataset.horarioTutorId}"
        ${fechaAttr}>`;

    if (!info || !info.fechaTutoria) {
      if (barFill) barFill.className = 'disp-bar-fill disp-bar-fill--error';
      if (label)   label.innerHTML   = '<span class="disp-badge disp-badge--error">Sin datos</span>';
      if (actionsEl) {
        actionsEl.innerHTML = _btnBase('btn--primary') + 'Agendar</button>';
        _wireBtn(actionsEl);
      }
      return;
    }

    const { ocupados, maximo, disponible, fechaTutoria, proximaFecha } = info;
    const pct    = Math.min((ocupados / maximo) * 100, 100);
    const libres = maximo - ocupados;

    const colorClass = pct >= 100 ? 'disp-bar-fill--lleno'
                     : pct >= 75  ? 'disp-bar-fill--casi'
                     :              'disp-bar-fill--ok';
    if (barFill) { barFill.className = `disp-bar-fill ${colorClass}`; barFill.style.width = pct + '%'; }

    const fechaFmt = new Date(fechaTutoria).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const proxFmt  = new Date(proximaFecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

    if (label) {
      label.innerHTML = disponible
        ? `<span class="disp-badge disp-badge--ok">${libres} cupo${libres !== 1 ? 's' : ''} libre${libres !== 1 ? 's' : ''}</span>
           <span class="disp-fecha">📆 ${fechaFmt}</span>`
        : `<span class="disp-badge disp-badge--lleno">Lleno ${ocupados}/${maximo}</span>
           <span class="disp-fecha">Próxima: ${proxFmt}</span>`;
    }

    if (actionsEl) {
      actionsEl.innerHTML = disponible
        ? _btnBase('btn--primary', `data-fecha="${fechaTutoria}"`) + 'Agendar</button>'
        : _btnBase('btn-agendar-prox', `data-fecha="${proximaFecha}"`) + '🔄 Agendar próxima fecha</button>';
      _wireBtn(actionsEl);
    }
  };

  /* ── Conecta el botón de la fila con el modal ── */
  const _wireBtn = (actionsEl) => {
    const btn = actionsEl?.querySelector('.btn-agendar-tutor');
    if (!btn) return;
    btn.addEventListener('click', () => _abrirModal({
      tutorId:        btn.dataset.tutorId,
      tutor:          btn.dataset.tutor,       // display
      materiaId:      btn.dataset.materiaId,
      materia:        btn.dataset.materia,     // display
      semestre:       btn.dataset.semestre,
      horario:        btn.dataset.horario,
      aula:           btn.dataset.aula,
      horarioTutorId: btn.dataset.horarioTutorId || null,
      fechaTutoriaOverride: btn.dataset.fecha || null,
    }));
  };

  /* ── Modal de confirmación ── */
  const _abrirModal = (datos) => {
    document.getElementById('modal-agendar')?.remove();

    const fechaLabel = datos.fechaTutoriaOverride
      ? new Date(datos.fechaTutoriaOverride).toLocaleDateString('es-CO',
          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    const modal = document.createElement('div');
    modal.id = 'modal-agendar';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-card__header">
          <h3 id="modal-title" class="modal-card__title">Confirmar tutoría</h3>
          <button type="button" class="modal-close" id="btn-modal-cerrar" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-card__body">
          <div class="modal-resumen">
            <div class="modal-resumen__row"><span>Materia</span><strong>${datos.materia}</strong></div>
            <div class="modal-resumen__row"><span>Tutor</span><strong>${datos.tutor}</strong></div>
            <div class="modal-resumen__row"><span>Horario</span><strong>${datos.horario}</strong></div>
            <div class="modal-resumen__row">
              <span>Aula</span>
              <strong class="modal-aula-badge">🚪 Aula ${datos.aula}</strong>
            </div>
            <div class="modal-resumen__row"><span>Semestre</span><strong>${datos.semestre}</strong></div>
            <div class="modal-resumen__row"><span>Fecha sesión</span><strong style="color:#0d8f95;">${fechaLabel}</strong></div>
          </div>
          <div class="form-group" style="margin-top:16px;">
            <label class="form-label" for="modal-comentario">
              ¿Qué tema necesitas repasar?
              <span style="color:#9ca3af;font-weight:400;">(opcional)</span>
            </label>
            <textarea id="modal-comentario" class="form-input" rows="3"
              placeholder="Ej: Tengo dudas sobre límites y derivadas…"
              style="resize:vertical;min-height:80px;"></textarea>
          </div>
          <p id="modal-error" style="color:#ef4444;font-size:.875rem;display:none;margin-top:8px;"></p>
        </div>
        <div class="modal-card__footer">
          <button type="button" class="btn btn--outline btn--md" id="btn-modal-cancelar">Cancelar</button>
          <button type="button" class="btn btn--primary btn--md" id="btn-modal-confirmar">Enviar solicitud</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();
    modal.querySelector('#btn-modal-cerrar').addEventListener('click', cerrar);
    modal.querySelector('#btn-modal-cancelar').addEventListener('click', cerrar);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

    modal.querySelector('#btn-modal-confirmar').addEventListener('click', async () => {
      const comentario = modal.querySelector('#modal-comentario').value.trim();
      const btn        = modal.querySelector('#btn-modal-confirmar');
      const errorEl    = modal.querySelector('#modal-error');

      btn.textContent = 'Enviando…';
      btn.disabled    = true;
      errorEl.style.display = 'none';

      try {
        const body = {
          materiaId:      datos.materiaId,
          semestre:       datos.semestre,
          tutorId:        datos.tutorId,
          horario:        datos.horario,
          aula:           datos.aula,
          horarioTutorId: datos.horarioTutorId || undefined,
          comentario,
        };
        if (datos.fechaTutoriaOverride) body.fechaTutoriaOverride = datos.fechaTutoriaOverride;

        const data = await Api.post('/tutorias', body);
        if (!data.tutoria) throw new Error(data.mensaje || 'Error al agendar');

        cerrar();
        _toast('✅ Solicitud de tutoría enviada. Revisa tu correo institucional.');
        MisTutorias.recargar();

      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
        btn.textContent       = 'Enviar solicitud';
        btn.disabled          = false;
      }
    });
  };

  const _toast = (mensaje) => {
    document.getElementById('toast-tutorucc')?.remove();
    const t = document.createElement('div');
    t.id = 'toast-tutorucc'; t.className = 'toast-notif';
    t.textContent = mensaje;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-notif--visible'), 50);
    setTimeout(() => { t.classList.remove('toast-notif--visible'); setTimeout(() => t.remove(), 400); }, 4000);
  };

  /* ── Renderiza la cuadrícula de materias ── */
  const _renderMaterias = (grid, materias) => {
    if (materias.length === 0) {
      grid.innerHTML = `<div class="tutorias-empty-state">
        <p class="tutorias-empty-state__subtitle">No se encontraron materias para este semestre.</p>
      </div>`;
      return;
    }
    grid.innerHTML = materias.map(_cardMateriaHTML).join('');
    grid.querySelectorAll('.btn-ver-tutores').forEach(btn =>
      btn.addEventListener('click', () => _abrirPanel(grid, btn.dataset.materiaId, materias))
    );
  };

  /* ── Abre el panel de tutores (fetch desde la BD) ── */
  const _abrirPanel = async (grid, materiaId, materias) => {
    const materia = materias.find(m => String(m._id) === String(materiaId));
    if (!materia) return;

    grid.querySelector('.tutores-panel-wrap')?.remove();
    const card = grid.querySelector(`[data-materia-id="${materiaId}"]`);
    if (!card) return;

    const wrap = document.createElement('div');
    wrap.className = 'tutores-panel-wrap';
    wrap.style.gridColumn = '1 / -1';
    wrap.innerHTML = `<div class="tutores-panel">
      <div style="padding:20px;color:#6b7280;text-align:center;font-size:.9rem;">Cargando tutores…</div>
    </div>`;
    card.after(wrap);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const data = await Api.get(`/catalogo/tutores/${materiaId}`);
    const tutores = data.tutores || [];

    wrap.innerHTML = _panelTutoresHTML(materia, tutores);
    wrap.querySelector('.btn-cerrar-panel')?.addEventListener('click', () => wrap.remove());

    if (tutores.length > 0) _cargarDisponibilidad(wrap, tutores);
  };

  /* ── Carga opciones de semestre desde la BD (una sola vez) ── */
  const _cargarSemestres = async () => {
    const select = DOM.byId('filter-semestre');
    if (!select || select.dataset.cargado) return;
    const data = await Api.get('/catalogo/semestres');
    if (!data.semestres) return;
    while (select.options.length > 1) select.remove(1);
    for (const sem of data.semestres) {
      const opt = document.createElement('option');
      opt.value = sem; opt.textContent = `Semestre ${sem}`;
      select.appendChild(opt);
    }
    select.dataset.cargado = '1';
  };

  /* ── API pública ── */
  const render = (grid) => {
    if (!grid) return;
    grid.innerHTML = _estadoInicialHTML();
    _cargarSemestres();
  };

  const applyFilters = async (grid) => {
    const semestre = DOM.byId('filter-semestre')?.value ?? '';
    const query    = DOM.byId('search-tutorias')?.value ?? '';
    if (!semestre) { grid.innerHTML = _estadoInicialHTML(); return; }

    grid.innerHTML = `<div class="tutorias-empty-state">
      <p class="tutorias-empty-state__subtitle">Cargando materias…</p>
    </div>`;

    try {
      if (!_cache[semestre]) {
        const data = await Api.get(`/catalogo/materias?semestre=${encodeURIComponent(semestre)}`);
        _cache[semestre] = data.materias || [];
      }
      let materias = _cache[semestre];
      if (query) {
        const q = query.toLowerCase();
        materias = materias.filter(m => m.nombre.toLowerCase().includes(q));
      }
      _renderMaterias(grid, materias);
    } catch {
      grid.innerHTML = `<div class="tutorias-empty-state">
        <p class="tutorias-empty-state__subtitle" style="color:#ef4444;">
          Error al cargar materias. Recarga la página.
        </p>
      </div>`;
    }
  };

  const clearFilters = (grid) => {
    const s = DOM.byId('search-tutorias');
    const f = DOM.byId('filter-semestre');
    if (s) s.value = '';
    if (f) f.value = '';
    grid.innerHTML = _estadoInicialHTML();
  };

  return { render, applyFilters, clearFilters };
})();
