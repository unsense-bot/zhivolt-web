/**
 * catalog.js — T-12, T-13
 * Carga products.json, renderiza el grid y filtra por categoría.
 * "Agregar a cotización" funcional se conecta aquí en T-18 (Sprint 3).
 */

const ZV_PRODUCTS_URL = 'assets/data/products.json';
const ZV_PLACEHOLDER_IMG = 'https://placehold.co/400x300/1A2D42/F2EFEB?text=ZhiVolt';

let zvCatalogData = null; // cache en memoria, la usará T-13 para filtrar sin volver a hacer fetch

const zvFormatUSD = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function zvCategoryName(categoryId) {
  const cat = zvCatalogData?.categories.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

function zvBuildProductCard(product) {
  const firstImage = product.images?.[0] || ZV_PLACEHOLDER_IMG;
  const licenseBadge = product.licenseRequired
    ? '<span class="zv-badge zv-badge--license"><i class="fa-solid fa-id-card"></i> Requiere licencia</span>'
    : '<span class="zv-badge zv-badge--nolicense"><i class="fa-solid fa-check"></i> Sin licencia</span>';

  return `
    <div class="col-lg-4 col-md-6 zv-product-col" data-category="${product.category}">
      <article class="zv-product-card">
        <div class="zv-product-img-wrap">
          <img src="${firstImage}" alt="${product.name}" class="zv-product-img"
               onerror="this.onerror=null;this.src='${ZV_PLACEHOLDER_IMG}';">
          <span class="zv-badge zv-badge--category">${zvCategoryName(product.category)}</span>
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

function zvRenderCatalog(products) {
  const grid = document.getElementById('zvCatalogGrid');
  const emptyMsg = document.getElementById('zvCatalogEmpty');
  if (!grid) return;

  grid.innerHTML = products.map(zvBuildProductCard).join('');
  emptyMsg.classList.toggle('d-none', products.length > 0);
}

async function zvInitCatalog() {
  const errorMsg = document.getElementById('zvCatalogError');
  try {
    const response = await fetch(ZV_PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    zvCatalogData = await response.json();
    zvRenderCatalog(zvCatalogData.products);
  } catch (error) {
    console.error('Error al cargar el catálogo:', error);
    if (errorMsg) errorMsg.classList.remove('d-none');
  }
}

function zvInitCategoryFilters() {
  const filterBar = document.getElementById('zvCategoryFilters');
  const emptyMsg = document.getElementById('zvCatalogEmpty');
  if (!filterBar) return;

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.zv-filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.zv-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const category = btn.dataset.category;
    const cols = document.querySelectorAll('.zv-product-col');
    let visibleCount = 0;

    cols.forEach((col) => {
      const matches = category === 'all' || col.dataset.category === category;
      col.classList.toggle('d-none', !matches);
      if (matches) visibleCount++;
    });

    emptyMsg.classList.toggle('d-none', visibleCount > 0);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('zvCatalogGrid')) {
    zvInitCatalog();
    zvInitCategoryFilters();
  }
});
