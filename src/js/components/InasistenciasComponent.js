/**
 * InasistenciasComponent.js
 * Tutorías del estudiante con cancelación mediante modal propio.
 */

const InasistenciasComponent = (() => {

  // Modal de confirmación de cancelación
  const _confirmarCancelacion = (tutoriaId, onConfirm) => {
    document.getElementById('modal-cancelar')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-cancelar';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width:400px;">
        <div class="modal-card__header">
          <h3 class="modal-card__title" style="color:#ef4444;">Cancelar tutoría</h3>
          <button class="modal-close" id="mc-cerrar">✕</button>
        </div>
        <div class="modal-card__body">
          <p style="color:#374151;font-size:.95rem;line-height:1.6;">
            ¿Estás seguro de que deseas cancelar esta tutoría? Esta acción no se puede deshacer.
          </p>
          <p id="mc-error" style="color:#ef4444;font-size:.85rem;display:none;margin-top:10px;"></p>
        </div>
        <div class="modal-card__footer">
          <button class="btn btn--outline btn--md" id="mc-no">No, mantener</button>
          <button class="btn btn--md" id="mc-si"
            style="background:#ef4444;color:#fff;border:none;">Sí, cancelar</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();
    modal.querySelector('#mc-cerrar').addEventListener('click', cerrar);
    modal.querySelector('#mc-no').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });

    modal.querySelector('#mc-si').addEventListener('click', async () => {
      const btnSi  = modal.querySelector('#mc-si');
      const errorEl = modal.querySelector('#mc-error');
      btnSi.textContent = 'Cancelando...';
      btnSi.disabled = true;
      errorEl.style.display = 'none';

      const data = await Api.patch(`/tutorias/${tutoriaId}/cancelar`);
      if (!data.tutoria) {
        errorEl.textContent   = data.mensaje || 'Error al cancelar';
        errorEl.style.display = 'block';
        btnSi.textContent     = 'Sí, cancelar';
        btnSi.disabled        = false;
        return;
      }
      cerrar();
      await MisTutorias.recargar();
    });
  };

  const PERIODOS = [
    { valor: '',       label: 'Todo'        },
    { valor: 'hoy',    label: 'Hoy'         },
    { valor: 'semana', label: 'Esta semana' },
    { valor: 'mes',    label: 'Este mes'    },
  ];

  let _periodoActivo = '';

  const _filtrarPorPeriodo = (tutorias, periodo) => {
    if (!periodo) return tutorias;
    const ahora = new Date();
    const inicio = new Date(ahora);
    if (periodo === 'hoy')    { inicio.setHours(0, 0, 0, 0); }
    if (periodo === 'semana') { inicio.setDate(ahora.getDate() - 7); }
    if (periodo === 'mes')    { inicio.setDate(1); inicio.setHours(0, 0, 0, 0); }
    return tutorias.filter(t => new Date(t.creadoEn) >= inicio);
  };

  const renderChips = (container) => {
    if (!container) return;
    container.innerHTML = PERIODOS.map(p => `
      <span class="chip ${p.valor === _periodoActivo ? 'active' : ''}"
            data-periodo="${p.valor}" role="button" tabindex="0">
        ${p.label}
      </span>`).join('');

    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        _periodoActivo = chip.dataset.periodo;
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const list = document.getElementById('inasistencias-list');
        if (list) render(list);
      });
    });
  };

  const render = (container) => {
    if (!container) return;

    const tutorias = _filtrarPorPeriodo(MisTutorias.getAll(), _periodoActivo);

    if (tutorias.length === 0) {
      container.innerHTML = `
        <li style="list-style:none;text-align:center;color:#9ca3af;padding:48px 0;">
          No tienes tutorías registradas aún.
        </li>`;
      return;
    }

    container.innerHTML = tutorias.map(t => `
      <li style="list-style:none;border:1px solid #e5e7eb;border-radius:10px;
          padding:16px 20px;margin-bottom:10px;background:#fff;
          display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"
          data-id="${t._id}">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:.95rem;color:#1f2937;margin-bottom:3px;">
            ${t.materia}
          </div>
          <div style="font-size:.85rem;color:#6b7280;margin-bottom:2px;">
            ${t.tutor} · ${t.horario} · Aula ${t.aula}
          </div>
          <div style="font-size:.78rem;color:#9ca3af;margin-bottom:8px;">
            Semestre ${t.semestre} · Agendada el ${new Date(t.creadoEn).toLocaleDateString('es-CO')}
          </div>
          ${t.comentario
            ? `<div style="font-size:.82rem;color:#4b5563;background:#f9fafb;
                padding:6px 10px;border-radius:6px;margin-bottom:8px;
                border-left:3px solid #d1d5db;">"${t.comentario}"</div>`
            : ''}
          ${t.reasignadaDe
            ? `<div style="font-size:.78rem;color:#5b21b6;background:#ede9fe;padding:4px 10px;
                border-radius:6px;margin-bottom:6px;display:inline-block;">🔄 Reasignación automática</div><br>`
            : ''}
          ${t.motivoCancelacion
            ? `<div style="font-size:.82rem;color:#991b1b;background:#fee2e2;
                padding:6px 10px;border-radius:6px;border-left:3px solid #fca5a5;margin-bottom:8px;">
                ⚠️ Cancelada por el tutor: "${t.motivoCancelacion}"</div>`
            : ''}
          ${MisTutorias.badgeHTML(t.estado)}
        </div>
        ${t.estado !== 'finalizada' && t.estado !== 'cancelada'
          ? `<button class="btn btn--outline btn--sm btn-cancelar-tutoria"
              data-id="${t._id}"
              style="white-space:nowrap;color:#ef4444;border-color:#fca5a5;flex-shrink:0;">
              Cancelar
            </button>`
          : ''}
      </li>`).join('');

    container.querySelectorAll('.btn-cancelar-tutoria').forEach(btn => {
      btn.addEventListener('click', () => {
        _confirmarCancelacion(btn.dataset.id);
      });
    });
  };

  const updateAlertText = (el) => {
    if (!el) return;
    const total     = MisTutorias.getAll().length;
    const canceladas = MisTutorias.getAll().filter(t => t.estado === 'cancelada').length;
    el.textContent = total === 0
      ? 'Aún no tienes tutorías registradas.'
      : `Tienes ${total} tutoría(s) registrada(s)${canceladas > 0
          ? `, de las cuales ${canceladas} han sido canceladas.`
          : '.'}`;
  };

  MisTutorias.onUpdate(() => {
    const container = document.getElementById('inasistencias-list');
    const alertBody = document.getElementById('cancelacion-alert-body');
    if (container) render(container);
    if (alertBody) updateAlertText(alertBody);
  });

  return { render, renderChips, updateAlertText };
})();
