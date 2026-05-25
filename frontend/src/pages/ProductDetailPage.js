import {
  addCartItem as addBackendCartItem,
  createDiscussion,
  getProductById,
  listDiscussions,
  listReviews,
} from "../api/marketplaceApi.js";
import { showToast } from "../components/Toast.js";
import { addCartItem } from "../utils/cart.js";
import { formatCurrency } from "../utils/currency.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";
import { isAuthenticated } from "../utils/storage.js";
import { escapeHtml, validateQuantity } from "../utils/validation.js";

export async function render({ params }) {
  const response = await getProductById(params.id);
  const product = response.data;
  const [reviewsResult, discussionsResult] = await Promise.allSettled([
    listReviews(product.product_id),
    listDiscussions(product.product_id),
  ]);
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value.data || [] : [];
  const discussions = discussionsResult.status === "fulfilled" ? discussionsResult.value.data || [] : [];
  const preview = calculateCheckoutPreview(product.harga, 1);
  const disabled = product.stok <= 0 || !product.status_aktif;
  window.__pasarkitaDetailProduct = product;

  return `
    <section class="detail-layout">
      <div class="detail-media card-panel" aria-hidden="true">
        ${
          product.image_url
            ? `<img src="${escapeHtml(product.image_url)}" alt="" />`
            : `<span>${escapeHtml(product.kategori.slice(0, 2).toUpperCase())}</span>`
        }
      </div>

      <article class="detail-panel card-panel">
        <p class="eyebrow">Detail produk</p>
        <h1>${escapeHtml(product.nama_produk)}</h1>
        <p>${escapeHtml(product.deskripsi)}</p>

        <dl class="detail-list">
          <div>
            <dt>Harga</dt>
            <dd>${formatCurrency(product.harga)}</dd>
          </div>
          <div>
            <dt>Stok</dt>
            <dd>${product.stok} item</dd>
          </div>
          <div>
            <dt>Kategori</dt>
            <dd>${escapeHtml(product.kategori)}</dd>
          </div>
          <div>
            <dt>Seller</dt>
            <dd>${escapeHtml(product.seller_id)}</dd>
          </div>
          <div>
            <dt>Toko</dt>
            <dd>${product.store_id ? `<a href="#/stores/${escapeHtml(product.store_id)}">${escapeHtml(product.store_id)}</a>` : "-"}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>${Number(product.rating_avg || 0).toFixed(1)} (${product.review_count || 0} ulasan)</dd>
          </div>
          <div>
            <dt>Terjual</dt>
            <dd>${product.sold_count || 0} item</dd>
          </div>
        </dl>

        <div class="quantity-panel">
          <label>
            <span>Quantity</span>
            <input
              id="qty-input"
              type="number"
              min="1"
              step="1"
              value="1"
              data-price="${product.harga}"
              data-stock="${product.stok}"
              ${disabled ? "disabled" : ""}
            />
          </label>
          <small id="qty-message">${disabled ? "Produk tidak bisa dicheckout." : ""}</small>
        </div>

        <div class="summary-lines detail-summary">
          <div>
            <span>Preview subtotal</span>
            <strong id="subtotal-preview">${formatCurrency(preview.subtotal)}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button
            class="primary-button"
            type="button"
            id="detail-checkout-button"
            ${disabled ? "disabled" : ""}
          >
            Lanjut checkout
          </button>
          <button
            class="secondary-button"
            type="button"
            id="detail-cart-button"
            ${disabled ? "disabled" : ""}
          >
            Tambah ke keranjang
          </button>
          <a class="secondary-button" href="#/products">Kembali ke produk</a>
        </div>
      </article>
    </section>

    <section class="content-grid two-cols">
      <article class="card-panel">
        <h2>Ulasan pembeli</h2>
        ${
          reviews.length
            ? reviews
                .map(
                  (review) => `
                    <div class="review-row">
                      <strong>${"★".repeat(Number(review.rating || 0))}</strong>
                      <p>${escapeHtml(review.comment || "-")}</p>
                      <small>${escapeHtml(review.user_id || "-")}</small>
                    </div>
                  `
                )
                .join("")
            : `<p class="muted">Belum ada ulasan.</p>`
        }
      </article>

      <article class="card-panel">
        <h2>Diskusi produk</h2>
        <form id="discussion-form" class="inline-form">
          <input class="input" name="message" placeholder="Tanya seller soal produk" />
          <button class="secondary-button" type="submit">Kirim</button>
        </form>
        ${
          discussions.length
            ? discussions
                .map(
                  (discussion) => `
                    <div class="review-row">
                      <p>${escapeHtml(discussion.message || "-")}</p>
                      ${discussion.reply ? `<small>Seller: ${escapeHtml(discussion.reply)}</small>` : `<small>Menunggu jawaban seller</small>`}
                    </div>
                  `
                )
                .join("")
            : `<p class="muted">Belum ada diskusi.</p>`
        }
      </article>
    </section>
  `;
}

export function afterRender({ params, navigate }) {
  const input = document.querySelector("#qty-input");
  const button = document.querySelector("#detail-checkout-button");
  const cartButton = document.querySelector("#detail-cart-button");
  const message = document.querySelector("#qty-message");
  const subtotalPreview = document.querySelector("#subtotal-preview");

  function syncQuantity() {
    const price = Number(input?.dataset.price || 0);
    const stock = Number(input?.dataset.stock || 0);
    const qty = Number(input?.value || 0);
    const validation = validateQuantity(qty, stock);
    const preview = calculateCheckoutPreview(price, validation.valid ? qty : 0);

    subtotalPreview.textContent = formatCurrency(preview.subtotal);
    message.textContent = validation.message;
    button.disabled = !validation.valid;
  }

  input?.addEventListener("input", syncQuantity);
  button?.addEventListener("click", () => {
    const qty = Number(input.value || 0);
    const validation = validateQuantity(qty, Number(input.dataset.stock || 0));

    if (!validation.valid) {
      syncQuantity();
      return;
    }

    const target = `/checkout/${params.id}?qty=${qty}`;
    navigate(isAuthenticated() ? target : `/login?redirect=${encodeURIComponent(target)}`);
  });

  cartButton?.addEventListener("click", async () => {
    const qty = Number(input.value || 0);
    const validation = validateQuantity(qty, Number(input.dataset.stock || 0));

    if (!validation.valid) {
      syncQuantity();
      return;
    }

    if (isAuthenticated()) {
      await addBackendCartItem(window.__pasarkitaDetailProduct.product_id, qty);
    } else {
      addCartItem(window.__pasarkitaDetailProduct, qty);
    }
    showToast("Produk masuk ke keranjang.");
  });

  document.querySelector("#discussion-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAuthenticated()) {
      navigate(`/login?redirect=${encodeURIComponent(`/products/${params.id}`)}`);
      return;
    }
    const message = String(new FormData(event.currentTarget).get("message") || "").trim();
    if (!message) return;
    await createDiscussion(params.id, message);
    showToast("Pertanyaan produk terkirim.");
    navigate(`/products/${params.id}`);
  });
}
