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

/* ============================================== */
/* SIDEBAR OFFCANVAS — T-21                         */
/* ============================================== */

let zvProductsCache = null; // evita refetch en cada apertura del sidebar

async function zvGetProductsData() {
  if (zvProductsCache) return zvProductsCache;
  try {
    const res = await fetch(ZV_PRODUCTS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    zvProductsCache = await res.json();
    return zvProductsCache;
  } catch (err) {
    console.error(
      "quote-cart.js: no se pudo cargar products.json para el sidebar:",
      err,
    );
    return null;
  }
}

function zvBuildCartItemRow(product) {
  const img = product.images?.[0] || "";
  return `
    <div class="zv-cart-item" data-product-id="${product.id}">
      <div class="zv-cart-item-img-wrap">
        <img src="${img}" alt="${product.name}"
             loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none'">
      </div>
      <div class="zv-cart-item-info">
        <p class="zv-cart-item-name">${product.name}</p>
        <p class="zv-cart-item-price">Desde ${zvFormatUSD(product.unitPriceUSD)} / unidad</p>
        <p class="zv-cart-item-moq">MOQ: ${product.moq} unidades</p>
      </div>
      <button type="button" class="zv-cart-item-remove" data-product-id="${product.id}"
              aria-label="Quitar ${product.name} de la cotización">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>`;
}

async function zvRenderCartSidebar() {
  const itemsWrap = document.getElementById("zvCartItems");
  const emptyState = document.getElementById("zvCartEmpty");
  const footer = document.getElementById("zvCartFooter");
  if (!itemsWrap) return;

  const cartIds = zvGetCartItems();

  if (!cartIds.length) {
    itemsWrap.innerHTML = "";
    emptyState?.classList.remove("d-none");
    footer?.classList.add("d-none");
    return;
  }

  emptyState?.classList.add("d-none");
  footer?.classList.remove("d-none");

  const data = await zvGetProductsData();
  if (!data) {
    itemsWrap.innerHTML =
      '<p class="text-danger small p-3">No se pudieron cargar los productos.</p>';
    return;
  }

  const rows = cartIds
    .map((id) => data.products.find((p) => p.id === id))
    .filter(Boolean)
    .map(zvBuildCartItemRow)
    .join("");

  itemsWrap.innerHTML = rows;
}

// Los listeners de clic en document funcionan a nivel global y no requieren
// que el offcanvas exista aún, por eso van fuera de DOMContentLoaded.

// Quitar producto desde el sidebar (delegado en el contenedor de items)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".zv-cart-item-remove");
  if (!btn) return;
  zvRemoveFromCart(btn.dataset.productId);
});

// El offcanvas se inicializa dentro de DOMContentLoaded porque el elemento
// #zvCartOffcanvas aparece en el HTML después de los <script>, y el browser
// aún no lo ha parseado cuando este archivo se ejecuta por primera vez.
// DOMContentLoaded garantiza que todo el HTML esté disponible.
/* ============================================== */
/* FORMULARIO DE COTIZACIÓN — T-23 / T-24 / T-25   */
/* ============================================== */

async function zvPopulateQuoteProductsSummary() {
  const summary = document.getElementById("zvQuoteProductsSummary");
  if (!summary) return;

  const ids = zvGetCartItems();
  const data = await zvGetProductsData();
  if (!data || !ids.length) {
    summary.innerHTML = "";
    return;
  }

  const products = ids
    .map((id) => data.products.find((p) => p.id === id))
    .filter(Boolean);

  summary.innerHTML = `
    <p class="zv-quote-products-label">Vehículos incluidos en esta cotización:</p>
    <ul class="zv-quote-products-list">
      ${products
        .map(
          (p) => `
        <li>
          <span class="zv-quote-product-name">${p.name}</span>
          <span class="zv-quote-product-price">${zvFormatUSD(p.unitPriceUSD)}/u · MOQ ${p.moq} uds.</span>
        </li>`,
        )
        .join("")}
    </ul>`;
}

