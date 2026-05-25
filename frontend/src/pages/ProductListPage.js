import { ProductCard } from "../components/ProductCard.js";
import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import { browseProducts } from "../api/marketplaceApi.js";
import { addCartItem } from "../utils/cart.js";
import { isAuthenticated } from "../utils/storage.js";
import { escapeHtml } from "../utils/validation.js";

const categoryOptions = ["Semua", "Makanan", "Minuman", "Kesehatan", "Kerajinan", "Fashion"];

function applyClientFilters(products, { category, sort }) {
  let result = products.filter((product) => product.status_aktif);

  if (category && category !== "Semua") {
    result = result.filter((product) => product.kategori === category);
  }

  if (sort === "harga_asc") {
    result = [...result].sort((a, b) => a.harga - b.harga);
  }

  if (sort === "harga_desc") {
    result = [...result].sort((a, b) => b.harga - a.harga);
  }

  return result;
}

function buildQuery(values) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}

export async function render({ query }) {
  const keyword = query.get("keyword") || "";
  const category = query.get("category") || "Semua";
  const sort = query.get("sort") || "";
  const response = await browseProducts({
    keyword,
    category: category === "Semua" ? "" : category,
    sort,
    page: 1,
    limit: 50,
  });
  const products = applyClientFilters(response.data.items, { category, sort });
  window.__pasarkitaProducts = products;

  return `
    <section class="catalog-hero">
      <div>
        <p class="eyebrow">Marketplace PasarKita</p>
        <h1>Katalog UMKM dengan checkout request yang tetap melewati API Gateway.</h1>
        <p>
          Flow belanja mengikuti pola marketplace modern: cari produk, cek detail,
          tambah ke keranjang, checkout, lalu pantau status order dari Marketplace API.
        </p>
      </div>
      <aside class="scope-card">
        <strong>Aturan bisnis</strong>
        <span>Fee marketplace 2%</span>
        <span>Checkout tidak mengubah saldo</span>
        <span>Data produk dari backend Marketplace</span>
        <span>Keranjang disimpan di browser</span>
      </aside>
    </section>

    <section class="content-section">
      <form class="filter-bar card-panel" id="product-filter-form">
        <label class="search-field">
          <span>Cari produk</span>
          <input
            name="keyword"
            value="${escapeHtml(keyword)}"
            placeholder="Contoh: kopi, madu, keripik"
          />
        </label>

        <label>
          <span>Kategori</span>
          <select name="category">
            ${categoryOptions
              .map(
                (option) => `
                  <option value="${option}" ${option === category ? "selected" : ""}>
                    ${option}
                  </option>
                `
              )
              .join("")}
          </select>
        </label>

        <label>
          <span>Sort harga</span>
          <select name="sort">
            <option value="" ${sort === "" ? "selected" : ""}>Default</option>
            <option value="harga_asc" ${sort === "harga_asc" ? "selected" : ""}>Termurah</option>
            <option value="harga_desc" ${sort === "harga_desc" ? "selected" : ""}>Termahal</option>
          </select>
        </label>

        <button class="primary-button" type="submit">Terapkan</button>
      </form>

      <div class="section-meta">
        <strong>${products.length}</strong>
        <span>produk ditemukan</span>
      </div>

      ${
        products.length
          ? `<div class="product-grid">${products.map(ProductCard).join("")}</div>`
          : EmptyState({
              title: "Produk tidak ditemukan",
              message: "Coba gunakan keyword atau kategori lain.",
            })
      }
    </section>
  `;
}

export function afterRender({ navigate, renderRoute }) {
  const form = document.querySelector("#product-filter-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const query = buildQuery({
      keyword: data.get("keyword")?.trim(),
      category: data.get("category") === "Semua" ? "" : data.get("category"),
      sort: data.get("sort"),
    });

    navigate(query ? `/products?${query}` : "/products");
  });

  document.querySelectorAll("[data-checkout-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = `/checkout/${button.dataset.checkoutId}?qty=1`;
      navigate(isAuthenticated() ? target : `/login?redirect=${encodeURIComponent(target)}`);
    });
  });

  document.querySelectorAll("[data-add-cart-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = window.__pasarkitaProducts?.find(
        (item) => item.product_id === button.dataset.addCartId
      );
      if (!product) return;

      addCartItem(product, 1);
      showToast("Produk masuk ke keranjang.");
      renderRoute();
    });
  });
}
