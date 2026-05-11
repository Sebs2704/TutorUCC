/**
 * AgendadasComponent.js
 * Sidebar del calendario: tutorías + filtro por día de semana + chips de estado
 */

const AgendadasComponent = (() => {

  const _tarjetaHTML = (t) => {
    const fechaStr = t.fechaTutoria
      ? new Date(t.fechaTutoria).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
      : null;
    return `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;background:#fff;">
        <div style="font-weight:700;font-size:.875rem;color:#1f2937;margin-bottom:3px;">${t.materia}</div>
        <div style="font-size:.8rem;color:#6b7280;margin-bottom:2px;">${t.tutor}</div>
        <div style="font-size:.78rem;color:#9ca3af;margin-bottom:6px;">
          ${t.horario} · Aula ${t.aula}
          ${fechaStr ? `<br><strong style="color:#0d8f95;">📆 ${fechaStr}</strong>` : ''}
        </div>
        ${MisTutorias.badgeHTML(t.estado)}
      </div>`;
  };

  const render = (container) => {
    if (!container) return;
    const tutorias = MisTutorias.getAll().filter(t => t.estado !== 'cancelada');
    if (tutorias.length === 0) {
      container.innerHTML = `<p style="color:#9ca3af;font-size:.875rem;
        text-align:center;padding:16px 0;">No tienes tutorías agendadas aún.</p>`;
      return;
    }
    container.innerHTML = tutorias.map(_tarjetaHTML).join('');
  };

  // Filtro por día de la semana
  const populateDayFilter = (select) => {
    if (!select) return;

    // Limpiar opciones anteriores salvo la primera
    while (select.options.length > 1) select.remove(1);

    // Días de la semana — value = getDay() de JS (0=Dom, 1=Lun...)
    const dias = [
      { value: '1', label: 'Lunes'     },
      { value: '2', label: 'Martes'    },
      { value: '3', label: 'Miércoles' },
      { value: '4', label: 'Jueves'    },
      { value: '5', label: 'Viernes'   },
      { value: '6', label: 'Sábado'    },
      { value: '0', label: 'Domingo'   },
    ];

    dias.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.value;
      opt.textContent = d.label;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      CalendarComponent.filtrarPorDiaSemana(select.value);
    });
  };

  // Chips de estado
  const renderChips = (container) => {
    if (!container) return;
    const opciones = [
      { estado: '',           label: 'Todas',       bg: '#e5e7eb', color: '#374151' },
      { estado: 'pendiente',  label: 'Pendientes',  ...MisTutorias.ESTADO_COLOR.pendiente  },
      { estado: 'confirmada', label: 'Confirmadas', ...MisTutorias.ESTADO_COLOR.confirmada },
      { estado: 'finalizada', label: 'Finalizadas', ...MisTutorias.ESTADO_COLOR.finalizada },
    ];

    container.innerHTML = opciones.map(o => `
      <span class="chip" data-estado="${o.estado}"
        style="background:${o.bg};color:${o.color};padding:4px 12px;border-radius:999px;
        font-size:.78rem;font-weight:600;cursor:pointer;transition:opacity .2s;opacity:${o.estado === '' ? '1' : '0.6'};">
        ${o.label}
      </span>`).join('');

    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip').forEach(c => c.style.opacity = '0.6');
        chip.style.opacity = '1';
        // Resetear el select de día al filtrar por estado
        const sel = document.getElementById('cal-filter-day');
        if (sel) sel.value = '';
        CalendarComponent.filtrarPorEstado(chip.dataset.estado);
      });
    });
  };

  MisTutorias.onUpdate(() => {
    const container = document.getElementById('agendadas-list');
    const select    = document.getElementById('cal-filter-day');
    if (container) render(container);
    if (select && select.options.length <= 1) populateDayFilter(select);
  });

  return { render, populateDayFilter, renderChips };
})();