async function zvHandleQuoteSubmit() {
  const form = document.getElementById("zvQuoteForm");
  const submitBtn = document.getElementById("zvQuoteSubmitBtn");
  const errorDiv = document.getElementById("zvQuoteError");

  // Validación nativa de Bootstrap
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";
  errorDiv.classList.add("d-none");

  try {
    const fd = new FormData(form);
    const ids = zvGetCartItems();
    const data = await zvGetProductsData();

    const productosTexto = ids
      .map((id) => {
        const p = data?.products.find((p) => p.id === id);
        return p
          ? `${p.name} (${zvFormatUSD(p.unitPriceUSD)}/u, MOQ: ${p.moq})`
          : id;
      })
      .join(" | ");

    const payload = {
      _subject: `Nueva cotización B2B — ${fd.get("razon_social")}`,
      ruc: fd.get("ruc"),
      razon_social: fd.get("razon_social"),
      cargo: fd.get("cargo"),
      email: fd.get("email"),
      telefono: fd.get("telefono"),
      proyeccion_mensual: fd.get("proyeccion_mensual"),
      comentarios: fd.get("comentarios") || "—",
      productos_solicitados: productosTexto,
    };

    const res = await fetch(ZV_FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // T-25: mostrar confirmación y limpiar carrito
    document.getElementById("zvQuoteFormState").classList.add("d-none");
    document.getElementById("zvQuoteSuccessState").classList.remove("d-none");
    zvClearCart();
  } catch (err) {
    console.error("Error al enviar cotización:", err);
    errorDiv.classList.remove("d-none");
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar solicitud";
  }
}

function zvResetQuoteModal() {
  const form = document.getElementById("zvQuoteForm");
  if (form) {
    form.reset();
    form.classList.remove("was-validated");
  }

  document.getElementById("zvQuoteFormState")?.classList.remove("d-none");
  document.getElementById("zvQuoteSuccessState")?.classList.add("d-none");
  document.getElementById("zvQuoteError")?.classList.add("d-none");

  const submitBtn = document.getElementById("zvQuoteSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar solicitud";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const zvCartOffcanvasEl = document.getElementById("zvCartOffcanvas");
  if (!zvCartOffcanvasEl) return;

  // Abre el sidebar → renderiza el contenido del carrito
  zvCartOffcanvasEl.addEventListener("show.bs.offcanvas", zvRenderCartSidebar);

  // Si el carrito cambia mientras el sidebar está abierto, re-renderiza
  document.addEventListener("zv:cartUpdated", () => {
    if (zvCartOffcanvasEl.classList.contains("show")) {
      zvRenderCartSidebar();
    }
  });

  /* ── FORMULARIO DE COTIZACIÓN — T-23 / T-24 / T-25 ── */

  const zvQuoteModalEl = document.getElementById("zvQuoteModal");
  if (!zvQuoteModalEl) return;

  const zvQuoteModal = new bootstrap.Modal(zvQuoteModalEl);
  const zvRequestQuoteBtn = document.getElementById("zvRequestQuoteBtn");
  let zvOpenQuoteAfterClose = false;

  // "Solicitar cotización" → poblar resumen → cerrar offcanvas → abrir modal
  zvRequestQuoteBtn?.addEventListener("click", async () => {
    await zvPopulateQuoteProductsSummary();
    zvOpenQuoteAfterClose = true;
    bootstrap.Offcanvas.getInstance(zvCartOffcanvasEl)?.hide();
  });

  // Esperar a que el offcanvas termine de cerrarse para abrir el modal sin solapamiento visual
  zvCartOffcanvasEl.addEventListener("hidden.bs.offcanvas", () => {
    if (!zvOpenQuoteAfterClose) return;
    zvOpenQuoteAfterClose = false;
    zvQuoteModal.show();
  });

  // Resetear el modal cada vez que se cierre (formulario limpio para la próxima apertura)
  zvQuoteModalEl.addEventListener("hidden.bs.modal", zvResetQuoteModal);

  // Envío del formulario (T-24: Formspree / T-25: confirmación + limpiar carrito)
  document
    .getElementById("zvQuoteForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await zvHandleQuoteSubmit();
    });
});
