/**
 * CalendarComponent.js
 * - Fecha real dinámica
 * - Días marcados desde tutorías reales
 * - Click en día: resalta UN solo día y filtra sidebar
 * - Filtro por día de la semana (Lunes, Martes, etc.)
 * - Chips de estado
 */

const CalendarComponent = (() => {
  const NOW   = new Date();
  let _year   = NOW.getFullYear();
  let _month  = NOW.getMonth();

  const MONTH_NAMES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                        'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_NAMES    = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  // 0=Dom,1=Lun,...6=Sáb en JS → los convertimos a índice 0=Lun
  const JS_TO_COL    = { 0:6, 1:0, 2:1, 3:2, 4:3, 5:4, 6:5 };

  let _selectedCell = null; // referencia a celda seleccionada

  // Mapea el nombre del día (inicio del campo horario) al número JS (0=Dom,1=Lun...)
  const DIAS_HORARIO = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
    'Viernes': 5, 'Sábado': 6, 'Domingo': 0
  };

  const _diaJSDeHorario = (horario) => {
    if (!horario) return -1;
    for (const [nombre, num] of Object.entries(DIAS_HORARIO)) {
      if (horario.startsWith(nombre)) return num;
    }
    return -1;
  };

  // Calcula la próxima fecha (Date) para un día de semana JS dado
  const _proximaFecha = (diaJS) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let diff = diaJS - hoy.getDay();
    if (diff < 0) diff += 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diff);
    return fecha;
  };

  // Días del mes actual que tienen tutoría (usa fechaTutoria real de la BD)
  const _getDiasConTutoria = () => {
    const dias = new Set();
    MisTutorias.getAll()
      .filter(t => t.estado !== 'cancelada' && t.fechaTutoria)
      .forEach(t => {
        const fecha = new Date(t.fechaTutoria);
        if (fecha.getUTCFullYear() === _year && fecha.getUTCMonth() === _month)
          dias.add(fecha.getUTCDate());
      });
    return dias;
  };

  const render = (grid, titleEl) => {
    if (!grid || !titleEl) return;
    _selectedCell = null;

    titleEl.textContent = `${MONTH_NAMES[_month]} ${_year}`;

    const today       = new Date();
    const isThisMonth = today.getFullYear() === _year && today.getMonth() === _month;
    const todayDay    = isThisMonth ? today.getDate() : -1;
    const diasConTut  = _getDiasConTutoria();

    // Cabecera
    let html = DAY_NAMES.map(d =>
      `<div class="cal-grid__dow" aria-hidden="true">${d}</div>`
    ).join('');

    // Offset inicial
    const firstJs    = new Date(_year, _month, 1).getDay();
    const offset     = JS_TO_COL[firstJs];
    html += `<div class="cal-grid__empty"></div>`.repeat(offset);

    // Días
    const daysInMonth = new Date(_year, _month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday  = d === todayDay;
      const hasEvent = diasConTut.has(d);
      const classes  = ['cal-grid__day',
        isToday  ? 'cal-grid__day--today'  : '',
        hasEvent ? 'cal-grid__day--event'  : '',
      ].filter(Boolean).join(' ');

      html += `<div class="${classes}" role="gridcell"
        aria-label="${isToday ? d + ' (hoy)' : d}" data-day="${d}">
        ${d}${hasEvent ? '<span class="cal-grid__dot"></span>' : ''}
      </div>`;
    }

    DOM.setHTML(grid, html);

    // Click en día → resaltar solo ese y filtrar sidebar
    const todayCell = grid.querySelector('.cal-grid__day--today');
    grid.querySelectorAll('.cal-grid__day').forEach(cell => {
      cell.addEventListener('click', () => {
        // Quitar selección previa
        if (_selectedCell) _selectedCell.classList.remove('cal-grid__day--selected');
        cell.classList.add('cal-grid__day--selected');
        _selectedCell = cell;
        // Difuminar el día actual si se seleccionó otro día
        if (todayCell) {
          if (cell === todayCell) {
            todayCell.classList.remove('cal-grid__day--dimmed');
          } else {
            todayCell.classList.add('cal-grid__day--dimmed');
          }
        }
        _filtrarPorDiaDelMes(parseInt(cell.dataset.day));
      });
    });
  };

  // Filtra sidebar por día numérico del mes (usa fechaTutoria real)
  const _filtrarPorDiaDelMes = (dia) => {
    const container = document.getElementById('agendadas-list');
    if (!container) return;

    const tutorias = MisTutorias.getAll().filter(t => {
      if (t.estado === 'cancelada' || !t.fechaTutoria) return false;
      const fecha = new Date(t.fechaTutoria);
      return fecha.getUTCFullYear() === _year &&
             fecha.getUTCMonth()    === _month &&
             fecha.getUTCDate()     === dia;
    });

    _renderSidebar(container, tutorias,
      tutorias.length === 0
        ? `Sin tutorías el ${dia} de ${MONTH_NAMES[_month]}.`
        : null);
  };

  const _renderSidebar = (container, tutorias, emptyMsg) => {
    if (tutorias.length === 0) {
      container.innerHTML = `<p style="color:#9ca3af;font-size:.85rem;
        text-align:center;padding:16px 0;">${emptyMsg || 'Sin tutorías.'}</p>`;
      return;
    }
    container.innerHTML = tutorias.map(_tarjetaHTML).join('');
  };

  const _tarjetaHTML = (t) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;
        margin-bottom:8px;background:#fff;">
      <div style="font-weight:700;font-size:.875rem;color:#1f2937;margin-bottom:3px;">
        ${t.materia}</div>
      <div style="font-size:.8rem;color:#6b7280;margin-bottom:2px;">${t.tutor}</div>
      <div style="font-size:.78rem;color:#9ca3af;margin-bottom:6px;">
        ${t.horario} · Aula ${t.aula}</div>
      ${MisTutorias.badgeHTML(t.estado)}
    </div>`;

  const navigate = (direction, grid, titleEl) => {
    _month += direction;
    if (_month > 11) { _month = 0;  _year++; }
    if (_month < 0)  { _month = 11; _year--; }
    render(grid, titleEl);
    // Restaurar sidebar al navegar
    const container = document.getElementById('agendadas-list');
    if (container) AgendadasComponent.render(container);
  };

  // Filtrar sidebar por estado (desde chips)
  const filtrarPorEstado = (estado) => {
    const container = document.getElementById('agendadas-list');
    if (!container) return;
    // Quitar selección del calendario al filtrar por estado
    if (_selectedCell) {
      _selectedCell.classList.remove('cal-grid__day--selected');
      _selectedCell = null;
    }
    const tutorias = estado
      ? MisTutorias.getAll().filter(t => t.estado === estado)
      : MisTutorias.getAll().filter(t => t.estado !== 'cancelada');
    _renderSidebar(container, tutorias,
      `Sin tutorías con estado "${MisTutorias.ESTADO_LABEL[estado] || estado}".`);
  };

  // Filtrar sidebar por día de la semana (usa fechaTutoria real)
  const filtrarPorDiaSemana = (diaSemanaJS) => {
    const container = document.getElementById('agendadas-list');
    if (!container) return;
    if (_selectedCell) {
      _selectedCell.classList.remove('cal-grid__day--selected');
      _selectedCell = null;
    }
    if (diaSemanaJS === '') {
      AgendadasComponent.render(container);
      return;
    }
    const ds = parseInt(diaSemanaJS, 10);
    const tutorias = MisTutorias.getAll().filter(t => {
      if (t.estado === 'cancelada' || !t.fechaTutoria) return false;
      return new Date(t.fechaTutoria).getDay() === ds;
    });
    const nombres = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    _renderSidebar(container, tutorias,
      `Sin tutorías los ${nombres[ds]}.`);
  };

  MisTutorias.onUpdate(() => {
    const grid    = document.getElementById('cal-grid');
    const titleEl = document.getElementById('cal-month-title');
    if (grid && titleEl) render(grid, titleEl);
  });

  return { render, navigate, filtrarPorEstado, filtrarPorDiaSemana };
})();
