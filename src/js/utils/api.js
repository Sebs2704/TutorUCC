/**
 * api.js — Cliente HTTP centralizado para TutorUCC.
 * Todas las llamadas al backend pasan por aquí:
 *   - Token JWT inyectado automáticamente
 *   - Timeout de 10 s con AbortController
 *   - Errores de red devuelven { mensaje: '...' } en lugar de lanzar
 */
const Api = (() => {
  'use strict';

  const BASE    = CONFIG.API_URL;
  const TIMEOUT = 10_000;

  const token = () => sessionStorage.getItem('token');

  const _headers = (json = true) => {
    const h = { Authorization: `Bearer ${token()}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  };

  const _req = async (url, opts = {}) => {
    const ac    = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { ...opts, signal: ac.signal });
      clearTimeout(timer);
      return r.json();
    } catch (e) {
      clearTimeout(timer);
      return { mensaje: e.name === 'AbortError' ? 'Tiempo de espera agotado. Verifica tu conexión.' : 'Error de conexión con el servidor.' };
    }
  };

  const get   = (path)       => _req(`${BASE}${path}`, { headers: _headers(false) });
  const post  = (path, body) => _req(`${BASE}${path}`, { method: 'POST',   headers: _headers(), body: JSON.stringify(body) });
  const put   = (path, body) => _req(`${BASE}${path}`, { method: 'PUT',    headers: _headers(), body: JSON.stringify(body) });
  const patch = (path, body) => _req(`${BASE}${path}`, { method: 'PATCH',  headers: _headers(), body: JSON.stringify(body) });
  const del   = (path)       => _req(`${BASE}${path}`, { method: 'DELETE', headers: _headers(false) });

  return { token, get, post, put, patch, del };
})();
