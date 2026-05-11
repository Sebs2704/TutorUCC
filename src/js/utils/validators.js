/**
 * utils/validators.js
 * Pure validation functions — no side effects, no DOM access.
 * Returns { valid: boolean, message: string }
 */

const Validators = (() => {
  /**
   * Validate an institutional email address
   * @param {string} value
   * @returns {{ valid: boolean, message: string }}
   */
  const email = (value) => {
    if (!value || !value.trim()) {
      return { valid: false, message: 'El correo es requerido.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return { valid: false, message: 'Ingresa un correo válido.' };
    }
    return { valid: true, message: '' };
  };

  /**
   * Validate a password field (non-empty, min length)
   * @param {string} value
   * @param {number} [minLength=6]
   * @returns {{ valid: boolean, message: string }}
   */
  const password = (value, minLength = 6) => {
    if (!value || !value.trim()) {
      return { valid: false, message: 'La contraseña es requerida.' };
    }
    if (value.length < minLength) {
      return { valid: false, message: `Mínimo ${minLength} caracteres.` };
    }
    return { valid: true, message: '' };
  };

  return { email, password };
})();
