/**
 * NotificacionesComponent.js
 * Campana de notificaciones con panel desplegable.
 * Uso: NotificacionesComponent.init({ bellId, badgeId, panelId, listId, markAllId })
 */

const NotificacionesComponent = (() => {

  const TIPO_ICON = {
    confirmacion:     '✅',
    cancelacion_tutor:'❌',
    reasignacion:     '🔄',
    nueva_tutoria:    '📬',
  };

  const _formatFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const _actualizarUI = ({ badgeId, listId }) => {
    const badge = document.getElementById(badgeId);
    const list  = document.getElementById(listId);
    if (!badge || !list) return;

    const noLeidas = Notificaciones.getNoLeidas();
    badge.textContent   = noLeidas.length;
    badge.style.display = noLeidas.length > 0 ? 'flex' : 'none';

    const todas = Notificaciones.getAll();
    if (todas.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:24px 0;font-size:.875rem;">Sin notificaciones aún</p>';
      return;
    }

    list.innerHTML = todas.map(n => `
      <div class="notif-item ${n.leida ? '' : 'notif-item--unread'}" data-id="${n._id}">
        <span class="notif-item__icon">${TIPO_ICON[n.tipo] || '🔔'}</span>
        <div class="notif-item__body">
          <p class="notif-item__msg">${n.mensaje}</p>
          <span class="notif-item__date">${_formatFecha(n.creadoEn)}</span>
        </div>
      </div>`).join('');

    list.querySelectorAll('.notif-item--unread').forEach(el => {
      el.addEventListener('click', () => Notificaciones.marcarLeida(el.dataset.id));
    });
  };

  const init = ({ bellId, badgeId, panelId, listId, markAllId }) => {
    const bell   = document.getElementById(bellId);
    const panel  = document.getElementById(panelId);
    const markAll = document.getElementById(markAllId);
    if (!bell || !panel) return;

    // Registrar listener de actualización
    Notificaciones.onUpdate(() => _actualizarUI({ badgeId, listId }));
    _actualizarUI({ badgeId, listId });

    // Toggle panel
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.toggle('notif-panel--open');
      if (isOpen) _actualizarUI({ badgeId, listId });
    });

    // Cerrar al click fuera
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== bell) {
        panel.classList.remove('notif-panel--open');
      }
    });

    // Marcar todas leídas
    markAll?.addEventListener('click', () => Notificaciones.marcarTodasLeidas());
  };

  return { init };
})();
