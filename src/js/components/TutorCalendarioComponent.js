/**
 * TutorCalendarioComponent.js
 * Calendario del tutor: marca días con tutorías pendientes/confirmadas.
 */

const TutorCalendarioComponent = (() => {
  const NOW  = new Date();
  let _year  = NOW.getFullYear();
  let _month = NOW.getMonth();

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_NAMES   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const JS_TO_COL   = { 0:6, 1:0, 2:1, 3:2, 4:3, 5:4, 6:5 };

  const DIAS_HORARIO = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
    'Viernes': 5, 'Sábado': 6, 'Domingo': 0
  };

  let _selectedCell = null;
  let _grid = null;
  let _titleEl = null;
  let _sidebarEl = null;

  const _diaJS = (horario) => {
    if (!horario) return -1;
    for (const [nombre, num] of Object.entries(DIAS_HORARIO)) {
      if (horario.startsWith(nombre)) return num;
    }
    return -1;
  };

  const _proximaFecha = (diaJS) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let diff = diaJS - hoy.getDay();
    if (diff < 0) diff += 7;
    const f = new Date(hoy);
    f.setDate(hoy.getDate() + diff);
    return f;
  };

  const _getDiasConTutoria = () => {
    const dias = new Set();
    TutorTutorias.getAll()
      .filter(t => (t.estado === 'pendiente' || t.estado === 'confirmada') && t.fechaTutoria)
      .forEach(t => {
        const fecha = new Date(t.fechaTutoria);
        if (fecha.getFullYear() === _year && fecha.getMonth() === _month)
          dias.add(fecha.getDate());
      });
    return dias;
  };

  const _renderSidebar = (tutorias, emptyMsg) => {
    if (!_sidebarEl) return;
    if (tutorias.length === 0) {
      _sidebarEl.innerHTML = `<p class="tutor-cal__empty">${emptyMsg || 'Sin tutorías este día.'}</p>`;
      return;
    }
    const ESTADO_COLOR = {
      pendiente:  { bg: '#fef3c7', color: '#92400e' },
      confirmada: { bg: '#d1fae5', color: '#065f46' },
    };
    _sidebarEl.innerHTML = tutorias.map(t => {
      const c = ESTADO_COLOR[t.estado] || { bg: '#f3f4f6', color: '#374151' };
      return `
        <div class="tutor-cal__card">
          <div class="tutor-cal__card-top">
            <span class="tutor-cal__card-subject">${t.materia}</span>
            <span style="background:${c.bg};color:${c.color};padding:2px 9px;border-radius:999px;font-size:.74rem;font-weight:700;">${t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}</span>
          </div>
          <div class="tutor-cal__card-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${t.nombreEstudiante}
          </div>
          <div class="tutor-cal__card-meta">🕐 ${t.horario} · 🚪 Aula ${t.aula}</div>
        </div>`;
    }).join('');
  };

  const render = (grid, titleEl, sidebarEl) => {
    _grid      = grid;
    _titleEl   = titleEl;
    _sidebarEl = sidebarEl;
    if (!grid || !titleEl) return;
    _selectedCell = null;

    titleEl.textContent = `${MONTH_NAMES[_month]} ${_year}`;

    const today       = new Date();
    const isThisMonth = today.getFullYear() === _year && today.getMonth() === _month;
    const todayDay    = isThisMonth ? today.getDate() : -1;
    const diasConTut  = _getDiasConTutoria();

    let html = DAY_NAMES.map(d => `<div class="cal-grid__dow">${d}</div>`).join('');
    const firstJs = new Date(_year, _month, 1).getDay();
    html += `<div class="cal-grid__empty"></div>`.repeat(JS_TO_COL[firstJs]);

    const daysInMonth = new Date(_year, _month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday  = d === todayDay;
      const hasEvent = diasConTut.has(d);
      const classes  = ['cal-grid__day',
        isToday  ? 'cal-grid__day--today' : '',
        hasEvent ? 'cal-grid__day--event' : '',
      ].filter(Boolean).join(' ');
      html += `<div class="${classes}" role="gridcell" data-day="${d}">
        ${d}${hasEvent ? '<span class="cal-grid__dot"></span>' : ''}
      </div>`;
    }

    grid.innerHTML = html;

    const todayCell = grid.querySelector('.cal-grid__day--today');
    grid.querySelectorAll('.cal-grid__day').forEach(cell => {
      cell.addEventListener('click', () => {
        if (_selectedCell) _selectedCell.classList.remove('cal-grid__day--selected');
        cell.classList.add('cal-grid__day--selected');
        _selectedCell = cell;
        if (todayCell) todayCell.classList.toggle('cal-grid__day--dimmed', cell !== todayCell);
        _filtrarPorDia(parseInt(cell.dataset.day, 10));
      });
    });

    _renderSidebar(
      TutorTutorias.getAll().filter(t => t.estado === 'pendiente' || t.estado === 'confirmada'),
      'No hay tutorías activas este mes.'
    );
  };

  const _filtrarPorDia = (dia) => {
    const tutorias = TutorTutorias.getAll().filter(t => {
      if ((t.estado !== 'pendiente' && t.estado !== 'confirmada') || !t.fechaTutoria) return false;
      const fecha = new Date(t.fechaTutoria);
      return fecha.getFullYear() === _year &&
             fecha.getMonth()    === _month &&
             fecha.getDate()     === dia;
    });
    _renderSidebar(tutorias, `Sin tutorías el ${dia} de ${MONTH_NAMES[_month]}.`);
  };

  const navigate = (dir) => {
    _month += dir;
    if (_month > 11) { _month = 0;  _year++; }
    if (_month < 0)  { _month = 11; _year--; }
    render(_grid, _titleEl, _sidebarEl);
  };

  TutorTutorias.onUpdate(() => {
    if (_grid && _titleEl) render(_grid, _titleEl, _sidebarEl);
  });

  return { render, navigate };
})();
