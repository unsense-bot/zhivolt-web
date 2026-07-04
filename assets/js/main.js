/**
 * main.js
 * Lógica compartida en TODAS las páginas de ZhiVolt Web.
 * Responsabilidades (T-05 / T-06 / T-22):
 *   1. Marcar como "activo" el enlace del navbar que corresponde a la página actual.
 *   2. Inicializar el badge del carrito leyendo localStorage (lectura defensiva:
 *      si todavía no existe el carrito, simplemente muestra 0).
 *   3. Mostrar el año actual en el copyright del footer.
 *   4. Exponer utilidades y constantes compartidas por catalog.js, product.js,
 *      index.js y quote-cart.js (zvFormatUSD, zvGetCategoryName, ZV_PRODUCTS_URL),
 *      para no duplicarlas por archivo.
 *   5. Refrescar el badge en tiempo real cuando el carrito cambia (T-22),
 *      escuchando el evento "zv:cartUpdated" que dispara quote-cart.js (T-20).
 *
 * IMPORTANTE: este archivo se carga primero en las 5 páginas (antes de quote-cart.js,
 * catalog.js, product.js o index.js), por eso sus funciones quedan disponibles
 * globalmente para los demás scripts sin necesidad de módulos ES6 ni imports.
 */

const ZV_CART_STORAGE_KEY = "zhivolt_quote_cart";
const ZV_PRODUCTS_URL = "assets/data/products.json";

/**
 * Endpoint de Formspree para el formulario de cotización (T-24).
 * Reemplaza el ID con el de tu formulario real en https://formspree.io
 */
const ZV_FORMSPREE_ENDPOINT = "https://formspree.io/f/xvzjwoyk";

/**
 * Formatea un número como precio en USD (sin decimales).
 * Usado por catalog.js, product.js e index.js para mostrar precios referenciales.
 */
const zvFormatUSD = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Resuelve el nombre legible de una categoría a partir de su id (ej. "scooters" -> "Scooters Eléctricos").
 * Recibe el arreglo `categories` de products.json; si no encuentra coincidencia, devuelve el id tal cual
 * (fallback seguro en vez de mostrar "undefined" si products.json llega con datos incompletos).
 */
function zvGetCategoryName(categoryId, categories) {
  const cat = categories?.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

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
    console.warn(
      "No se pudo leer el carrito de cotización desde localStorage:",
      error,
    );
    return [];
  }
}

/**
 * Actualiza el número y la visibilidad del badge del carrito en el navbar.
 */
function zvUpdateCartBadge() {
  const badge = document.querySelector(".zv-cart-badge");
  if (!badge) return;

  const count = zvGetCartItems().length;
  badge.textContent = count;
  badge.setAttribute("data-count", count);
}

/**
 * Marca como activo el <a class="nav-link"> cuyo data-page coincide con
 * el data-page declarado en el <body> de la página actual.
 */
function zvSetActiveNavLink() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document
    .querySelectorAll(".navbar-zv .nav-link[data-page]")
    .forEach((link) => {
      const isActive = link.dataset.page === currentPage;
      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
}

/**
 * Inserta el año actual en el copyright del footer, para no tener que
 * actualizarlo a mano cada vez que cambie el año.
 */
function zvSetCurrentYear() {
  const yearEl = document.getElementById("zvCurrentYear");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  zvSetActiveNavLink();
  zvUpdateCartBadge();
  zvSetCurrentYear();

  // T-32: inicializa AOS una sola vez, en el único archivo que se carga en
  // las 5 páginas. Respeta "prefers-reduced-motion" (WCAG SC 2.3.3): si el
  // usuario configuró reducir movimiento en su sistema, AOS se desactiva
  // por completo y el contenido se muestra de inmediato sin animar.
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      disable: () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }
});

// T-22: el badge se refresca solo cuando el carrito cambia (clic en cualquier
// botón "Agregar a cotización", o más adelante el sidebar de T-21), sin
// necesidad de recargar la página. El evento lo dispara quote-cart.js (T-20).
document.addEventListener("zv:cartUpdated", zvUpdateCartBadge);

// Restringe el campo de teléfono a solo dígitos, máximo 9 caracteres.
// Se ejecuta en las 5 páginas; si el campo no existe en la página actual,
// getElementById devuelve null y el bloque simplemente no hace nada.
document.addEventListener("DOMContentLoaded", function () {
  const zvPhoneInput = document.getElementById("zvFieldTelefono");
  if (zvPhoneInput) {
    zvPhoneInput.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 9);
    });
  }
});
