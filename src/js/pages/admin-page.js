/**
 * pages/admin-page.js — Inicialización del panel de administrador.
 */
(() => {
  'use strict';
  AdminComponent.init(AuthGuard.usuario, AuthGuard.logout);
})();
