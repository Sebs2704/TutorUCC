/**
 * TutorComponent.js
 * Tab "Mis Tutorías": stats cards + chip filters + gestión de estado.
 */

const TutorComponent = (() => {
  let _filtroActivo = 'pendiente';
  let _container    = null;
  let _statsEl      = null;

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

  const _badge = (estado) => {
    const c = ESTADO_COLOR[estado] || ESTADO_COLOR.pendiente;
    return `<span style="background:${c.bg};color:${c.color};padding:3px 12px;border-radius:999px;font-size:.78rem;font-weight:700;">${ESTADO_LABEL[estado] || estado}</span>`;
  };

  const _fecha = (iso) => new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const _renderStats = () => {
    if (!_statsEl) return;
    const all = TutorTutorias.getAll();
    const counts = { pendiente: 0, confirmada: 0, finalizada: 0, cancelada: 0 };
    all.forEach(t => { if (counts[t.estado] !== undefined) counts[t.estado]++; });
    _statsEl.innerHTML = `
      <div class="tutor-stat tutor-stat--pendiente">
        <span class="tutor-stat__num">${counts.pendiente}</span>
        <span class="tutor-stat__lbl">Pendientes</span>
      </div>
      <div class="tutor-stat tutor-stat--confirmada">
        <span class="tutor-stat__num">${counts.confirmada}</span>
        <span class="tutor-stat__lbl">Confirmadas</span>
      </div>
      <div class="tutor-stat tutor-stat--finalizada">
        <span class="tutor-stat__num">${counts.finalizada}</span>
        <span class="tutor-stat__lbl">Finalizadas</span>
      </div>
      <div class="tutor-stat tutor-stat--total">
        <span class="tutor-stat__num">${all.length}</span>
        <span class="tutor-stat__lbl">Total</span>
      </div>`;
  };

  const _renderLista = () => {
    if (!_container) return;
    const tutorias = TutorTutorias.getAll();
    const filtradas = _filtroActivo === 'todas'
      ? tutorias
      : tutorias.filter(t => t.estado === _filtroActivo);

    if (filtradas.length === 0) {
      const label = _filtroActivo !== 'todas' ? `con estado "${ESTADO_LABEL[_filtroActivo]}"` : '';
      _container.innerHTML = `
        <div class="tutor-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <p>No hay tutorías ${label}</p>
        </div>`;
      return;
    }

    _container.innerHTML = filtradas.map(t => `
      <div class="tutor-card" data-id="${t._id}">
        <div class="tutor-card__header">
          <div>
            <div class="tutor-card__subject">${t.materia}</div>
            <div class="tutor-card__student">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${t.nombreEstudiante}
            </div>
          </div>
          ${_badge(t.estado)}
        </div>
        <div class="tutor-card__meta">
          <span>📅 ${t.horario}</span>
          <span>🚪 Aula ${t.aula}</span>
          <span>📚 Sem. ${t.semestre}</span>
          ${t.fechaTutoria
            ? `<span>🗓 Sesión: <strong>${_fecha(t.fechaTutoria)}</strong></span>`
            : `<span>🗓 Agendada: ${_fecha(t.creadoEn)}</span>`}
        </div>
        ${t.reasignadaDe ? `<div class="tutor-card__tag tutor-card__tag--reasignada">🔄 Reasignación automática</div>` : ''}
        ${t.comentario ? `<div class="tutor-card__comment">"${t.comentario}"</div>` : ''}
        ${t.motivoCancelacion ? `<div class="tutor-card__motivo">⚠️ Motivo cancelación: ${t.motivoCancelacion}</div>` : ''}
        <div class="tutor-card__actions">
          ${t.estado === 'pendiente' ? `
            <button type="button" class="btn btn--primary btn--sm btn-tc-confirmar" data-id="${t._id}">Confirmar</button>
            <button type="button" class="btn btn--sm btn-tc-cancelar" data-id="${t._id}" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">Cancelar</button>
          ` : ''}
          ${t.estado === 'confirmada' ? `
            <button type="button" class="btn btn--sm btn-tc-finalizar" data-id="${t._id}" style="background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;">Finalizar</button>
            <button type="button" class="btn btn--sm btn-tc-cancelar" data-id="${t._id}" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">Cancelar</button>
          ` : ''}
        </div>
      </div>`).join('');

    _container.querySelectorAll('.btn-tc-confirmar').forEach(btn =>
      btn.addEventListener('click', () => _confirmar(btn.dataset.id))
    );
    _container.querySelectorAll('.btn-tc-cancelar').forEach(btn =>
      btn.addEventListener('click', () => _modalCancelacion(btn.dataset.id))
    );
    _container.querySelectorAll('.btn-tc-finalizar').forEach(btn =>
      btn.addEventListener('click', () => _finalizar(btn.dataset.id))
    );
  };

  const _confirmar = async (id) => {
    const data = await Api.patch(`/tutorias/${id}/confirmar`);
    if (!data.tutoria) { _toast('❌ ' + (data.mensaje || 'Error al confirmar'), true); return; }
    _toast('✅ Tutoría confirmada. El estudiante fue notificado.');
    await TutorTutorias.recargar();
    Notificaciones.recargar();
  };

  const _finalizar = async (id) => {
    const data = await Api.patch(`/tutorias/${id}/finalizar`);
    if (!data.tutoria) { _toast('❌ ' + (data.mensaje || 'Error al finalizar'), true); return; }
    _toast('✅ Tutoría marcada como finalizada.');
    await TutorTutorias.recargar();
    Notificaciones.recargar();
  };

  const _modalCancelacion = (id) => {
    document.getElementById('modal-tc')?.remove();
    const modal = document.createElement('div');
    modal.id = 'modal-tc';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width:440px;">
        <div class="modal-card__header">
          <h3 class="modal-card__title" style="color:#ef4444;">Cancelar tutoría</h3>
          <button type="button" class="modal-close" id="mtc-x">✕</button>
        </div>
        <div class="modal-card__body">
          <p style="color:#374151;font-size:.9rem;line-height:1.6;margin-bottom:14px;">
            Indica el motivo. El estudiante será notificado y la tutoría se reasignará
            automáticamente a la próxima fecha disponible del mismo horario.
          </p>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="mtc-motivo">Motivo <span style="color:#ef4444;">*</span></label>
            <textarea id="mtc-motivo" class="form-input" rows="3"
              placeholder="Ej: Tengo una reunión académica urgente…"
              style="resize:vertical;min-height:80px;height:auto;padding:10px 14px;"></textarea>
          </div>
          <p id="mtc-error" style="color:#ef4444;font-size:.85rem;display:none;margin-top:8px;"></p>
        </div>
        <div class="modal-card__footer">
          <button type="button" class="btn btn--outline btn--md" id="mtc-no">No, volver</button>
          <button type="button" class="btn btn--md" id="mtc-si" style="background:#ef4444;color:#fff;border:none;">
            Sí, cancelar y reasignar
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const cerrar = () => modal.remove();
    modal.querySelector('#mtc-x').addEventListener('click', cerrar);
    modal.querySelector('#mtc-no').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });

    modal.querySelector('#mtc-si').addEventListener('click', async () => {
      const motivo  = modal.querySelector('#mtc-motivo').value.trim();
      const errorEl = modal.querySelector('#mtc-error');
      const btnSi   = modal.querySelector('#mtc-si');

      if (!motivo) {
        errorEl.textContent   = 'El motivo es obligatorio.';
        errorEl.style.display = 'block';
        return;
      }

      btnSi.textContent = 'Cancelando…';
      btnSi.disabled    = true;
      errorEl.style.display = 'none';

      const data = await Api.patch(`/tutorias/${id}/cancelar-tutor`, { motivo });
      if (!data.tutoria) {
        errorEl.textContent   = data.mensaje || 'Error al cancelar';
        errorEl.style.display = 'block';
        btnSi.textContent     = 'Sí, cancelar y reasignar';
        btnSi.disabled        = false;
        return;
      }
      cerrar();
      _toast('✅ Tutoría cancelada y reasignada al estudiante.');
      await TutorTutorias.recargar();
      Notificaciones.recargar();
    });
  };

  const _toast = (mensaje, esError = false) => {
    document.getElementById('toast-tutorucc')?.remove();
    const t = document.createElement('div');
    t.id        = 'toast-tutorucc';
    t.className = 'toast-notif';
    if (esError) t.style.background = '#ef4444';
    t.textContent = mensaje;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-notif--visible'), 50);
    setTimeout(() => {
      t.classList.remove('toast-notif--visible');
      setTimeout(() => t.remove(), 400);
    }, 4500);
  };

  TutorTutorias.onUpdate(() => {
    _renderStats();
    _renderLista();
  });

  const render = (container, chipsContainer, statsEl) => {
    _container = container;
    _statsEl   = statsEl || null;
    if (!container) return;

    if (chipsContainer) {
      const chips = [
        { v: 'pendiente',  l: 'Pendientes'  },
        { v: 'confirmada', l: 'Confirmadas' },
        { v: 'finalizada', l: 'Finalizadas' },
        { v: 'cancelada',  l: 'Canceladas'  },
        { v: 'todas',      l: 'Todas'       },
      ];
      chipsContainer.innerHTML = chips.map(c => `
        <button type="button" class="chip-tab ${c.v === _filtroActivo ? 'chip-tab--active' : ''}" data-filtro="${c.v}">
          ${c.l}
        </button>`).join('');

      chipsContainer.querySelectorAll('.chip-tab').forEach(chip => {
        chip.addEventListener('click', () => {
          _filtroActivo = chip.dataset.filtro;
          chipsContainer.querySelectorAll('.chip-tab').forEach(c => c.classList.remove('chip-tab--active'));
          chip.classList.add('chip-tab--active');
          _renderLista();
        });
      });
    }

    TutorTutorias.recargar();
  };

  return { render };
})();
