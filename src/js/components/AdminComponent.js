/**
 * AdminComponent.js
 * Panel de administración — toda consulta, filtro y CRUD va directo a MongoDB via API.
 * No hay filtros en memoria. Cada búsqueda dispara un request al servidor.
 */
const AdminComponent = (() => {
  'use strict';

  /* ── Helpers HTTP — delegados al módulo Api centralizado ── */
  const _get  = (path)       => Api.get(path);
  const _post = (path, body) => Api.post(path, body);
  const _put  = (path, body) => Api.put(path, body);
  const _del  = (path)       => Api.del(path);

  /* ── Debounce para inputs de búsqueda ── */
  const _debounce = (fn, ms = 320) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /* ── Modal genérico ── */
  const _openModal = ({ title, fields, data = {}, onSave, onDelete }) => {
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';

    const fieldsHtml = fields.map(f => {
      const val = data[f.key] ?? '';
      if (f.type === 'select') {
        const opts = f.options.map(o =>
          `<option value="${o.value}" ${String(o.value) === String(val) ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        return `<div class="admin-form-group">
          <label for="mf-${f.key}">${f.label}${f.required ? ' *' : ''}</label>
          <select id="mf-${f.key}">${f.required ? '' : '<option value="">— Seleccionar —</option>'}${opts}</select>
          ${f.hint ? `<small>${f.hint}</small>` : ''}
        </div>`;
      }
      return `<div class="admin-form-group">
        <label for="mf-${f.key}">${f.label}${f.required ? ' *' : ''}</label>
        <input id="mf-${f.key}" type="${f.type || 'text'}"
          value="${f.type === 'password' ? '' : val.toString().replace(/"/g, '&quot;')}"
          placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
        ${f.hint ? `<small>${f.hint}</small>` : ''}
      </div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true">
        <div class="admin-modal__header">
          <span class="admin-modal__title">${title}</span>
          <button type="button" class="admin-modal__close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="admin-modal__body">${fieldsHtml}</div>
        <div class="admin-modal__footer">
          ${onDelete ? `<button type="button" class="admin-modal__btn-del" id="m-del">Eliminar</button>` : ''}
          <span class="admin-modal__msg" id="m-msg"></span>
          <button type="button" class="admin-modal__btn-cancel" id="m-cancel">Cancelar</button>
          <button type="button" class="admin-modal__btn-save" id="m-save">Guardar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();

    overlay.querySelector('.admin-modal__close').onclick = close;
    overlay.querySelector('#m-cancel').onclick            = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    if (onDelete) {
      overlay.querySelector('#m-del').onclick = async () => {
        const msg = overlay.querySelector('#m-msg');
        const btn = overlay.querySelector('#m-del');
        if (!confirm('¿Confirmas que deseas eliminar este registro? Esta acción no se puede deshacer.')) return;
        btn.textContent = 'Eliminando…';
        btn.disabled = true;
        const res = await onDelete();
        if (res.ok) { close(); return; }
        msg.textContent = res.mensaje || 'Error al eliminar';
        btn.textContent = 'Eliminar';
        btn.disabled = false;
      };
    }

    overlay.querySelector('#m-save').onclick = async () => {
      const msg = overlay.querySelector('#m-msg');
      const btn = overlay.querySelector('#m-save');
      const collected = {};
      for (const f of fields) {
        collected[f.key] = overlay.querySelector(`#mf-${f.key}`)?.value?.trim() ?? '';
      }
      btn.textContent = 'Guardando…';
      btn.disabled = true;
      msg.textContent = '';
      const res = await onSave(collected);
      if (res.ok) { close(); return; }
      msg.textContent = res.mensaje || 'Error al guardar';
      btn.textContent = 'Guardar';
      btn.disabled = false;
    };
  };

  /* ── Helpers de tabla ── */
  const _tableWrap = (theadHtml, tbodyHtml, colCount) => `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr>${theadHtml}</tr></thead>
        <tbody>${tbodyHtml || `<tr><td colspan="${colCount}" class="admin-table__empty">Sin registros</td></tr>`}</tbody>
      </table>
    </div>`;

  const _th = (...cols) => cols.map(c => `<th>${c}</th>`).join('');
  const _badge = (activo) =>
    `<span class="admin-badge admin-badge--${activo !== false ? 'activo' : 'inactivo'}">${activo !== false ? 'Activo' : 'Inactivo'}</span>`;

  /* ── Renderiza tbody y re-conecta eventos ── */
  const _setTbody = (tableWrapEl, html, wireFunc) => {
    const tbody = tableWrapEl.querySelector('tbody');
    if (tbody) { tbody.innerHTML = html; if (wireFunc) wireFunc(); }
  };

  /* ══════════════════════════════════════════════
     OVERVIEW
  ══════════════════════════════════════════════ */
  const _renderOverview = async (el) => {
    el.innerHTML = `<div class="admin-section__header">
      <h2 class="admin-section__title">Panel General</h2>
      <p class="admin-section__sub">Estadísticas en tiempo real de la plataforma TutorUCC</p>
    </div><div class="admin-loading">Consultando base de datos…</div>`;

    const data  = await _get('/admin/stats');
    const est   = data.estados || {};
    const chips = [
      { label: 'Pendientes',  val: est.pendiente  || 0, bg: '#fef9c3', c: '#854d0e' },
      { label: 'Confirmadas', val: est.confirmada || 0, bg: '#d1fae5', c: '#065f46' },
      { label: 'Finalizadas', val: est.finalizada || 0, bg: '#dbeafe', c: '#1e40af' },
      { label: 'Canceladas',  val: est.cancelada  || 0, bg: '#fee2e2', c: '#991b1b' },
    ].map(c =>
      `<span class="admin-estado-chip" style="background:${c.bg};color:${c.c}">${c.label}: <strong>${c.val}</strong></span>`
    ).join('');

    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Panel General</h2>
        <p class="admin-section__sub">Estadísticas en tiempo real de la plataforma TutorUCC</p>
      </div>
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">🎓</div>
          <div class="admin-stat-card__value">${data.totalEstudiantes ?? '–'}</div>
          <div class="admin-stat-card__label">Estudiantes registrados</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">🧑‍🏫</div>
          <div class="admin-stat-card__value">${data.totalDocentes ?? '–'}</div>
          <div class="admin-stat-card__label">Docentes / Tutores</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">📖</div>
          <div class="admin-stat-card__value">${data.totalMaterias ?? '–'}</div>
          <div class="admin-stat-card__label">Materias activas</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">🗓</div>
          <div class="admin-stat-card__value">${data.totalHorarios ?? '–'}</div>
          <div class="admin-stat-card__label">Horarios disponibles</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">📋</div>
          <div class="admin-stat-card__value">${data.totalTutorias ?? '–'}</div>
          <div class="admin-stat-card__label">Tutorías totales</div>
          <div class="admin-estado-row">${chips}</div>
        </div>
      </div>`;
  };

  /* ══════════════════════════════════════════════
     ESTUDIANTES
     Búsqueda: llama a GET /admin/estudiantes?nombre=&codigo=
  ══════════════════════════════════════════════ */
  let _estData = [];  // solo para referencia en modales (datos del último fetch)

  const _fetchEstudiantes = async (el, nombre = '', codigo = '') => {
    const params = new URLSearchParams();
    if (nombre) params.set('nombre', nombre);
    if (codigo) params.set('codigo', codigo);

    const tbody = el.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="admin-loading">Consultando BD…</td></tr>`;

    const data   = await _get(`/admin/estudiantes?${params}`);
    _estData     = data.estudiantes || [];
    const rows   = _estData.map(e => `
      <tr>
        <td>${e.nombre}</td>
        <td><code>${e.codigo}</code></td>
        <td>${e.correo}</td>
        <td>${_badge(e.usuario?.activo)}</td>
        <td><div class="admin-table__actions">
          <button type="button" class="admin-btn-edit" data-id="${e._id}">Editar</button>
          <button type="button" class="admin-btn-del"  data-id="${e._id}">Eliminar</button>
        </div></td>
      </tr>`).join('');

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="5" class="admin-table__empty">Sin resultados</td></tr>`;
      _wireEstudiantes(el);
    }
  };

  const _renderEstudiantes = async (el) => {
    const SEMESTRES = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Estudiantes</h2>
        <p class="admin-section__sub">Gestiona los estudiantes — las búsquedas consultan directamente MongoDB</p>
      </div>
      <div class="admin-toolbar">
        <input type="search" class="admin-toolbar__search" id="est-search-nombre"
          placeholder="Buscar por nombre…" aria-label="Buscar por nombre" />
        <input type="search" class="admin-toolbar__search" id="est-search-codigo"
          placeholder="Buscar por código…" aria-label="Buscar por código" style="max-width:180px" />
        <button type="button" class="admin-toolbar__btn" id="btn-add-est">+ Agregar estudiante</button>
      </div>
      ${_tableWrap(_th('Nombre','Código','Correo','Estado','Acciones'), '', 5)}`;

    const dNombre = _debounce(() => {
      _fetchEstudiantes(el,
        el.querySelector('#est-search-nombre').value.trim(),
        el.querySelector('#est-search-codigo').value.trim()
      );
    });
    el.querySelector('#est-search-nombre').addEventListener('input', dNombre);
    el.querySelector('#est-search-codigo').addEventListener('input', dNombre);

    el.querySelector('#btn-add-est').addEventListener('click', () => {
      _openModal({
        title: 'Agregar Estudiante',
        fields: [
          { key: 'nombre',   label: 'Nombre completo',        required: true },
          { key: 'codigo',   label: 'Código (6 dígitos)',      required: true, placeholder: 'Ej: 231045', hint: 'Exactamente 6 dígitos numéricos' },
          { key: 'correo',   label: 'Correo institucional',    required: true, type: 'email' },
          { key: 'password', label: 'Contraseña inicial',      required: true, type: 'password' },
        ],
        onSave: async (v) => {
          const res = await _post('/admin/estudiantes', v);
          if (res.estudiante) {
            await _fetchEstudiantes(el); return { ok: true };
          }
          return { ok: false, mensaje: res.mensaje };
        },
      });
    });

    await _fetchEstudiantes(el);
  };

  const _wireEstudiantes = (el) => {
    el.querySelectorAll('.admin-btn-edit[data-id]').forEach(btn => {
      btn.onclick = () => {
        const e = _estData.find(x => x._id === btn.dataset.id);
        if (!e) return;
        _openModal({
          title: `Editar: ${e.nombre}`,
          data:  { nombre: e.nombre, codigo: e.codigo, correo: e.correo },
          fields: [
            { key: 'nombre',   label: 'Nombre completo' },
            { key: 'codigo',   label: 'Código (6 dígitos)', hint: 'Exactamente 6 dígitos numéricos' },
            { key: 'correo',   label: 'Correo institucional', type: 'email' },
            { key: 'password', label: 'Nueva contraseña (vacío = no cambiar)', type: 'password' },
          ],
          onSave: async (v) => {
            const payload = {};
            if (v.nombre)   payload.nombre   = v.nombre;
            if (v.codigo)   payload.codigo   = v.codigo;
            if (v.correo)   payload.correo   = v.correo;
            if (v.password) payload.password = v.password;
            const res = await _put(`/admin/estudiantes/${e._id}`, payload);
            if (res.estudiante || res.mensaje?.includes('correctamente')) {
              await _fetchEstudiantes(el,
                el.querySelector('#est-search-nombre').value.trim(),
                el.querySelector('#est-search-codigo').value.trim()
              );
              return { ok: true };
            }
            return { ok: false, mensaje: res.mensaje };
          },
          onDelete: async () => {
            const res = await _del(`/admin/estudiantes/${e._id}`);
            if (res.mensaje?.includes('correctamente')) {
              await _fetchEstudiantes(el); return { ok: true };
            }
            return { ok: false, mensaje: res.mensaje };
          },
        });
      };
    });

    el.querySelectorAll('.admin-btn-del[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const e = _estData.find(x => x._id === btn.dataset.id);
        if (!confirm(`¿Eliminar a ${e?.nombre}? Esta acción no se puede deshacer.`)) return;
        const res = await _del(`/admin/estudiantes/${btn.dataset.id}`);
        if (res.mensaje?.includes('correctamente')) await _fetchEstudiantes(el);
        else alert(res.mensaje || 'Error al eliminar');
      };
    });
  };

  /* ══════════════════════════════════════════════
     DOCENTES
     Búsqueda: llama a GET /admin/docentes?nombre=
  ══════════════════════════════════════════════ */
  let _docData = [];

  const _fetchDocentes = async (el, nombre = '') => {
    const params = new URLSearchParams();
    if (nombre) params.set('nombre', nombre);

    const tbody = el.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="admin-loading">Consultando BD…</td></tr>`;

    const data = await _get(`/admin/docentes?${params}`);
    _docData   = data.docentes || [];
    const rows = _docData.map(d => `
      <tr>
        <td>${d.nombre}</td>
        <td>${d.correo}</td>
        <td>${d.departamento || '—'}</td>
        <td>${_badge(d.usuario?.activo)}</td>
        <td><div class="admin-table__actions">
          <button type="button" class="admin-btn-edit" data-id="${d._id}">Editar</button>
          <button type="button" class="admin-btn-del"  data-id="${d._id}">Eliminar</button>
        </div></td>
      </tr>`).join('');

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="5" class="admin-table__empty">Sin resultados</td></tr>`;
      _wireDocentes(el);
    }
  };

  const _renderDocentes = async (el) => {
    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Docentes</h2>
        <p class="admin-section__sub">Gestiona los docentes y tutores — las búsquedas consultan directamente MongoDB</p>
      </div>
      <div class="admin-toolbar">
        <input type="search" class="admin-toolbar__search" id="doc-search"
          placeholder="Buscar por nombre…" aria-label="Buscar docente" />
        <button type="button" class="admin-toolbar__btn" id="btn-add-doc">+ Agregar docente</button>
      </div>
      ${_tableWrap(_th('Nombre','Correo','Departamento','Estado','Acciones'), '', 5)}`;

    el.querySelector('#doc-search').addEventListener('input',
      _debounce(ev => _fetchDocentes(el, ev.target.value.trim()))
    );

    el.querySelector('#btn-add-doc').addEventListener('click', () => {
      _openModal({
        title: 'Agregar Docente',
        fields: [
          { key: 'nombre',       label: 'Nombre completo',      required: true },
          { key: 'correo',       label: 'Correo institucional',  required: true, type: 'email' },
          { key: 'password',     label: 'Contraseña inicial',    required: true, type: 'password' },
          { key: 'departamento', label: 'Departamento',          placeholder: 'Ingeniería de Sistemas' },
        ],
        onSave: async (v) => {
          const res = await _post('/admin/docentes', v);
          if (res.docente) { await _fetchDocentes(el); return { ok: true }; }
          return { ok: false, mensaje: res.mensaje };
        },
      });
    });

    await _fetchDocentes(el);
  };

  const _wireDocentes = (el) => {
    el.querySelectorAll('.admin-btn-edit[data-id]').forEach(btn => {
      btn.onclick = () => {
        const d = _docData.find(x => x._id === btn.dataset.id);
        if (!d) return;
        _openModal({
          title: `Editar: ${d.nombre}`,
          data:  { nombre: d.nombre, correo: d.correo, departamento: d.departamento },
          fields: [
            { key: 'nombre',       label: 'Nombre completo' },
            { key: 'correo',       label: 'Correo institucional', type: 'email' },
            { key: 'departamento', label: 'Departamento' },
            { key: 'password',     label: 'Nueva contraseña (vacío = no cambiar)', type: 'password' },
          ],
          onSave: async (v) => {
            const payload = {};
            if (v.nombre)       payload.nombre       = v.nombre;
            if (v.correo)       payload.correo       = v.correo;
            if (v.departamento) payload.departamento = v.departamento;
            if (v.password)     payload.password     = v.password;
            const res = await _put(`/admin/docentes/${d._id}`, payload);
            if (res.docente || res.mensaje?.includes('correctamente')) {
              await _fetchDocentes(el, el.querySelector('#doc-search').value.trim());
              return { ok: true };
            }
            return { ok: false, mensaje: res.mensaje };
          },
          onDelete: async () => {
            const res = await _del(`/admin/docentes/${d._id}`);
            if (res.mensaje?.includes('correctamente')) { await _fetchDocentes(el); return { ok: true }; }
            return { ok: false, mensaje: res.mensaje };
          },
        });
      };
    });

    el.querySelectorAll('.admin-btn-del[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const d = _docData.find(x => x._id === btn.dataset.id);
        if (!confirm(`¿Eliminar al docente ${d?.nombre}?\nSe eliminarán también sus horarios y tutorías.`)) return;
        const res = await _del(`/admin/docentes/${btn.dataset.id}`);
        if (res.mensaje?.includes('correctamente')) await _fetchDocentes(el);
        else alert(res.mensaje || 'Error al eliminar');
      };
    });
  };

  /* ══════════════════════════════════════════════
     MATERIAS
     Búsqueda: llama a GET /admin/materias?nombre=&semestre=
  ══════════════════════════════════════════════ */
  let _matData  = [];
  const SEMESTRES = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

  const _fetchMaterias = async (el, nombre = '', semestre = '') => {
    const params = new URLSearchParams();
    if (nombre)   params.set('nombre',   nombre);
    if (semestre) params.set('semestre', semestre);

    const tbody = el.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="admin-loading">Consultando BD…</td></tr>`;

    const data  = await _get(`/admin/materias?${params}`);
    _matData    = data.materias || [];
    const rows  = _matData.map(m => `
      <tr>
        <td>${m.nombre}</td>
        <td>Semestre ${m.semestre}</td>
        <td>${_badge(m.activo)}</td>
        <td><div class="admin-table__actions">
          <button type="button" class="admin-btn-edit" data-id="${m._id}">Editar</button>
          <button type="button" class="admin-btn-del"  data-id="${m._id}">Eliminar</button>
        </div></td>
      </tr>`).join('');

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="4" class="admin-table__empty">Sin resultados</td></tr>`;
      _wireMaterias(el);
    }
  };

  const _renderMaterias = async (el) => {
    const semOpts = SEMESTRES.map(s => `<option value="${s}">Semestre ${s}</option>`).join('');
    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Materias</h2>
        <p class="admin-section__sub">Gestiona el catálogo de materias — las búsquedas consultan directamente MongoDB</p>
      </div>
      <div class="admin-toolbar">
        <input type="search" class="admin-toolbar__search" id="mat-search"
          placeholder="Buscar por nombre…" aria-label="Buscar materia" />
        <select class="admin-toolbar__select" id="mat-sem" aria-label="Filtrar por semestre">
          <option value="">Todos los semestres</option>${semOpts}
        </select>
        <button type="button" class="admin-toolbar__btn" id="btn-add-mat">+ Agregar materia</button>
      </div>
      ${_tableWrap(_th('Nombre','Semestre','Estado','Acciones'), '', 4)}`;

    const _doFetch = () => _fetchMaterias(el,
      el.querySelector('#mat-search').value.trim(),
      el.querySelector('#mat-sem').value
    );
    el.querySelector('#mat-search').addEventListener('input',  _debounce(_doFetch));
    el.querySelector('#mat-sem').addEventListener('change', _doFetch);

    el.querySelector('#btn-add-mat').addEventListener('click', () => {
      _openModal({
        title: 'Agregar Materia',
        fields: [
          { key: 'nombre',   label: 'Nombre de la materia', required: true },
          { key: 'semestre', label: 'Semestre',             required: true, type: 'select',
            options: SEMESTRES.map(s => ({ value: s, label: `Semestre ${s}` })) },
        ],
        onSave: async (v) => {
          const res = await _post('/admin/materias', v);
          if (res.materia) { await _doFetch(); return { ok: true }; }
          return { ok: false, mensaje: res.mensaje };
        },
      });
    });

    await _fetchMaterias(el);
  };

  const _wireMaterias = (el) => {
    const _doFetch = () => _fetchMaterias(el,
      el.querySelector('#mat-search').value.trim(),
      el.querySelector('#mat-sem').value
    );

    el.querySelectorAll('.admin-btn-edit[data-id]').forEach(btn => {
      btn.onclick = () => {
        const m = _matData.find(x => x._id === btn.dataset.id);
        if (!m) return;
        _openModal({
          title: `Editar: ${m.nombre}`,
          data:  { nombre: m.nombre, semestre: m.semestre },
          fields: [
            { key: 'nombre',   label: 'Nombre de la materia' },
            { key: 'semestre', label: 'Semestre', type: 'select',
              options: SEMESTRES.map(s => ({ value: s, label: `Semestre ${s}` })) },
          ],
          onSave: async (v) => {
            const res = await _put(`/admin/materias/${m._id}`, v);
            if (res.materia || res.mensaje?.includes('correctamente')) {
              await _doFetch(); return { ok: true };
            }
            return { ok: false, mensaje: res.mensaje };
          },
          onDelete: async () => {
            const res = await _del(`/admin/materias/${m._id}`);
            if (res.mensaje?.includes('correctamente')) { await _doFetch(); return { ok: true }; }
            return { ok: false, mensaje: res.mensaje };
          },
        });
      };
    });

    el.querySelectorAll('.admin-btn-del[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const m = _matData.find(x => x._id === btn.dataset.id);
        if (!confirm(`¿Eliminar "${m?.nombre}"?\nSe eliminarán también sus horarios de tutores.`)) return;
        const res = await _del(`/admin/materias/${btn.dataset.id}`);
        if (res.mensaje?.includes('correctamente')) await _doFetch();
        else alert(res.mensaje || 'Error al eliminar');
      };
    });
  };

  /* ══════════════════════════════════════════════
     HORARIOS
     Búsqueda: llama a GET /admin/horarios?buscar=
     MongoDB resuelve materia.nombre y tutor.nombre antes de filtrar
  ══════════════════════════════════════════════ */
  let _horData = [];

  const _fetchHorarios = async (el, buscar = '') => {
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);

    const tbody = el.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="admin-loading">Consultando BD…</td></tr>`;

    const data  = await _get(`/admin/horarios?${params}`);
    _horData    = data.horarios || [];
    const rows  = _horData.map(h => `
      <tr>
        <td>${h.materia?.nombre ?? '—'}</td>
        <td>${h.materia?.semestre ?? '—'}</td>
        <td>${h.tutor?.nombre ?? '—'}</td>
        <td>${h.horario}</td>
        <td>Aula ${h.aula}</td>
        <td>${_badge(h.activo)}</td>
        <td><div class="admin-table__actions">
          <button type="button" class="admin-btn-edit" data-id="${h._id}">Editar</button>
          <button type="button" class="admin-btn-del"  data-id="${h._id}">Eliminar</button>
        </div></td>
      </tr>`).join('');

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="7" class="admin-table__empty">Sin resultados</td></tr>`;
      _wireHorarios(el);
    }
  };

  const _renderHorarios = async (el) => {
    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Horarios de Tutores</h2>
        <p class="admin-section__sub">Búsqueda por materia o docente — MongoDB resuelve los joins antes de filtrar</p>
      </div>
      <div class="admin-toolbar">
        <input type="search" class="admin-toolbar__search" id="hor-search"
          placeholder="Buscar por materia o docente…" aria-label="Buscar horario" />
        <button type="button" class="admin-toolbar__btn" id="btn-add-hor">+ Agregar horario</button>
      </div>
      ${_tableWrap(_th('Materia','Sem.','Docente','Horario','Aula','Estado','Acciones'), '', 7)}`;

    el.querySelector('#hor-search').addEventListener('input',
      _debounce(ev => _fetchHorarios(el, ev.target.value.trim()))
    );

    el.querySelector('#btn-add-hor').addEventListener('click', async () => {
      // Carga docentes y materias para los selects del modal
      const [dataD, dataM] = await Promise.all([
        _get('/admin/docentes'),
        _get('/admin/materias'),
      ]);
      const docentes = dataD.docentes || [];
      const materias = dataM.materias || [];

      _openModal({
        title: 'Agregar Horario',
        fields: [
          { key: 'materiaId', label: 'Materia', required: true, type: 'select',
            options: materias.map(m => ({ value: m._id, label: `${m.nombre} (Sem. ${m.semestre})` })) },
          { key: 'tutorId', label: 'Docente', required: true, type: 'select',
            options: docentes.map(d => ({ value: d.usuario?._id ?? d.usuario, label: d.nombre })) },
          { key: 'horario', label: 'Horario', required: true, placeholder: 'Ej: Lunes 14:00-16:00' },
          { key: 'aula',    label: 'Aula',    required: true, placeholder: 'Ej: 208' },
        ],
        onSave: async (v) => {
          const res = await _post('/admin/horarios', v);
          if (res.horario) { await _fetchHorarios(el); return { ok: true }; }
          return { ok: false, mensaje: res.mensaje };
        },
      });
    });

    await _fetchHorarios(el);
  };

  const _wireHorarios = (el) => {
    const buscar = () => el.querySelector('#hor-search').value.trim();

    el.querySelectorAll('.admin-btn-edit[data-id]').forEach(btn => {
      btn.onclick = () => {
        const h = _horData.find(x => x._id === btn.dataset.id);
        if (!h) return;
        _openModal({
          title: `Editar horario — ${h.materia?.nombre ?? ''}`,
          data:  { horario: h.horario, aula: h.aula },
          fields: [
            { key: 'horario', label: 'Horario', placeholder: 'Ej: Lunes 14:00-16:00' },
            { key: 'aula',    label: 'Aula',    placeholder: 'Ej: 208' },
          ],
          onSave: async (v) => {
            const res = await _put(`/admin/horarios/${h._id}`, v);
            if (res.horario || res.mensaje?.includes('correctamente')) {
              await _fetchHorarios(el, buscar()); return { ok: true };
            }
            return { ok: false, mensaje: res.mensaje };
          },
          onDelete: async () => {
            const res = await _del(`/admin/horarios/${h._id}`);
            if (res.mensaje?.includes('correctamente')) { await _fetchHorarios(el); return { ok: true }; }
            return { ok: false, mensaje: res.mensaje };
          },
        });
      };
    });

    el.querySelectorAll('.admin-btn-del[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const h = _horData.find(x => x._id === btn.dataset.id);
        if (!confirm(`¿Eliminar este horario?\n${h?.tutor?.nombre} — ${h?.materia?.nombre} — ${h?.horario}`)) return;
        const res = await _del(`/admin/horarios/${btn.dataset.id}`);
        if (res.mensaje?.includes('correctamente')) await _fetchHorarios(el, buscar());
        else alert(res.mensaje || 'Error al eliminar');
      };
    });
  };

  /* ══════════════════════════════════════════════
     TUTORÍAS
     Búsqueda: llama a GET /admin/tutorias?buscar=&estado=
     MongoDB filtra nombreEstudiante y resuelve materia.nombre
  ══════════════════════════════════════════════ */
  let _tutData = [];

  const _fetchTutorias = async (el, buscar = '', estado = '') => {
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);
    if (estado) params.set('estado', estado);

    const tbody = el.querySelector('tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="admin-loading">Consultando BD…</td></tr>`;

    const data  = await _get(`/admin/tutorias?${params}`);
    _tutData    = data.tutorias || [];
    const rows  = _tutData.map(t => {
      const fecha = t.fechaTutoria
        ? new Date(t.fechaTutoria).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date(t.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<tr>
        <td>${t.materia?.nombre ?? '—'}</td>
        <td>${t.nombreEstudiante ?? '—'}</td>
        <td>${t.tutor?.nombre ?? '—'}</td>
        <td>${t.horario ?? '—'}</td>
        <td>${fecha}</td>
        <td><span class="admin-badge admin-badge--${t.estado}">${t.estado}</span></td>
        <td><button type="button" class="admin-btn-del" data-id="${t._id}">Eliminar</button></td>
      </tr>`;
    }).join('');

    if (tbody) {
      tbody.innerHTML = rows || `<tr><td colspan="7" class="admin-table__empty">Sin resultados</td></tr>`;
      _wireTutorias(el);
    }
  };

  const _renderTutorias = async (el) => {
    const ESTADOS = ['pendiente','confirmada','finalizada','cancelada'];
    const estadoOpts = ESTADOS.map(e =>
      `<option value="${e}">${e.charAt(0).toUpperCase()}${e.slice(1)}</option>`
    ).join('');

    el.innerHTML = `
      <div class="admin-section__header">
        <h2 class="admin-section__title">Tutorías</h2>
        <p class="admin-section__sub">Búsqueda por estudiante o materia — MongoDB filtra y resuelve referencias</p>
      </div>
      <div class="admin-toolbar">
        <input type="search" class="admin-toolbar__search" id="tut-search"
          placeholder="Buscar por estudiante o materia…" aria-label="Buscar tutoría" />
        <select class="admin-toolbar__select" id="tut-estado" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>${estadoOpts}
        </select>
      </div>
      ${_tableWrap(_th('Materia','Estudiante','Docente','Horario','Fecha','Estado','Acciones'), '', 7)}`;

    const _doFetch = () => _fetchTutorias(el,
      el.querySelector('#tut-search').value.trim(),
      el.querySelector('#tut-estado').value
    );
    el.querySelector('#tut-search').addEventListener('input',  _debounce(_doFetch));
    el.querySelector('#tut-estado').addEventListener('change', _doFetch);

    await _fetchTutorias(el);
  };

  const _wireTutorias = (el) => {
    const _doFetch = () => _fetchTutorias(el,
      el.querySelector('#tut-search').value.trim(),
      el.querySelector('#tut-estado').value
    );
    el.querySelectorAll('.admin-btn-del[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const t = _tutData.find(x => x._id === btn.dataset.id);
        if (!confirm(`¿Eliminar esta tutoría permanentemente?\n${t?.materia?.nombre ?? ''} — ${t?.nombreEstudiante ?? ''}`)) return;
        const res = await _del(`/admin/tutorias/${btn.dataset.id}`);
        if (res.mensaje?.includes('correctamente')) await _doFetch();
        else alert(res.mensaje || 'Error al eliminar');
      };
    });
  };

  /* ══════════════════════════════════════════════
     NAVEGACIÓN
  ══════════════════════════════════════════════ */
  const _renderers = {
    overview:    _renderOverview,
    estudiantes: _renderEstudiantes,
    docentes:    _renderDocentes,
    materias:    _renderMaterias,
    horarios:    _renderHorarios,
    tutorias:    _renderTutorias,
  };

  const _switchSection = (id) => {
    document.querySelectorAll('#page-admin .admin-nav__item').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.section === id)
    );
    document.querySelectorAll('#page-admin .admin-section').forEach(sec => {
      sec.hidden = sec.dataset.section !== id;
    });
    const el = document.querySelector(`#page-admin .admin-section[data-section="${id}"]`);
    if (el && _renderers[id]) _renderers[id](el);
  };

  const init = (usuario, onLogout) => {
    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = usuario.nombre;

    document.querySelector('#page-admin .admin-sidebar')?.addEventListener('click', e => {
      const item = e.target.closest('.admin-nav__item[data-section]');
      if (item) _switchSection(item.dataset.section);
    });

    document.querySelector('#page-admin .admin-sidebar__logout')?.addEventListener('click', onLogout);

    _switchSection('overview');
  };

  return { init };
})();
