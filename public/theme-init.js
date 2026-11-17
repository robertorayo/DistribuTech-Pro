/* ==== Tema inicial ====
 * Se ejecuta antes de pintar la página para aplicar el modo oscuro sin parpadeo.
 * Va en un archivo aparte (no inline) para que la CSP pueda prohibir scripts inline.
 */
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    /* Sin acceso a localStorage: se queda el tema claro. */
  }
})();
