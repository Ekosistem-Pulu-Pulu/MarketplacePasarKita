import { ProductGrid } from "../components/ProductGrid.js";
import { showToast } from "../components/Toast.js";
import { addToCart } from "../services/cartService.js";
import { getProduct, getProducts } from "../services/productService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

export async function render({ params }) {
  const product = await getProduct(params.id);

  if (!product) {
    return `
      <section class="state-panel">
        <span class="state-icon" data-lucide="shopping-bag"></span>
        <h1>Produk belum tersedia</h1>
        <p>Produk yang kamu cari tidak ada di katalog saat ini.</p>
        <a class="btn btn-primary" href="#/products">Buka katalog</a>
      </section>
    `;
  }

  const similarProducts = (await getProducts({ category: product.category, limit: 8 })).items
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return `
    <section class="product-detail">
      <div class="detail-gallery">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
        <div class="detail-badges">
          <span class="category-chip">${escapeHtml(product.category)}</span>
          ${product.discount ? `<span class="discount-badge">${product.discount}%</span>` : ""}
        </div>
      </div>

      <article class="detail-info">
        <div class="detail-title-row">
          <span class="eyebrow">Detail produk</span>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="product-social-proof">
            <span><span data-lucide="star"></span>${product.rating.toFixed(1)} rating</span>
            <span>${product.sold} terjual</span>
            <span>${product.stock} stok</span>
          </div>
        </div>

        <div class="price-stack">
          <strong>${formatCurrency(product.price)}</strong>
          ${
            product.originalPrice
              ? `<span>${formatCurrency(product.originalPrice)}</span>`
              : ""
          }
        </div>

        <p class="detail-description">${escapeHtml(product.description)}</p>

        <div class="store-panel">
          <span class="store-avatar" data-lucide="store"></span>
          <div>
            <strong>${escapeHtml(product.store.name)}</strong>
            <p>${escapeHtml(product.store.location)} - Rating toko ${product.store.rating.toFixed(1)}</p>
          </div>
        </div>

        <div class="spec-list">
          ${product.specs
            .map(
              (spec) => `
                <span><span data-lucide="check"></span>${escapeHtml(spec)}</span>
              `
            )
            .join("")}
        </div>

        <div class="purchase-panel">
          <label>
            <span>Jumlah beli</span>
            <div class="quantity-stepper large">
              <button type="button" id="qty-dec" disabled><span data-lucide="minus"></span></button>
              <input id="qty-input" type="number" min="1" max="${product.stock}" value="1" />
              <button type="button" id="qty-inc"><span data-lucide="plus"></span></button>
            </div>
          </label>
          <div class="subtotal-preview">
            <span>Subtotal</span>
            <strong id="subtotal-preview" data-price="${product.price}">${formatCurrency(product.price)}</strong>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn btn-primary" id="buy-now" type="button">
            <span data-lucide="shopping-bag"></span>
            Beli sekarang
          </button>
          <button class="btn btn-secondary" id="add-cart" type="button">
            <span data-lucide="shopping-cart"></span>
            Tambah ke keranjang
          </button>
        </div>
      </article>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Produk serupa</span>
          <h2>Pilihan lain dari kategori ${escapeHtml(product.category)}</h2>
        </div>
        <a class="text-link" href="#/products?category=${encodeURIComponent(product.category)}">Lihat kategori</a>
      </div>
      ${ProductGrid({
        products: similarProducts,
        emptyTitle: "Produk serupa belum tersedia",
        emptyMessage: "Buka katalog untuk menemukan pilihan lain.",
      })}
    </section>
  `;
}

export function afterRender({ params, navigate, renderRoute }) {
  const input = document.querySelector("#qty-input");
  const dec = document.querySelector("#qty-dec");
  const inc = document.querySelector("#qty-inc");
  const subtotal = document.querySelector("#subtotal-preview");
  const productState = {
    price: Number(subtotal?.dataset.price || 0),
    stock: Number(input?.max || 1),
  };

  function getQty() {
    return Math.max(1, Math.min(productState.stock, Number(input.value || 1)));
  }

  function syncQty(nextQty = getQty()) {
    input.value = String(nextQty);
    dec.disabled = nextQty <= 1;
    inc.disabled = nextQty >= productState.stock;
    subtotal.textContent = formatCurrency(productState.price * nextQty);
  }

  dec?.addEventListener("click", () => syncQty(getQty() - 1));
  inc?.addEventListener("click", () => syncQty(getQty() + 1));
  input?.addEventListener("input", () => syncQty());

  document.querySelector("#add-cart")?.addEventListener("click", async () => {
    try {
      await addToCart(params.id, getQty());
      showToast("Produk masuk ke keranjang.");
      renderRoute();
    } catch (error) {
      showToast(error.message || "Produk belum tersedia.", "error");
    }
  });

  document.querySelector("#buy-now")?.addEventListener("click", async () => {
    try {
      await addToCart(params.id, getQty());
      navigate("/cart");
    } catch (error) {
      showToast(error.message || "Produk belum tersedia.", "error");
    }
  });

  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", async () => {
      await addToCart(button.dataset.addCart, 1);
      showToast("Produk masuk ke keranjang.");
      renderRoute();
    });
  });
}
