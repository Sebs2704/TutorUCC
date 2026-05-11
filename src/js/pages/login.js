/**
 * pages/login.js — Login + modal de recuperar contraseña.
 */
(() => {
  'use strict';

  // Si ya hay sesión activa, redirigir directo al dashboard correspondiente
  const _tok = sessionStorage.getItem('token');
  const _usr = JSON.parse(sessionStorage.getItem('usuario') || 'null');
  if (_tok && _usr) {
    const dest = { admin: 'admin.html', tutor: 'tutor.html' };
    window.location.replace(dest[_usr.rol] || 'estudiante.html');
  }

  const _showErr = (inputId, errId, msg) => {
    document.getElementById(inputId)?.classList.add('form-input--error');
    document.getElementById(inputId)?.setAttribute('aria-invalid', 'true');
    const e = document.getElementById(errId);
    if (e) e.textContent = msg;
  };

  const _clearErr = (inputId, errId) => {
    document.getElementById(inputId)?.classList.remove('form-input--error');
    document.getElementById(inputId)?.removeAttribute('aria-invalid');
    const e = document.getElementById(errId);
    if (e) e.textContent = '';
  };

  /* ── Formulario de login ── */
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo   = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const btn      = e.target.querySelector('button[type="submit"]');

    _clearErr('login-email',    'error-email');
    _clearErr('login-password', 'error-password');

    if (!correo)   { _showErr('login-email',    'error-email',    'El correo es obligatorio');    return; }
    if (!password) { _showErr('login-password', 'error-password', 'La contraseña es obligatoria'); return; }

    btn.textContent = 'Iniciando…';
    btn.disabled    = true;

    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');

      sessionStorage.setItem('token',   data.token);
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

      const dest = { admin: 'admin.html', tutor: 'tutor.html' };
      window.location.href = dest[data.usuario.rol] || 'estudiante.html';
    } catch (err) {
      _showErr('login-password', 'error-password', err.message);
    } finally {
      btn.textContent = 'Iniciar sesión';
      btn.disabled    = false;
    }
  });

  document.getElementById('login-email')?.addEventListener('input',
    () => _clearErr('login-email',    'error-email'));
  document.getElementById('login-password')?.addEventListener('input',
    () => _clearErr('login-password', 'error-password'));

  /* ── Modal: Recuperar contraseña ── */
  const _modal = document.getElementById('modal-recuperar');

  const _cerrar = () => {
    if (_modal) _modal.hidden = true;
    const em  = document.getElementById('recuperar-email');
    const err = document.getElementById('recuperar-error');
    const ok  = document.getElementById('recuperar-ok');
    if (em)  em.value        = '';
    if (err) err.textContent = '';
    if (ok)  ok.hidden       = true;
  };

  document.querySelector('.btn-link')?.addEventListener('click', () => {
    if (_modal) _modal.hidden = false;
  });
  document.getElementById('btn-cerrar-recuperar')?.addEventListener('click',   _cerrar);
  document.getElementById('btn-cancelar-recuperar')?.addEventListener('click', _cerrar);
  _modal?.addEventListener('click', e => { if (e.target === _modal) _cerrar(); });

  document.getElementById('btn-enviar-recuperar')?.addEventListener('click', async () => {
    const correo  = document.getElementById('recuperar-email')?.value.trim();
    const errorEl = document.getElementById('recuperar-error');
    const okEl    = document.getElementById('recuperar-ok');
    const btn     = document.getElementById('btn-enviar-recuperar');

    if (errorEl) errorEl.textContent = '';
    if (okEl)    okEl.hidden         = true;
    if (!correo) { if (errorEl) errorEl.textContent = 'Ingresa tu correo institucional'; return; }

    btn.textContent = 'Enviando…';
    btn.disabled    = true;

    try {
      const res  = await fetch(`${CONFIG.API_URL}/auth/recuperar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo }),
      });
      const data = await res.json();
      if (okEl) { okEl.textContent = data.mensaje; okEl.hidden = false; }
      const em = document.getElementById('recuperar-email');
      if (em)  em.value = '';
    } catch {
      if (errorEl) errorEl.textContent = 'Error al procesar la solicitud. Intenta de nuevo.';
    } finally {
      btn.textContent = 'Enviar enlace';
      btn.disabled    = false;
    }
  });
})();
