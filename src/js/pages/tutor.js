/**
 * pages/tutor.js — Inicialización del dashboard del tutor.
 */
(() => {
  'use strict';

  const usuario = AuthGuard.usuario;

  /* ── Header ── */
  const partes    = usuario.nombre?.split(' ') || ['?'];
  const iniciales = (partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0][0]).toUpperCase();

  const nameEl     = document.getElementById('tutor-name');
  const initialsEl = document.getElementById('tutor-initials');
  const rolEl      = document.getElementById('tutor-rol');
  if (nameEl)     nameEl.textContent     = usuario.nombre;
  if (initialsEl) initialsEl.textContent = iniciales;
  if (rolEl)      rolEl.textContent      = 'Tutor';

  /* ── Helper anti-XSS ── */
  const _esc = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ── Notificaciones ── */
  Notificaciones.recargar().then(() => {
    NotificacionesComponent.init({
      bellId:    'notif-bell-tut',
      badgeId:   'notif-badge-tut',
      panelId:   'notif-panel-tut',
      listId:    'notif-list-tut',
      markAllId: 'notif-mark-all-tut',
    });
  });
  setInterval(() => Notificaciones.recargar(), 60000);

  /* ── Modal de perfil ── */
  const _initPerfil = () => {
    const modal   = document.getElementById('modal-perfil');
    const errorEl = document.getElementById('perfil-error');
    const okEl    = document.getElementById('perfil-ok');

    document.getElementById('perfil-initials').textContent = iniciales;
    document.getElementById('perfil-nombre').textContent   = usuario.nombre;
    document.getElementById('perfil-correo').textContent   = usuario.correo;
    document.getElementById('perfil-rol').textContent      = usuario.rol;

    const _cerrar = () => {
      modal.hidden = true;
      document.getElementById('perfil-pass-actual').value  = '';
      document.getElementById('perfil-pass-nueva').value   = '';
      document.getElementById('perfil-pass-nueva2').value  = '';
      errorEl.textContent = '';
      okEl.hidden = true;
    };

    document.getElementById('btn-cerrar-perfil')?.addEventListener('click',  _cerrar);
    document.getElementById('btn-cerrar-perfil2')?.addEventListener('click', _cerrar);
    modal?.addEventListener('click', e => { if (e.target === modal) _cerrar(); });
    document.getElementById('btn-avatar-tutor')?.addEventListener('click', () => { modal.hidden = false; });

    document.getElementById('btn-guardar-perfil')?.addEventListener('click', async () => {
      errorEl.textContent = '';
      okEl.hidden = true;

      const actual = document.getElementById('perfil-pass-actual')?.value;
      const nueva  = document.getElementById('perfil-pass-nueva')?.value;
      const nueva2 = document.getElementById('perfil-pass-nueva2')?.value;

      if (!actual || !nueva) { errorEl.textContent = 'Completa todos los campos'; return; }
      if (nueva.length < 6)  { errorEl.textContent = 'Mínimo 6 caracteres';       return; }
      if (nueva !== nueva2)  { errorEl.textContent = 'Las contraseñas no coinciden'; return; }

      const btn = document.getElementById('btn-guardar-perfil');
      btn.textContent = 'Guardando…';
      btn.disabled    = true;

      try {
        const data = await Api.patch('/auth/cambiar-password', {
          passwordActual: actual,
          passwordNueva:  nueva,
        });
        if (data.mensaje && !data.error) {
          okEl.textContent = data.mensaje;
          okEl.hidden      = false;
          document.getElementById('perfil-pass-actual').value = '';
          document.getElementById('perfil-pass-nueva').value  = '';
          document.getElementById('perfil-pass-nueva2').value = '';
        } else {
          errorEl.textContent = data.mensaje || 'Error al cambiar la contraseña';
        }
      } catch {
        errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
      } finally {
        btn.textContent = 'Guardar cambios';
        btn.disabled    = false;
      }
    });
  };

  /* ── Tabs ── */
  const _initialized = new Set();

  const _initTab = (tabId) => {
    if (_initialized.has(tabId)) return;
    _initialized.add(tabId);
    switch (tabId) {
      case 'tutorias':    _initTutorTutorias();    break;
      case 'calendario':  _initTutorCalendario();  break;
      case 'historial':   _initTutorHistorial();   break;
      case 'estudiantes': _initTutorEstudiantes(); break;
    }
  };

  const _switchTab = (tabId) => {
    document.getElementById('tutor-tab-nav')?.querySelectorAll('.tab-nav__btn').forEach(btn => {
      const active = btn.dataset.tabTutor === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const active = panel.id === `tab-tutor-${tabId}`;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    _initTab(tabId);
  };

  const _initTutorTutorias = () => {
    TutorComponent.render(
      document.getElementById('tutor-list'),
      document.getElementById('tutor-chips'),
      document.getElementById('tutor-stats')
    );
  };

  const _initTutorCalendario = () => {
    TutorCalendarioComponent.render(
      document.getElementById('tutor-cal-grid'),
      document.getElementById('tutor-cal-title'),
      document.getElementById('tutor-cal-sidebar')
    );
    document.getElementById('tutor-cal-prev')?.addEventListener('click', () =>
      TutorCalendarioComponent.navigate(-1));
    document.getElementById('tutor-cal-next')?.addEventListener('click', () =>
      TutorCalendarioComponent.navigate(+1));
  };

  const _initTutorHistorial = () => {
    const container  = document.getElementById('tutor-historial-list');
    const chipsEl    = document.getElementById('tutor-historial-filter-chips');
    if (!container) return;

    const PERIODOS = [
      { valor: '',       label: 'Todo'        },
      { valor: 'hoy',    label: 'Hoy'         },
      { valor: 'semana', label: 'Esta semana' },
      { valor: 'mes',    label: 'Este mes'    },
    ];
    let _periodo = '';

    const _filtrar = (tutorias, periodo) => {
      if (!periodo) return tutorias;
      const ahora = new Date();
      const inicio = new Date(ahora);
      if (periodo === 'hoy')    { inicio.setHours(0, 0, 0, 0); }
      if (periodo === 'semana') { inicio.setDate(ahora.getDate() - 7); }
      if (periodo === 'mes')    { inicio.setDate(1); inicio.setHours(0, 0, 0, 0); }
      return tutorias.filter(t => new Date(t.creadoEn) >= inicio);
    };

    if (chipsEl) {
      chipsEl.innerHTML = PERIODOS.map(p => `
        <span class="chip ${p.valor === '' ? 'active' : ''}" data-periodo="${p.valor}"
              role="button" tabindex="0">${p.label}</span>`).join('');
      chipsEl.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          _periodo = chip.dataset.periodo;
          chipsEl.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          _render();
        });
      });
    }

    const _render = () => {
      const tutorias = _filtrar(
        TutorTutorias.getAll()
          .filter(t => t.estado === 'finalizada' || t.estado === 'cancelada')
          .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)),
        _periodo
      );

      if (tutorias.length === 0) {
        container.innerHTML = `<div class="tutor-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p>Aún no hay tutorías en el historial.</p>
        </div>`;
        return;
      }

      const ESTADO_COLOR = {
        finalizada: { bg: '#dbeafe', color: '#1e40af' },
        cancelada:  { bg: '#fee2e2', color: '#991b1b' },
      };

      container.innerHTML = tutorias.map(t => {
        const c         = ESTADO_COLOR[t.estado];
        const fechaBase = new Date(t.creadoEn).toLocaleDateString('es-CO',
          { day: 'numeric', month: 'short', year: 'numeric' });
        const sesionFecha = t.fechaTutoria
          ? `Sesión: <strong>${new Date(t.fechaTutoria).toLocaleDateString('es-CO',
              { day: 'numeric', month: 'short', year: 'numeric' })}</strong>`
          : _esc(fechaBase);
        return `
          <div class="tutor-card">
            <div class="tutor-card__header">
              <div>
                <div class="tutor-card__subject">${_esc(t.materia)}</div>
                <div class="tutor-card__student">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" style="vertical-align:middle;margin-right:3px;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  ${_esc(t.nombreEstudiante)}
                </div>
              </div>
              <span style="background:${c.bg};color:${c.color};padding:3px 12px;border-radius:999px;
                font-size:.78rem;font-weight:700;">
                ${_esc(t.estado.charAt(0).toUpperCase() + t.estado.slice(1))}
              </span>
            </div>
            <div class="tutor-card__meta">
              <span>📅 ${_esc(t.horario)}</span>
              <span>🚪 Aula ${_esc(t.aula)}</span>
              <span>📚 Sem. ${_esc(t.semestre)}</span>
              <span>🗓 ${sesionFecha}</span>
            </div>
            ${t.motivoCancelacion
              ? `<div class="tutor-card__motivo">⚠️ Motivo: ${_esc(t.motivoCancelacion)}</div>`
              : ''}
            ${t.reasignadaDe
              ? `<div class="tutor-card__tag tutor-card__tag--reasignada">🔄 Reasignación automática</div>`
              : ''}
          </div>`;
      }).join('');
    };

    _render();
    TutorTutorias.onUpdate(_render);
  };

  const _initTutorEstudiantes = () => {
    TutorEstudiantesComponent.render(
      document.getElementById('tutor-estudiantes-list'),
      document.getElementById('est-stats')
    );
    document.getElementById('btn-descargar-reporte')?.addEventListener('click', () =>
      TutorEstudiantesComponent.descargarCSV());
  };

  /* ── Logout + nav ── */
  document.getElementById('btn-logout-tutor')?.addEventListener('click', AuthGuard.logout);

  document.getElementById('tutor-tab-nav')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-nav__btn');
    if (btn) _switchTab(btn.dataset.tabTutor);
  });

  /* ── Arranque ── */
  _initPerfil();
  _initTab('tutorias');
})();
