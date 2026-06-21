/**
 * quote-cart.js — T-20
 * CRUD del carrito de cotización en localStorage.
 *
 * Reutiliza ZV_CART_STORAGE_KEY y zvGetCartItems() ya definidas en main.js
 * (debe cargarse después de main.js en TODAS las páginas, no solo en
 * catálogo/producto, porque el ícono del carrito vive en el navbar de las 5).
 *
 * Estructura del carrito: arreglo de IDs de producto (string), sin duplicados.
 * No se maneja cantidad por producto aquí — la cantidad final se negocia en
 * la cotización formal (T-23); el carrito solo registra qué modelos interesan.
 *
 * Cada cambio dispara un evento personalizado "zv:cartUpdated" en `document`,
 * con el arreglo actualizado en event.detail.items. T-22 escuchará este evento
 * para sincronizar el badge del navbar en tiempo real, sin recargar la página.
 */

function zvSaveCartItems(items) {
  try {
    localStorage.setItem(ZV_CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn(
      "No se pudo guardar el carrito de cotización en localStorage:",
      error,
    );
  }
  document.dispatchEvent(
    new CustomEvent("zv:cartUpdated", { detail: { items } }),
  );
}

function zvIsInCart(productId) {
  return zvGetCartItems().includes(productId);
}

function zvAddToCart(productId) {
  const items = zvGetCartItems();
  if (items.includes(productId)) return items; // ya está, no duplicar

  const updated = [...items, productId];
  zvSaveCartItems(updated);
  return updated;
}

function zvRemoveFromCart(productId) {
  const updated = zvGetCartItems().filter((id) => id !== productId);
  zvSaveCartItems(updated);
  return updated;
}

function zvClearCart() {
  zvSaveCartItems([]);
}

/**
 * Alterna el estado de un producto en el carrito (agrega si no está, quita si ya está).
 * Pensado para T-18: un mismo botón "Agregar/Quitar de cotización" sin lógica duplicada.
 */
function zvToggleCartItem(productId) {
  return zvIsInCart(productId)
    ? zvRemoveFromCart(productId)
    : zvAddToCart(productId);
}

/* ============================================== */
/* BOTONES "AGREGAR A COTIZACIÓN" — T-18            */
/* Lógica centralizada aquí (no en catalog.js/index.js/product.js) porque   */
/* el comportamiento es idéntico en las 3 páginas. Un solo listener         */
/* delegado en `document` cubre los 3 contextos, incluyendo tarjetas        */
/* inyectadas dinámicamente tras un fetch().                                */
/* ============================================== */

function zvSetAddToQuoteButtonState(button, productId) {
  const inCart = zvIsInCart(productId);

  button.textContent = inCart ? "Quitar de cotización" : "Agregar a cotización";
  button.classList.toggle("zv-btn--outline-navy", inCart);
  button.classList.toggle("zv-btn--steel", !inCart);
  button.setAttribute("aria-pressed", inCart ? "true" : "false");
}

/**
 * Aplica el estado visual correcto a todos los botones .zv-add-to-quote
 * presentes en `root` en este momento. Cada página la llama después de
 * renderizar sus tarjetas (catalog.js, index.js) o su ficha (product.js),
 * para que el botón ya muestre "Quitar de cotización" si el producto
 * quedó en el carrito de una visita anterior.
 */
function zvInitAddToQuoteButtons(root = document) {
  root.querySelectorAll(".zv-add-to-quote").forEach((btn) => {
    zvSetAddToQuoteButtonState(btn, btn.dataset.productId);
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".zv-add-to-quote");
  if (!btn) return;
  zvToggleCartItem(btn.dataset.productId);
});

// Si el carrito cambia desde cualquier origen (este mismo clic, el futuro
// sidebar de T-21, u otra pestaña abierta), resincroniza el texto/estado
// de todos los botones visibles en la página actual.
document.addEventListener("zv:cartUpdated", () => {
  zvInitAddToQuoteButtons();
});
