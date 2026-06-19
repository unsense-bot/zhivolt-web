/**
 * product.js — T-15
 * Lee ?id= de la URL, busca el producto en products.json y renderiza su info básica.
 * Galería (T-16), tabla de specs (T-17) y botón funcional (T-18) se conectan después.
 */

const ZV_PRODUCTS_URL = 'assets/data/products.json';
const ZV_PLACEHOLDER_IMG = 'https://placehold.co/600x450/1A2D42/F2EFEB?text=ZhiVolt';

const zvFormatUSD = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function zvRenderProductBasicInfo(product, categories) {
  const category = categories.find((c) => c.id === product.category);

  document.getElementById('zvPageTitle').textContent = `${product.name} | ZhiVolt`;
  document.getElementById('zvBreadcrumbCurrent').textContent = product.name;
  document.getElementById('zvProductCategory').textContent = category ? category.name : product.category;
  document.getElementById('zvProductName').textContent = product.name;
  document.getElementById('zvProductPrice').innerHTML = `Desde ${zvFormatUSD(product.unitPriceUSD)} <span>/ unidad</span>`;
  document.getElementById('zvProductMoq').textContent = product.moq;
  document.getElementById('zvProductWarranty').textContent = product.warranty;
  document.getElementById('zvProductCerts').textContent = (product.certifications || []).join(', ') || '—';

  const licenseHtml = product.licenseRequired
    ? `<span class="zv-badge zv-badge--license"><i class="fa-solid fa-id-card"></i> Requiere licencia</span>`
    : `<span class="zv-badge zv-badge--nolicense"><i class="fa-solid fa-check"></i> Sin licencia</span>`;
  document.getElementById('zvProductLicenseBadgeWrap').innerHTML =
    `${licenseHtml} <span class="zv-license-note-inline">${product.licenseNote || ''}</span>`;

  // Imagen principal: placeholder funcional hasta que T-16 construya la galería con thumbnails
  const mainImg = document.getElementById('zvProductMainImg');
  mainImg.src = product.images?.[0] || ZV_PLACEHOLDER_IMG;
  mainImg.alt = product.name;
  mainImg.onerror = () => { mainImg.onerror = null; mainImg.src = ZV_PLACEHOLDER_IMG; };

  document.getElementById('zvAddToQuoteBtn').dataset.productId = product.id;
}

async function zvInitProductPage() {
  const detailSection = document.getElementById('zvProductDetail');
  const errorMsg = document.getElementById('zvProductError');

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    detailSection.classList.add('d-none');
    errorMsg.classList.remove('d-none');
    return;
  }

  try {
    const response = await fetch(ZV_PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const product = data.products.find((p) => p.id === productId);

    if (!product) {
      detailSection.classList.add('d-none');
      errorMsg.classList.remove('d-none');
      return;
    }

    zvRenderProductBasicInfo(product, data.categories);
  } catch (error) {
    console.error('Error al cargar el producto:', error);
    detailSection.classList.add('d-none');
    errorMsg.classList.remove('d-none');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('zvProductDetail')) {
    zvInitProductPage();
  }
});
