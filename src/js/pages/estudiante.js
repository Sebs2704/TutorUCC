/**
 * pages/estudiante.js — Inicialización del dashboard del estudiante.
 */
(() => {
  'use strict';

  const usuario = AuthGuard.usuario;

  /* ── Header ── */
  const partes    = usuario.nombre?.split(' ') || ['?'];
  const iniciales = (partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0][0]).toUpperCase();

  const nameEl     = document.querySelector('.user-info__name');
  const initialsEl = document.querySelector('.user-avatar__initials');
  const rolEl      = document.querySelector('.user-info__program');
  if (nameEl)     nameEl.textContent     = usuario.nombre;
  if (initialsEl) initialsEl.textContent = iniciales;
  if (rolEl)      rolEl.textContent      = 'Estudiante';

  /* ── Notificaciones ── */
  Notificaciones.recargar().then(() => {
    NotificacionesComponent.init({
      bellId:    'notif-bell-est',
      badgeId:   'notif-badge-est',
      panelId:   'notif-panel-est',
      listId:    'notif-list-est',
      markAllId: 'notif-mark-all-est',
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
    document.getElementById('btn-avatar')?.addEventListener('click', () => { modal.hidden = false; });

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
      case 'inicio':      _initInicio();      break;
      case 'tutorias':    _initTutorias();    break;
      case 'calendario':  _initCalendario();  break;
      case 'cancelacion': _initCancelacion(); break;
    }
  };

  const _switchTab = (tabId) => {
    document.querySelectorAll('.tab-nav__btn').forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const active = panel.id === `tab-${tabId}`;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    _initTab(tabId);
  };

  const _initInicio = () => {
    StepsComponent.render(document.getElementById('steps-grid'));
    document.getElementById('btn-scroll-steps')?.addEventListener('click', () =>
      document.getElementById('pasos-tutoria')?.scrollIntoView({ behavior: 'smooth' }));
    document.getElementById('btn-go-tutorias')?.addEventListener('click', () => _switchTab('tutorias'));
  };

  const _initTutorias = () => {
    const grid = document.getElementById('tutorias-grid');
    TutoriasComponent.render(grid);
    document.getElementById('filter-semestre')?.addEventListener('change', () =>
      TutoriasComponent.applyFilters(grid));
    let _timer;
    document.getElementById('search-tutorias')?.addEventListener('input', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => TutoriasComponent.applyFilters(grid), 250);
    });
    document.getElementById('btn-clear-filters')?.addEventListener('click', () =>
      TutoriasComponent.clearFilters(grid));
  };

  const _initCalendario = () => {
    const grid  = document.getElementById('cal-grid');
    const title = document.getElementById('cal-month-title');
    CalendarComponent.render(grid, title);
    document.getElementById('cal-prev')?.addEventListener('click', () =>
      CalendarComponent.navigate(-1, grid, title));
    document.getElementById('cal-next')?.addEventListener('click', () =>
      CalendarComponent.navigate(+1, grid, title));
    AgendadasComponent.render(document.getElementById('agendadas-list'));
    AgendadasComponent.populateDayFilter(document.getElementById('cal-filter-day'));
    AgendadasComponent.renderChips(document.getElementById('cal-status-chips'));
  };

  const _initCancelacion = () => {
    InasistenciasComponent.updateAlertText(document.getElementById('cancelacion-alert-body'));
    InasistenciasComponent.render(document.getElementById('inasistencias-list'));
    SummaryComponent.render(document.getElementById('summary-grid'));
  };

  /* ── Logout + nav ── */
  document.getElementById('btn-logout')?.addEventListener('click', AuthGuard.logout);

  document.querySelector('.tab-nav__inner')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-nav__btn');
    if (btn) _switchTab(btn.dataset.tab);
  });

  /* ── Arranque ── */
  _initPerfil();
  _initTab('inicio');
})();
