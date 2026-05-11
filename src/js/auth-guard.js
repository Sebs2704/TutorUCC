/**
 * auth-guard.js — Protección de páginas privadas.
 * Cargado en <head> SIN defer: redirige antes de renderizar si no hay sesión.
 */
(function () {
  'use strict';

  var token   = sessionStorage.getItem('token');
  var usuario = null;

  try { usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null'); } catch (_) {}

  if (!token || !usuario) {
    window.location.replace('index.html');
    return;
  }

  // Verificar que el rol coincida con la página actual
  var _pagina = window.location.pathname.split('/').pop() || 'index.html';
  var _ROL_PAGINA = {
    'estudiante.html': 'estudiante',
    'tutor.html':      'tutor',
    'admin.html':      'admin',
  };
  var _rolEsperado = _ROL_PAGINA[_pagina];

  if (_rolEsperado && usuario.rol !== _rolEsperado) {
    var _dest = { admin: 'admin.html', tutor: 'tutor.html', estudiante: 'estudiante.html' };
    window.location.replace(_dest[usuario.rol] || 'index.html');
    return;
  }

  var logout = function () {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.href = 'index.html';
  };

  window.AuthGuard = Object.freeze({ usuario: usuario, logout: logout });
})();
