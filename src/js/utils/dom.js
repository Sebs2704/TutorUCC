/**
 * utils/dom.js
 * Lightweight DOM helpers used across the app.
 * No framework dependencies.
 */

const DOM = (() => {
  /**
   * Shorthand for document.getElementById
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  const byId = (id) => document.getElementById(id);

  /**
   * Shorthand for document.querySelector
   * @param {string} selector
   * @param {HTMLElement} [parent=document]
   * @returns {HTMLElement|null}
   */
  const qs = (selector, parent = document) => parent.querySelector(selector);

  /**
   * Shorthand for document.querySelectorAll (returns Array)
   * @param {string} selector
   * @param {HTMLElement} [parent=document]
   * @returns {HTMLElement[]}
   */
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  /**
   * Show an element (removes hidden attr + display:none)
   * @param {HTMLElement} el
   */
  const show = (el) => {
    if (!el) return;
    el.hidden = false;
    el.style.display = '';
  };

  /**
   * Hide an element (sets hidden attr)
   * @param {HTMLElement} el
   */
  const hide = (el) => {
    if (!el) return;
    el.hidden = true;
  };

  /**
   * Replace innerHTML safely (avoids repeated reflows)
   * @param {HTMLElement} el
   * @param {string} html
   */
  const setHTML = (el, html) => {
    if (!el) return;
    el.innerHTML = html;
  };

  /**
   * Set text content
   * @param {HTMLElement} el
   * @param {string} text
   */
  const setText = (el, text) => {
    if (!el) return;
    el.textContent = text;
  };

  /**
   * Add a class list to an element
   * @param {HTMLElement} el
   * @param {...string} classes
   */
  const addClass = (el, ...classes) => el?.classList.add(...classes);

  /**
   * Remove a class list from an element
   * @param {HTMLElement} el
   * @param {...string} classes
   */
  const removeClass = (el, ...classes) => el?.classList.remove(...classes);

  /**
   * Toggle a class on an element
   * @param {HTMLElement} el
   * @param {string} cls
   * @param {boolean} [force]
   */
  const toggleClass = (el, cls, force) => el?.classList.toggle(cls, force);

  /**
   * Fade out an element and optionally remove it from the DOM
   * @param {HTMLElement} el
   * @param {boolean} [remove=true]
   * @param {number} [duration=300]
   */
  const fadeOut = (el, remove = true, duration = 300) => {
    if (!el) return;
    el.style.transition = `opacity ${duration}ms ease`;
    el.style.opacity = '0';
    setTimeout(() => {
      if (remove) el.remove();
      else el.hidden = true;
    }, duration);
  };

  return { byId, qs, qsa, show, hide, setHTML, setText, addClass, removeClass, toggleClass, fadeOut };
})();
