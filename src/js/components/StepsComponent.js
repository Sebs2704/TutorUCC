/**
 * components/StepsComponent.js
 * Renders the 4 "how-to" step cards on the Inicio tab.
 */

const StepsComponent = (() => {
  const STEPS = [
    {
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
      title: 'Busca tu tutoría',
      desc:  'Explora las tutorías disponibles por materia, semestre o tutor. Usa los filtros para encontrar la que necesitas.',
    },
    {
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      title: 'Agenda tu horario',
      desc:  'Selecciona el día y la hora que mejor se ajuste a tu disponibilidad. Verifica los cupos disponibles.',
    },
    {
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      title: 'Confirma tu asistencia',
      desc:  'Recibe la confirmación de tu tutoría y agrégala a tu calendario. ¡No olvides asistir!',
    },
    {
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      title: 'Aprende y mejora',
      desc:  'Asiste a tu tutoría, resuelve tus dudas y mejora tu rendimiento académico. ¡Tú puedes!',
    },
  ];

  /**
   * Render step cards into the given container element.
   * @param {HTMLElement} container
   */
  const render = (container) => {
    if (!container) return;

    const html = STEPS.map((step, i) => `
      <div class="step-card">
        <div class="step-card__icon">${step.icon}</div>
        <p class="step-card__num">PASO ${i + 1}</p>
        <h3 class="step-card__title">${step.title}</h3>
        <p class="step-card__desc">${step.desc}</p>
      </div>
    `).join('');

    DOM.setHTML(container, html);
  };

  return { render };
})();
