import { getProductById, products } from "../data/products.js";
import { productGrid } from "../components/productCard.js";
import { formatCurrency, formatNumber } from "../utils/formatCurrency.js";
import { addCartItem, isLoggedIn, setPendingRoute } from "../utils/storage.js";
import { emptyState, escapeHtml, toast } from "../utils/ui.js";

export function render({ params }) {
  const product = getProductById(params.id);
  if (!product) return emptyState({ icon: "package-x", title: "Produk tidak ditemukan", message: "Produk mungkin sudah tidak tersedia.", action: `<a class="btn btn-primary" href="#/products">Kembali ke katalog</a>` });
  const similar = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 4);

  return `
    <section class="container breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/category/${product.categoryId}">${product.category}</a><span>/</span><strong>${escapeHtml(product.name)}</strong></section>
    <section class="container detail-layout">
      <div class="detail-gallery">
        <div class="detail-main-image"><img src="${product.image}" alt="${escapeHtml(product.name)}" /><button class="wishlist-float" aria-label="Simpan produk"><span data-lucide="heart"></span></button></div>
        <div class="thumbnail-row">${[product.image, ...products.filter((item) => item.categoryId === product.categoryId).slice(0, 3).map((item) => item.image)].map((image, index) => `<button class="${index === 0 ? "active" : ""}" data-detail-image="${image}"><img src="${image}" alt="" /></button>`).join("")}</div>
      </div>
      <article class="detail-info">
        <span class="detail-category">${product.category}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="detail-social"><span><span data-lucide="star"></span><b>${product.rating}</b> (328 ulasan)</span><span>${formatNumber(product.sold)} terjual</span><span>Stok ${product.stock}</span></div>
        <div class="detail-price"><strong>${formatCurrency(product.price)}</strong>${product.discount ? `<span>${formatCurrency(product.originalPrice)}</span><b>Hemat ${product.discount}%</b>` : ""}</div>
        <div class="detail-benefits"><span><span data-lucide="truck"></span><b>Gratis ongkir</b><small>Estimasi tiba 2-4 hari</small></span><span><span data-lucide="shield-check"></span><b>Garansi aman</b><small>Retur dalam 7 hari</small></span></div>
        ${product.variants.length ? `<div class="variant-picker"><label>Pilih variasi</label><div>${product.variants.map((variant, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-variant="${escapeHtml(variant)}">${escapeHtml(variant)}</button>`).join("")}</div></div>` : ""}
        <div class="purchase-row"><div class="qty-control"><button type="button" data-qty-dec aria-label="Kurangi jumlah"><span data-lucide="minus"></span></button><input id="detail-qty" value="1" readonly aria-label="Jumlah produk" /><button type="button" data-qty-inc aria-label="Tambah jumlah"><span data-lucide="plus"></span></button></div><button class="btn btn-soft" type="button" id="detail-add-cart"><span data-lucide="shopping-cart"></span>Tambah ke Keranjang</button><button class="btn btn-primary" type="button" id="detail-buy-now">Beli Sekarang</button></div>
        <div class="store-detail"><div class="store-avatar">${product.store.initials}</div><div><span class="store-badge"><span data-lucide="badge-check"></span>${product.store.badge}</span><h3>${product.store.name}</h3><p>${product.store.location} · Online 12 menit lalu</p></div><button class="btn btn-secondary">Kunjungi Toko</button></div>
      </article>
    </section>
    <section class="container detail-content-grid">
      <article class="content-card"><h2>Deskripsi Produk</h2><p>${escapeHtml(product.description)}</p><h3>Keunggulan produk</h3><ul>${product.highlights.map((item) => `<li><span data-lucide="circle-check"></span>${item}</li>`).join("")}</ul></article>
      <aside class="content-card guarantee-card"><span data-lucide="shield-check"></span><h3>Jaminan PasarKita</h3><p>Dana baru diteruskan ke seller setelah pesanan diterima.</p><div><span data-lucide="rotate-ccw"></span>Retur mudah 7 hari</div><div><span data-lucide="headphones"></span>Bantuan pelanggan 24/7</div></aside>
    </section>
    <section class="container section-block"><div class="section-heading"><div><span class="eyebrow">Mungkin kamu suka</span><h2>Produk serupa</h2></div><a href="#/category/${product.categoryId}">Lihat semua <span data-lucide="arrow-right"></span></a></div>${productGrid(similar)}</section>
  `;
}

export function afterRender({ params, navigate }) {
  const product = getProductById(params.id);
  let qty = 1;
  let variant = product.variants[0] || "";
  const input = document.querySelector("#detail-qty");
  document.querySelectorAll("[data-variant]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-variant]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    variant = button.dataset.variant;
  }));
  document.querySelector("[data-qty-inc]")?.addEventListener("click", () => { qty = Math.min(product.stock, qty + 1); input.value = qty; });
  document.querySelector("[data-qty-dec]")?.addEventListener("click", () => { qty = Math.max(1, qty - 1); input.value = qty; });
  document.querySelectorAll("[data-detail-image]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-detail-image]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(".detail-main-image img").src = button.dataset.detailImage;
  }));
  document.querySelector("#detail-add-cart")?.addEventListener("click", () => { addCartItem(product.id, qty, variant); toast("Produk ditambahkan ke keranjang."); });
  document.querySelector("#detail-buy-now")?.addEventListener("click", () => {
    addCartItem(product.id, qty, variant);
    if (!isLoggedIn()) { setPendingRoute("/checkout"); navigate("/login"); return; }
    navigate("/checkout");
  });
}
