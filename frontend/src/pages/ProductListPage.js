import { ProductCard } from "../components/ProductCard.js";
import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import { getProducts } from "../services/productService.js";
import { addToCart } from "../services/cartService.js";
import { escapeHtml } from "../utils/validation.js";
import { renderIcons } from "../icons.js";

const categoryOptions = ["Semua", "Makanan", "Minuman", "Kesehatan", "Kerajinan", "Fashion"];

export async function render({ query }) {
  const keyword = query.get("q") || query.get("keyword") || "";
  const category = query.get("category") || "Semua";
  const sort = query.get("sort") || "";

  let products = [];
  let total = 0;
  let hasError = false;
  let errorMessage = "";

  try {
    const catalog = await getProducts({
      q: keyword,
      category: category === "Semua" ? "" : category,
      sort,
    });
    products = catalog.items || [];
    total = products.length;
  } catch (error) {
    hasError = true;
    errorMessage = error.message || "Gagal memuat produk.";
  }

  const categorySelectOptions = categoryOptions
    .map(
      (opt) => `
        <option value="${opt}" ${opt === category ? "selected" : ""}>
          ${opt}
        </option>
      `
    )
    .join("");

  return `
    <section class="catalog-hero" style="background: linear-gradient(135deg, var(--blue-600) 0%, #1e40af 100%); color: var(--white); padding: 32px; border-radius: var(--radius-sm); margin-bottom: 28px; box-shadow: var(--shadow-sm); display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 280px;">
        <span class="eyebrow" style="color: var(--blue-100); font-weight: 800; font-size: 12px; text-transform: uppercase;">UMKM Katalog</span>
        <h1 style="color: var(--white); font-size: 34px; margin: 8px 0 12px; font-weight: 800; line-height: 1.2;">Jelajahi Produk Pilihan Nusantara</h1>
        <p style="color: var(--blue-100); font-size: 15px; max-width: 600px;">
          Beli produk lokal berkualitas langsung dari produsen pilihan. Transaksi aman, pengiriman cepat, dan dukung UMKM nasional tumbuh bersama PasarKita.
        </p>
      </div>
      <div class="scope-card" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 18px; border-radius: var(--radius-sm); font-size: 13px; color: var(--white); display: flex; flex-direction: column; gap: 6px; min-width: 220px;">
        <strong style="font-size: 14px; margin-bottom: 4px; display: block; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 4px;">Keunggulan PasarKita</strong>
        <span>✓ Dukungan Pembayaran Digital</span>
        <span>✓ Pengiriman Cepat & Aman</span>
        <span>✓ Fee Transaksi Rendah (2%)</span>
        <span>✓ Produk UMKM 100% Terverifikasi</span>
      </div>
    </section>

    <section class="catalog-layout-container">
      <!-- Sidebar Filters (Tokopedia Style) -->
      <aside class="catalog-filter-sidebar">
        <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; border-bottom: 1px solid var(--slate-100); padding-bottom: 8px; color: var(--slate-900);">Filter Produk</h2>
        <form id="product-filter-form" style="display: flex; flex-direction: column; gap: 16px;">
          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Kata Kunci</span>
            <input
              name="q"
              value="${escapeHtml(keyword)}"
              placeholder="Cari kopi, tempe, batik..."
              style="padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--slate-200); width: 100%;"
            />
          </label>

          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Kategori</span>
            <select name="category" style="padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--slate-200); background: var(--white);">
              ${categorySelectOptions}
            </select>
          </label>

          <label style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Urutkan Harga</span>
            <select name="sort" style="padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--slate-200); background: var(--white);">
              <option value="" ${sort === "" ? "selected" : ""}>Default</option>
              <option value="price_asc" ${sort === "price_asc" ? "selected" : ""}>Termurah</option>
              <option value="price_desc" ${sort === "price_desc" ? "selected" : ""}>Termahal</option>
            </select>
          </label>
        </form>
      </aside>

      <!-- Main Product Area -->
      <div class="products-area">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 14px; color: var(--slate-500); font-weight: 700;">
            Menampilkan <strong id="products-count" style="color: var(--slate-900);">${total}</strong> produk
          </div>
        </div>

        <div id="products-list-container">
          ${
            hasError
              ? `<div style="background: var(--red-50); border: 1px solid var(--red-100); color: var(--red-700); padding: 16px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;">
                   <span data-lucide="circle-alert"></span>
                   <span>${escapeHtml(errorMessage)}</span>
                 </div>`
              : products.length
                ? `<div class="product-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
                     ${products.map(ProductCard).join("")}
                   </div>`
                : EmptyState({
                    title: "Produk tidak ditemukan",
                    message: "Coba gunakan kata kunci atau filter lain.",
                  })
          }
        </div>
      </div>
    </section>
  `;
}

export function afterRender({ navigate, renderRoute }) {
  const form = document.querySelector("#product-filter-form");
  if (!form) return;

  const qInput = form.querySelector("input[name='q']");
  const categorySelect = form.querySelector("select[name='category']");
  const sortSelect = form.querySelector("select[name='sort']");
  const listContainer = document.querySelector("#products-list-container");
  const countEl = document.querySelector("#products-count");

  const updateResults = async () => {
    if (!listContainer) return;

    listContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; gap: 12px; color: var(--slate-500);">
        <span data-lucide="loader-circle" class="spin" style="width: 36px; height: 36px; animation: spin 1s linear infinite; color: var(--blue-600); display: inline-block;"></span>
        <span>Memperbarui daftar produk...</span>
      </div>
    `;
    renderIcons();

    try {
      const qVal = qInput?.value.trim() || "";
      const catVal = categorySelect?.value || "Semua";
      const sortVal = sortSelect?.value || "";

      const catalog = await getProducts({
        q: qVal,
        category: catVal === "Semua" ? "" : catVal,
        sort: sortVal,
      });

      const items = catalog.items || [];
      if (countEl) countEl.textContent = items.length;

      if (items.length > 0) {
        listContainer.innerHTML = `
          <div class="product-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
            ${items.map(ProductCard).join("")}
          </div>
        `;
      } else {
        listContainer.innerHTML = EmptyState({
          title: "Produk tidak ditemukan",
          message: "Coba gunakan kata kunci atau filter lain.",
        });
      }

      renderIcons();
      bindAddToCartEvents();

    } catch (err) {
      listContainer.innerHTML = `
        <div style="background: var(--red-50); border: 1px solid var(--red-100); color: var(--red-700); padding: 16px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;">
          <span data-lucide="circle-alert"></span>
          <span>Gagal memuat produk. Silakan coba lagi.</span>
        </div>
      `;
      renderIcons();
    }
  };

  const debouncedUpdate = debounce(updateResults, 300);

  qInput?.addEventListener("input", debouncedUpdate);
  categorySelect?.addEventListener("change", updateResults);
  sortSelect?.addEventListener("change", updateResults);

  const bindAddToCartEvents = () => {
    document.querySelectorAll("[data-add-cart]").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const productId = button.dataset.addCart;
        try {
          await addToCart(productId, 1);
          showToast("Produk masuk ke keranjang.");
          window.dispatchEvent(new Event("pasarkita:cart-updated"));
        } catch (error) {
          showToast(error.message || "Produk belum tersedia.", "error");
        }
      });
    });
  };

  bindAddToCartEvents();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
