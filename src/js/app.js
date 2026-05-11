/**
 * app.js — TutorUCC
 * Login + routing por rol (estudiante / tutor) + notificaciones
 */

(() => {
  'use strict';

  const API_URL = CONFIG.API_URL;
  const _initializedTabs      = new Set();
  const _initializedTutorTabs = new Set();
  let _notifInterval = null;

  /* ── Helpers de error en campos ── */
  const _showFieldError = (inputId, errorId, message) => {
    const input = DOM.byId(inputId);
    const error = DOM.byId(errorId);
    DOM.setText(error, message);
    DOM.addClass(input, 'form-input--error');
    input?.setAttribute('aria-invalid', 'true');
  };

  const _clearFieldError = (inputId, errorId) => {
    const input = DOM.byId(inputId);
    const error = DOM.byId(errorId);
    DOM.setText(error, '');
    DOM.removeClass(input, 'form-input--error');
    input?.removeAttribute('aria-invalid');
  };

  /* ══════════════════════════════════════════════
     MODAL RECUPERAR CONTRASEÑA
  ══════════════════════════════════════════════ */
  const _initRecuperar = () => {
    const modal     = DOM.byId('modal-recuperar');
    const emailEl   = DOM.byId('recuperar-email');
    const errorEl   = DOM.byId('recuperar-error');
    const okEl      = DOM.byId('recuperar-ok');
    const btnEnviar = DOM.byId('btn-enviar-recuperar');

    const _cerrar = () => {
      modal.hidden = true;
      emailEl.value = '';
      DOM.setText(errorEl, '');
      okEl.hidden = true;
    };

    DOM.byId('btn-cerrar-recuperar')?.addEventListener('click', _cerrar);
    DOM.byId('btn-cancelar-recuperar')?.addEventListener('click', _cerrar);
    modal?.addEventListener('click', e => { if (e.target === modal) _cerrar(); });

    btnEnviar?.addEventListener('click', async () => {
      const correo = emailEl?.value.trim();
      DOM.setText(errorEl, '');
      okEl.hidden = true;

      if (!correo) { DOM.setText(errorEl, 'Ingresa tu correo institucional'); return; }

      btnEnviar.textContent = 'Enviando…';
      btnEnviar.disabled    = true;

      try {
        const data = await Api.post('/auth/recuperar', { correo });
        okEl.textContent = data.mensaje || 'Si el correo está registrado, recibirás un enlace.';
        okEl.hidden      = false;
        emailEl.value    = '';
      } catch {
        DOM.setText(errorEl, 'Error al procesar la solicitud. Intenta de nuevo.');
      } finally {
        btnEnviar.textContent = 'Enviar enlace';
        btnEnviar.disabled    = false;
      }
    });

    // Abrir desde el botón del login
    DOM.qs('.btn-link')?.addEventListener('click', () => { modal.hidden = false; });
  };

  /* ══════════════════════════════════════════════
     MODAL PERFIL
  ══════════════════════════════════════════════ */
  const _initPerfil = (usuario) => {
    const modal   = DOM.byId('modal-perfil');
    const errorEl = DOM.byId('perfil-error');
    const okEl    = DOM.byId('perfil-ok');

    // Llenar datos del usuario
    const partes = usuario.nombre.split(' ');
    const iniciales = partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0][0];
    DOM.setText(DOM.byId('perfil-initials'), iniciales.toUpperCase());
    DOM.setText(DOM.byId('perfil-nombre'),   usuario.nombre);
    DOM.setText(DOM.byId('perfil-correo'),   usuario.correo);
    DOM.setText(DOM.byId('perfil-rol'),      usuario.rol);

    const _cerrar = () => {
      modal.hidden = true;
      DOM.byId('perfil-pass-actual').value  = '';
      DOM.byId('perfil-pass-nueva').value   = '';
      DOM.byId('perfil-pass-nueva2').value  = '';
      DOM.setText(errorEl, '');
      okEl.hidden = true;
    };

    DOM.byId('btn-cerrar-perfil')?.addEventListener('click',  _cerrar);
    DOM.byId('btn-cerrar-perfil2')?.addEventListener('click', _cerrar);
    modal?.addEventListener('click', e => { if (e.target === modal) _cerrar(); });

    DOM.byId('btn-guardar-perfil')?.addEventListener('click', async () => {
      DOM.setText(errorEl, '');
      okEl.hidden = true;

      const actual = DOM.byId('perfil-pass-actual')?.value;
      const nueva  = DOM.byId('perfil-pass-nueva')?.value;
      const nueva2 = DOM.byId('perfil-pass-nueva2')?.value;

      if (!actual || !nueva) { DOM.setText(errorEl, 'Completa todos los campos'); return; }
      if (nueva.length < 6)  { DOM.setText(errorEl, 'Mínimo 6 caracteres'); return; }
      if (nueva !== nueva2)  { DOM.setText(errorEl, 'Las contraseñas no coinciden'); return; }

      const btn = DOM.byId('btn-guardar-perfil');
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
          DOM.byId('perfil-pass-actual').value = '';
          DOM.byId('perfil-pass-nueva').value  = '';
          DOM.byId('perfil-pass-nueva2').value = '';
        } else {
          DOM.setText(errorEl, data.mensaje || 'Error al cambiar la contraseña');
        }
      } catch {
        DOM.setText(errorEl, 'Error de conexión. Intenta de nuevo.');
      } finally {
        btn.textContent = 'Guardar cambios';
        btn.disabled    = false;
      }
    });

    // Abrir modal al hacer clic en el avatar
    DOM.byId('btn-avatar')?.addEventListener('click', () => { modal.hidden = false; });
  };

  /* ── Logout compartido ── */
  const _logout = () => {
    clearInterval(_notifInterval);
    _notifInterval = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    DOM.byId('page-dashboard')?.classList.remove('active');
    DOM.byId('page-tutor')?.classList.remove('active');
    DOM.byId('page-admin')?.classList.remove('active');
    DOM.byId('page-login').classList.add('active');
    DOM.byId('login-email').value    = '';
    DOM.byId('login-password').value = '';
    _initializedTabs.clear();
    _initializedTutorTabs.clear();
  };

  /* ── Inicia el polling de notificaciones (cada 60 s) ── */
  const _startNotifPoll = () => {
    clearInterval(_notifInterval);
    _notifInterval = setInterval(() => Notificaciones.recargar(), 60000);
  };

  /* ══════════════════════════════════════════════
     DASHBOARD ESTUDIANTE
  ══════════════════════════════════════════════ */
  const _switchTab = (tabId) => {
    DOM.qsa('.tab-nav__btn').forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      DOM.toggleClass(btn, 'active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    DOM.qsa('.tab-panel').forEach((panel) => {
      const isActive = panel.id === `tab-${tabId}`;
      DOM.toggleClass(panel, 'active', isActive);
      panel.hidden = !isActive;
    });
    _initTab(tabId);
  };

  const _initTab = (tabId) => {
    if (_initializedTabs.has(tabId)) return;
    _initializedTabs.add(tabId);
    switch (tabId) {
      case 'inicio':      _initInicio();      break;
      case 'tutorias':    _initTutorias();    break;
      case 'calendario':  _initCalendario();  break;
      case 'cancelacion': _initCancelacion(); break;
    }
  };

  const _initInicio = () => {
    StepsComponent.render(DOM.byId('steps-grid'));
    DOM.byId('btn-scroll-steps')?.addEventListener('click', () =>
      DOM.byId('pasos-tutoria')?.scrollIntoView({ behavior: 'smooth' })
    );
    DOM.byId('btn-go-tutorias')?.addEventListener('click', () => _switchTab('tutorias'));
  };

  const _initTutorias = () => {
    const grid = DOM.byId('tutorias-grid');
    TutoriasComponent.render(grid);

    DOM.byId('filter-semestre')?.addEventListener('change', () =>
      TutoriasComponent.applyFilters(grid)
    );
    let _debounceTimer;
    DOM.byId('search-tutorias')?.addEventListener('input', () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => TutoriasComponent.applyFilters(grid), 250);
    });
    DOM.byId('btn-clear-filters')?.addEventListener('click', () =>
      TutoriasComponent.clearFilters(grid)
    );
  };

  const _initCalendario = () => {
    const grid    = DOM.byId('cal-grid');
    const titleEl = DOM.byId('cal-month-title');
    CalendarComponent.render(grid, titleEl);
    DOM.byId('cal-prev')?.addEventListener('click', () => CalendarComponent.navigate(-1, grid, titleEl));
    DOM.byId('cal-next')?.addEventListener('click', () => CalendarComponent.navigate(+1, grid, titleEl));
    AgendadasComponent.render(DOM.byId('agendadas-list'));
    AgendadasComponent.populateDayFilter(DOM.byId('cal-filter-day'));
    AgendadasComponent.renderChips(DOM.byId('cal-status-chips'));
  };

  const _initCancelacion = () => {
    InasistenciasComponent.updateAlertText(DOM.byId('cancelacion-alert-body'));
    InasistenciasComponent.render(DOM.byId('inasistencias-list'));
    SummaryComponent.render(DOM.byId('summary-grid'));
  };

  const _showEstudiante = (usuario) => {
    const page = DOM.byId('page-dashboard');
    page.classList.add('active');

    // Datos del usuario en el header
    const nameEl     = page.querySelector('.user-info__name');
    const initialsEl = page.querySelector('.user-avatar__initials');
    const rolEl      = page.querySelector('.user-info__program');
    if (nameEl) nameEl.textContent = usuario.nombre;
    if (initialsEl) {
      const parts = usuario.nombre.split(' ');
      initialsEl.textContent = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
    }
    if (rolEl) rolEl.textContent = 'Estudiante';

    // Notificaciones
    Notificaciones.recargar().then(() => {
      NotificacionesComponent.init({
        bellId:    'notif-bell-est',
        badgeId:   'notif-badge-est',
        panelId:   'notif-panel-est',
        listId:    'notif-list-est',
        markAllId: 'notif-mark-all-est',
      });
    });
    _startNotifPoll();

    // Tab de inicio
    _initTab('inicio');

    // Eventos de navegación
    DOM.qs('.tab-nav__inner')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-nav__btn');
      if (!btn) return;
      _switchTab(btn.dataset.tab);
    });

    DOM.byId('btn-logout')?.addEventListener('click', _logout);
  };

  /* ── Escapa caracteres HTML para evitar XSS en template literals ── */
  const _esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  /* ══════════════════════════════════════════════
     DASHBOARD TUTOR
  ══════════════════════════════════════════════ */
  const _switchTutorTab = (tabId) => {
    const nav = DOM.byId('tutor-tab-nav');
    nav?.querySelectorAll('.tab-nav__btn').forEach(btn => {
      const isActive = btn.dataset.tabTutor === tabId;
      DOM.toggleClass(btn, 'active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    document.querySelectorAll('#page-tutor .tab-panel').forEach(panel => {
      const isActive = panel.id === `tab-tutor-${tabId}`;
      DOM.toggleClass(panel, 'active', isActive);
      panel.hidden = !isActive;
    });
    _initTutorTab(tabId);
  };

  const _initTutorTab = (tabId) => {
    if (_initializedTutorTabs.has(tabId)) return;
    _initializedTutorTabs.add(tabId);
    switch (tabId) {
      case 'tutorias':    _initTutorTutorias();    break;
      case 'calendario':  _initTutorCalendario();  break;
      case 'historial':   _initTutorHistorial();   break;
      case 'estudiantes': _initTutorEstudiantes(); break;
    }
  };

  const _initTutorTutorias = () => {
    TutorComponent.render(
      DOM.byId('tutor-list'),
      DOM.byId('tutor-chips'),
      DOM.byId('tutor-stats')
    );
  };

  const _initTutorCalendario = () => {
    TutorCalendarioComponent.render(
      DOM.byId('tutor-cal-grid'),
      DOM.byId('tutor-cal-title'),
      DOM.byId('tutor-cal-sidebar')
    );
    DOM.byId('tutor-cal-prev')?.addEventListener('click', () => TutorCalendarioComponent.navigate(-1));
    DOM.byId('tutor-cal-next')?.addEventListener('click', () => TutorCalendarioComponent.navigate(+1));
  };

  const _initTutorHistorial = () => {
    const container = DOM.byId('tutor-historial-list');
    if (!container) return;

    const _renderHistorial = () => {
      const tutorias = TutorTutorias.getAll()
        .filter(t => t.estado === 'finalizada' || t.estado === 'cancelada')
        .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

      if (tutorias.length === 0) {
        container.innerHTML = `<div class="tutor-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <p>Aún no hay tutorías en el historial.</p>
        </div>`;
        return;
      }

      const ESTADO_COLOR = {
        finalizada: { bg: '#dbeafe', color: '#1e40af' },
        cancelada:  { bg: '#fee2e2', color: '#991b1b' },
      };

      container.innerHTML = tutorias.map(t => {
        const c     = ESTADO_COLOR[t.estado];
        const fecha = new Date(t.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        const sesionFecha = t.fechaTutoria
          ? `Sesión: <strong>${new Date(t.fechaTutoria).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>`
          : _esc(fecha);
        return `
          <div class="tutor-card">
            <div class="tutor-card__header">
              <div>
                <div class="tutor-card__subject">${_esc(t.materia)}</div>
                <div class="tutor-card__student">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ${_esc(t.nombreEstudiante)}
                </div>
              </div>
              <span style="background:${c.bg};color:${c.color};padding:3px 12px;border-radius:999px;font-size:.78rem;font-weight:700;">${_esc(t.estado.charAt(0).toUpperCase() + t.estado.slice(1))}</span>
            </div>
            <div class="tutor-card__meta">
              <span>📅 ${_esc(t.horario)}</span>
              <span>🚪 Aula ${_esc(t.aula)}</span>
              <span>📚 Sem. ${_esc(t.semestre)}</span>
              <span>🗓 ${sesionFecha}</span>
            </div>
            ${t.motivoCancelacion ? `<div class="tutor-card__motivo">⚠️ Motivo: ${_esc(t.motivoCancelacion)}</div>` : ''}
            ${t.reasignadaDe ? `<div class="tutor-card__tag tutor-card__tag--reasignada">🔄 Reasignación automática</div>` : ''}
          </div>`;
      }).join('');
    };

    _renderHistorial();
    TutorTutorias.onUpdate(_renderHistorial);
  };

  const _initTutorEstudiantes = () => {
    TutorEstudiantesComponent.render(
      DOM.byId('tutor-estudiantes-list'),
      DOM.byId('est-stats')
    );
    DOM.byId('btn-descargar-reporte')?.addEventListener('click', () =>
      TutorEstudiantesComponent.descargarCSV()
    );
  };

  const _showTutor = (usuario) => {
    const page = DOM.byId('page-tutor');
    page.classList.add('active');

    const nameEl     = DOM.byId('tutor-name');
    const initialsEl = DOM.byId('tutor-initials');
    const rolEl      = DOM.byId('tutor-rol');
    if (nameEl) nameEl.textContent = usuario.nombre;
    if (initialsEl) {
      const parts = usuario.nombre.split(' ');
      initialsEl.textContent = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
    }
    if (rolEl) rolEl.textContent = 'Tutor';

    Notificaciones.recargar().then(() => {
      NotificacionesComponent.init({
        bellId:    'notif-bell-tut',
        badgeId:   'notif-badge-tut',
        panelId:   'notif-panel-tut',
        listId:    'notif-list-tut',
        markAllId: 'notif-mark-all-tut',
      });
    });
    _startNotifPoll();

    _initTutorTab('tutorias');

    DOM.byId('tutor-tab-nav')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-nav__btn');
      if (!btn) return;
      _switchTutorTab(btn.dataset.tabTutor);
    });

    DOM.byId('btn-logout-tutor')?.addEventListener('click', _logout);
    DOM.byId('btn-avatar-tutor')?.addEventListener('click', () => { DOM.byId('modal-perfil').hidden = false; });
  };

  /* ══════════════════════════════════════════════
     DASHBOARD ADMIN
  ══════════════════════════════════════════════ */
  const _showAdmin = (usuario) => {
    DOM.byId('page-admin')?.classList.add('active');
    AdminComponent.init(usuario, _logout);
  };

  /* ══════════════════════════════════════════════
     ROUTING POR ROL
  ══════════════════════════════════════════════ */
  const _showDashboard = (usuario) => {
    DOM.byId('page-login')?.classList.remove('active');
    if (usuario.rol === 'admin') {
      _showAdmin(usuario);
    } else if (usuario.rol === 'tutor') {
      _showTutor(usuario);
    } else {
      _showEstudiante(usuario);
    }
  };

  /* ══════════════════════════════════════════════
     BOOT — LOGIN
  ══════════════════════════════════════════════ */
  const _boot = () => {
    DOM.byId('form-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo   = DOM.byId('login-email')?.value.trim();
      const password = DOM.byId('login-password')?.value;
      const btn      = e.target.querySelector('button[type="submit"]');

      _clearFieldError('login-email',    'error-email');
      _clearFieldError('login-password', 'error-password');

      if (!correo)   { _showFieldError('login-email',    'error-email',    'El correo es obligatorio');   return; }
      if (!password) { _showFieldError('login-password', 'error-password', 'La contraseña es obligatoria'); return; }

      if (btn) { btn.textContent = 'Iniciando…'; btn.disabled = true; }

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');
        localStorage.setItem('token',   data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        _initPerfil(data.usuario);
        _showDashboard(data.usuario);
      } catch (error) {
        _showFieldError('login-password', 'error-password', error.message);
      } finally {
        if (btn) { btn.textContent = 'Iniciar sesión'; btn.disabled = false; }
      }
    });

    DOM.byId('login-email')?.addEventListener('input',    () => _clearFieldError('login-email',    'error-email'));
    DOM.byId('login-password')?.addEventListener('input', () => _clearFieldError('login-password', 'error-password'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _boot(); _initRecuperar(); });
  } else {
    _boot(); _initRecuperar();
  }
})();
