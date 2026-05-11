/**
 * SummaryComponent.js — Resumen estadístico de tutorías del estudiante
 */

const SummaryComponent = (() => {

  const render = (container) => {
    if (!container) return;

    const all        = MisTutorias.getAll();
    const pendiente  = all.filter(t => t.estado === 'pendiente').length;
    const confirmada = all.filter(t => t.estado === 'confirmada').length;
    const finalizada = all.filter(t => t.estado === 'finalizada').length;
    const cancelada  = all.filter(t => t.estado === 'cancelada').length;

    const items = [
      { label: 'Total agendadas',  valor: all.length,    color: '#3b82f6' },
      { label: 'Pendientes',       valor: pendiente,     color: '#f59e0b' },
      { label: 'Confirmadas',      valor: confirmada,    color: '#10b981' },
      { label: 'Finalizadas',      valor: finalizada,    color: '#6366f1' },
      { label: 'Canceladas',       valor: cancelada,     color: '#ef4444' },
    ];

    container.innerHTML = items.map(i => `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:${i.color};">${i.valor}</div>
        <div style="font-size:.85rem;color:#6b7280;margin-top:4px;">${i.label}</div>
      </div>`).join('');
  };

  MisTutorias.onUpdate(() => {
    const container = document.getElementById('summary-grid');
    if (container) render(container);
  });

  return { render };
})();
