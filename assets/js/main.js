/**
 * main.js
 * Lógica compartida en TODAS las páginas de ZhiVolt Web.
 * Responsabilidades (T-05 / T-06):
 *   1. Marcar como "activo" el enlace del navbar que corresponde a la página actual.
 *   2. Inicializar el badge del carrito leyendo localStorage (lectura defensiva:
 *      si todavía no existe el carrito, simplemente muestra 0).
 *   3. Mostrar el año actual en el copyright del footer.
 *
 * NOTA: la sincronización en tiempo real del badge cuando el usuario agrega o quita
 * productos del carrito (sin recargar la página) se implementa en T-22 (Sprint 3),
 * una vez que quote-cart.js exista y dispare los eventos correspondientes.
 */

const ZV_CART_STORAGE_KEY = 'zhivolt_quote_cart';

/**
 * Lee el carrito de cotización desde localStorage.
 * Devuelve siempre un arreglo, incluso si la clave no existe o el JSON está corrupto.
 */
function zvGetCartItems() {
  try {
    const raw = localStorage.getItem(ZV_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('No se pudo leer el carrito de cotización desde localStorage:', error);
    return [];
  }
}

/**
 * Actualiza el número y la visibilidad del badge del carrito en el navbar.
 */
function zvUpdateCartBadge() {
  const badge = document.querySelector('.zv-cart-badge');
  if (!badge) return;

  const count = zvGetCartItems().length;
  badge.textContent = count;
  badge.setAttribute('data-count', count);
}

/**
 * Marca como activo el <a class="nav-link"> cuyo data-page coincide con
 * el data-page declarado en el <body> de la página actual.
 */
function zvSetActiveNavLink() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document.querySelectorAll('.navbar-zv .nav-link[data-page]').forEach((link) => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Inserta el año actual en el copyright del footer, para no tener que
 * actualizarlo a mano cada vez que cambie el año.
 */
function zvSetCurrentYear() {
  const yearEl = document.getElementById('zvCurrentYear');
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  zvSetActiveNavLink();
  zvUpdateCartBadge();
  zvSetCurrentYear();
});
