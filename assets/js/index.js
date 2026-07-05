/**
 * index.js — T-19
 * Carga products.json y renderiza la sección "Vehículos Destacados" de index.html,
 * filtrando solo los productos con featured:true. Reutiliza las clases de tarjeta
 * de catalog.js (.zv-product-card) para mantener consistencia visual, incluyendo
 * el botón "Agregar a cotización" ya preparado para Sprint 3 (T-18/T-20).
 *
 * Usa zvFormatUSD y zvGetCategoryName definidas en main.js (cargado antes que
 * este archivo en index.html) en vez de duplicarlas localmente.
 */

const ZV_PLACEHOLDER_IMG =
  "https://placehold.co/400x300/1A2D42/F2EFEB?text=ZhiVolt";
const ZV_MAX_FEATURED = 6;

function zvBuildFeaturedCard(product, categories, index = 0) {
  const firstImage = product.images?.[0] || ZV_PLACEHOLDER_IMG;
  const licenseBadge = product.licenseRequired
    ? '<span class="zv-badge zv-badge--license"><i class="fa-solid fa-id-card"></i> Requiere licencia</span>'
    : '<span class="zv-badge zv-badge--nolicense"><i class="fa-solid fa-check"></i> Sin licencia</span>';
  const delay = (index % 3) * 100;

  return `
    <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${delay}">
      <article class="zv-product-card">
        <div class="zv-product-img-wrap">
          <img src="${firstImage}" alt="${product.name}" class="zv-product-img"
               loading="lazy" decoding="async"
               onerror="this.onerror=null;this.src='${ZV_PLACEHOLDER_IMG}';">
          <span class="zv-badge zv-badge--category">${zvGetCategoryName(product.category, categories)}</span>
        </div>
        <div class="zv-product-body">
          <h5>${product.name}</h5>
          ${licenseBadge}
          <p class="zv-product-price">Desde ${zvFormatUSD(product.unitPriceUSD)} <span>/ unidad</span></p>
          <p class="zv-product-moq"><i class="fa-solid fa-boxes-stacked me-1"></i>MOQ: ${product.moq} unidades</p>
          <div class="zv-product-actions">
            <a href="producto.html?id=${product.id}" class="zv-btn zv-btn--outline-navy zv-btn--sm">Ver ficha técnica</a>
            <button type="button" class="zv-btn zv-btn--steel zv-btn--sm zv-add-to-quote" data-product-id="${product.id}">
              Agregar a cotización
            </button>
          </div>
        </div>
      </article>
    </div>`;
}

async function zvInitFeatured() {
  const grid = document.getElementById("zvFeaturedGrid");
  const emptyMsg = document.getElementById("zvFeaturedEmpty");
  const errorMsg = document.getElementById("zvFeaturedError");
  if (!grid) return;

  try {
    const response = await fetch(ZV_PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const featured = data.products
      .filter((p) => p.featured)
      .slice(0, ZV_MAX_FEATURED);

    if (!featured.length) {
      emptyMsg.classList.remove("d-none");
      return;
    }

    grid.innerHTML = featured
      .map((p, index) => zvBuildFeaturedCard(p, data.categories, index))
      .join("");
    zvInitAddToQuoteButtons(grid); // pinta "Agregar"/"Quitar" según el carrito ya guardado (T-18)

    // T-32: refresca AOS para que calcule la posición real de las tarjetas
    // recién inyectadas (main.js ya corrió AOS.init() antes de este fetch).
    if (typeof AOS !== "undefined") AOS.refresh();
  } catch (error) {
    console.error("Error al cargar los vehículos destacados:", error);
    errorMsg.classList.remove("d-none");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("zvFeaturedGrid")) {
    zvInitFeatured();
  }
});
