/**
 * product.js — T-15, T-16, T-17
 * Lee ?id= de la URL, busca el producto en products.json, renderiza info básica,
 * galería de imágenes (hasta 5) con thumbnails clicables y ficha técnica dinámica.
 * Botón funcional de "Agregar a cotización" (T-18) se conecta en Sprint 3,
 * cuando exista quote-cart.js.
 *
 * Usa zvFormatUSD y zvGetCategoryName definidas en main.js (cargado antes que
 * este archivo en producto.html) en vez de duplicarlas localmente.
 */

const ZV_PRODUCTS_URL = "assets/data/products.json";
const ZV_PLACEHOLDER_IMG =
  "https://placehold.co/600x450/1A2D42/F2EFEB?text=ZhiVolt";

function zvRenderProductBasicInfo(product, categories) {
  document.getElementById("zvPageTitle").textContent =
    `${product.name} | ZhiVolt`;
  document.getElementById("zvBreadcrumbCurrent").textContent = product.name;
  document.getElementById("zvProductCategory").textContent = zvGetCategoryName(
    product.category,
    categories,
  );
  document.getElementById("zvProductName").textContent = product.name;
  document.getElementById("zvProductPrice").innerHTML =
    `Desde ${zvFormatUSD(product.unitPriceUSD)} <span>/ unidad</span>`;
  document.getElementById("zvProductMoq").textContent = product.moq;
  document.getElementById("zvProductWarranty").textContent = product.warranty;
  document.getElementById("zvProductCerts").textContent =
    (product.certifications || []).join(", ") || "—";

  const licenseHtml = product.licenseRequired
    ? `<span class="zv-badge zv-badge--license"><i class="fa-solid fa-id-card"></i> Requiere licencia</span>`
    : `<span class="zv-badge zv-badge--nolicense"><i class="fa-solid fa-check"></i> Sin licencia</span>`;
  document.getElementById("zvProductLicenseBadgeWrap").innerHTML =
    `${licenseHtml} <span class="zv-license-note-inline">${product.licenseNote || ""}</span>`;

  document.getElementById("zvAddToQuoteBtn").dataset.productId = product.id;

  zvRenderDescription(product);
  zvRenderGallery(product);
  zvRenderSpecTable(product);
}

/**
 * Muestra el párrafo de descripción comercial si el producto lo trae.
 * Campo opcional en products.json: si no existe, la sección queda oculta
 * (compatible con los productos de ejemplo que no lo tienen).
 */
function zvRenderDescription(product) {
  const wrap = document.getElementById("zvProductDescription");
  const text = document.getElementById("zvProductDescriptionText");
  if (!wrap || !text) return;

  if (!product.description) {
    wrap.classList.add("d-none");
    return;
  }

  text.textContent = product.description;
  wrap.classList.remove("d-none");
}

const ZV_MAX_GALLERY_IMAGES = 5;

function zvRenderGallery(product) {
  const mainImg = document.getElementById("zvProductMainImg");
  const thumbsWrap = document.getElementById("zvProductThumbs");

  const images = (
    product.images?.length ? product.images : [ZV_PLACEHOLDER_IMG]
  ).slice(0, ZV_MAX_GALLERY_IMAGES);

  const setMainImage = (src) => {
    mainImg.src = src;
    mainImg.alt = product.name;
    mainImg.onerror = () => {
      mainImg.onerror = null;
      mainImg.src = ZV_PLACEHOLDER_IMG;
    };
  };

  setMainImage(images[0]);

  // Con una sola imagen no tiene sentido mostrar thumbnails
  if (images.length <= 1) {
    thumbsWrap.innerHTML = "";
    return;
  }

  thumbsWrap.innerHTML = images
    .map(
      (src, i) => `
      <button type="button" class="zv-gallery-thumb-btn ${i === 0 ? "active" : ""}" data-src="${src}" aria-label="Ver imagen ${i + 1}">
        <img src="${src}" alt="${product.name} - vista ${i + 1}"
             onerror="this.onerror=null;this.src='${ZV_PLACEHOLDER_IMG}';">
      </button>`,
    )
    .join("");

  thumbsWrap.querySelectorAll(".zv-gallery-thumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      thumbsWrap
        .querySelectorAll(".zv-gallery-thumb-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setMainImage(btn.dataset.src);
    });
  });
}

/**
 * Renderiza la ficha técnica iterando las claves del objeto `specs`.
 * No se hardcodean nombres de campo: cada categoría (scooter, moto, minicar)
 * trae specs distintas en products.json, y este enfoque no requiere
 * cambios de código cuando lleguen los 15 productos reales.
 */
function zvRenderSpecTable(product) {
  const grid = document.getElementById("zvProductSpecsGrid");
  const entries = Object.entries(product.specs || {});

  if (!entries.length) {
    grid.innerHTML = `<p class="zv-spec-empty">Ficha técnica no disponible para este modelo.</p>`;
    return;
  }

  grid.innerHTML = entries
    .map(
      ([key, value]) => `
      <div class="zv-spec-item">
        <span class="zv-spec-key">${key}</span>
        <span class="zv-spec-value">${value}</span>
      </div>`,
    )
    .join("");
}

async function zvInitProductPage() {
  const detailSection = document.getElementById("zvProductDetail");
  const errorMsg = document.getElementById("zvProductError");

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    detailSection.classList.add("d-none");
    errorMsg.classList.remove("d-none");
    return;
  }

  try {
    const response = await fetch(ZV_PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const product = data.products.find((p) => p.id === productId);

    if (!product) {
      detailSection.classList.add("d-none");
      errorMsg.classList.remove("d-none");
      return;
    }

    zvRenderProductBasicInfo(product, data.categories);
  } catch (error) {
    console.error("Error al cargar el producto:", error);
    detailSection.classList.add("d-none");
    errorMsg.classList.remove("d-none");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("zvProductDetail")) {
    zvInitProductPage();
  }
});
