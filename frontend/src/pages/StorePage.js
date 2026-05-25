import { getStore, listStores } from "../api/marketplaceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { escapeHtml } from "../utils/validation.js";

function productCard(product) {
  return `
    <a class="product-card" href="#/products/${escapeHtml(product.product_id)}">
      <div class="product-media">${product.image_url ? `<img src="${escapeHtml(product.image_url)}" alt="" />` : `<span>${escapeHtml(product.kategori || "PK")}</span>`}</div>
      <div class="product-card-body">
        <strong>${escapeHtml(product.nama_produk)}</strong>
        <span>${formatCurrency(product.harga)}</span>
        <small>Terjual ${product.sold_count || 0} - ${Number(product.rating_avg || 0).toFixed(1)}</small>
      </div>
    </a>
  `;
}

export async function render({ params }) {
  if (!params.id) {
    const response = await listStores();
    const stores = response.data || [];
    return `
      <section class="page-title split-title">
        <div>
          <p class="eyebrow">Toko</p>
          <h1>Etalase toko UMKM</h1>
          <p>Browse toko aktif seperti flow marketplace besar.</p>
        </div>
        <a class="secondary-button" href="#/products">Produk</a>
      </section>
      <section class="product-grid">
        ${stores.map((store) => `
          <a class="store-card card-panel" href="#/stores/${escapeHtml(store.store_id)}">
            <strong>${escapeHtml(store.name)}</strong>
            <span>${escapeHtml(store.city || "-")}, ${escapeHtml(store.province || "-")}</span>
            <small>${Number(store.rating_average || 0).toFixed(1)} rating - ${store.review_count || 0} ulasan</small>
          </a>
        `).join("")}
      </section>
    `;
  }

  const response = await getStore(params.id);
  const store = response.data?.store || {};
  const products = response.data?.products || [];
  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Toko</p>
        <h1>${escapeHtml(store.name || params.id)}</h1>
        <p>${escapeHtml(store.description || "")}</p>
      </div>
      <a class="secondary-button" href="#/stores">Semua toko</a>
    </section>
    <section class="store-hero card-panel">
      <div>
        <strong>${escapeHtml(store.city || "-")}, ${escapeHtml(store.province || "-")}</strong>
        <span>${Number(store.rating_average || 0).toFixed(1)} rating - ${store.review_count || 0} ulasan</span>
      </div>
      <a class="secondary-button" href="#/chat">Chat toko</a>
    </section>
    <section class="product-grid">
      ${products.map(productCard).join("")}
    </section>
  `;
}

export function afterRender() {}
