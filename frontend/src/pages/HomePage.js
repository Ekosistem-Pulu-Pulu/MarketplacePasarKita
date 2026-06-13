import { CategoryMenu } from "../components/CategoryMenu.js";
import { ProductGrid } from "../components/ProductGrid.js";
import { PromoBanner } from "../components/PromoBanner.js";
import { showToast } from "../components/Toast.js";
import { categories } from "../data/categories.js";
import { promos } from "../data/promos.js";
import { addToCart, getCartCountSnapshot } from "../services/cartService.js";
import { getCategoryOptions, getProducts } from "../services/productService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { getActiveFilters } from "../utils/productFilter.js";
import { escapeHtml } from "../utils/validation.js";

const sortOptions = [
  { value: "", label: "Rekomendasi" },
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga terendah" },
  { value: "price-high", label: "Harga tertinggi" },
  { value: "best-selling", label: "Terlaris" },
  { value: "rating", label: "Rating tertinggi" },
];

function buildProductUrl(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    const clean = String(value || "").trim();
    if (clean) params.set(key, clean);
  });
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function getFilters(query) {
  return {
    q: query.get("q") || "",
    category: query.get("category") || "",
    minPrice: query.get("minPrice") || "",
    maxPrice: query.get("maxPrice") || "",
    rating: query.get("rating") || "",
    sort: query.get("sort") || "",
  };
}

function activeFilterChips(filters) {
  const labels = {
    q: "Pencarian",
    category: "Kategori",
    minPrice: "Harga mulai",
    maxPrice: "Harga sampai",
    rating: "Rating minimal",
    sort: "Urutan",
  };

  const sortLabel = sortOptions.find((item) => item.value === filters.sort)?.label || filters.sort;

  return getActiveFilters(filters)
    .map(([key, value]) => {
      const displayValue =
        key === "minPrice" || key === "maxPrice"
          ? formatCurrency(value)
          : key === "rating"
            ? `${value}+`
            : key === "sort"
              ? sortLabel
              : value;

      return `<span class="filter-chip">${labels[key]}: ${escapeHtml(displayValue)}</span>`;
    })
    .join("");
}

export async function render({ query }) {
  const filters = getFilters(query);
  const [catalog, categoryOptions, allProductsCatalog] = await Promise.all([
    getProducts(filters),
    getCategoryOptions().catch(() => categories),
    getProducts({ limit: 100 }).catch(() => ({ items: [] })),
  ]);

  const productCounts = {};
  if (allProductsCatalog && allProductsCatalog.items) {
    allProductsCatalog.items.forEach((item) => {
      productCounts[item.category] = (productCounts[item.category] || 0) + 1;
    });
  }

  const visibleProducts = catalog.items;
  const recommended = [...visibleProducts].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const bestSelling = [...visibleProducts].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const todayPromos = visibleProducts.filter((item) => item.discount).slice(0, 4);
  const hasActiveFilters = getActiveFilters(filters).length > 0;

  return `
    <section class="market-hero">
      <div class="hero-copy">
        <span class="eyebrow">UMKM Marketplace Indonesia</span>
        <h1>Dukung Produk Lokal, Temukan Keunikan Nusantara</h1>
        <p>
          Temukan produk terbaik hasil karya produsen lokal Indonesia. Dari kerajinan tangan, kopi pilihan, camilan tradisional hingga batik modern berkualitas premium, semuanya ada di PasarKita.
        </p>
        <form class="hero-search" id="hero-search">
          <span data-lucide="search"></span>
          <input
            name="q"
            value="${escapeHtml(filters.q)}"
            autocomplete="off"
            placeholder="Cari kopi gayo, batik modern, kerajinan bambu..."
            aria-label="Cari produk"
          />
          <button class="btn btn-primary" type="submit">Cari produk</button>
        </form>
        <div class="hero-metrics">
          <div><strong>${catalog.total}</strong><span>Produk aktif</span></div>
          <div><strong>${categoryOptions.length}</strong><span>Kategori</span></div>
          <div><strong>${getCartCountSnapshot()}</strong><span>Item keranjang</span></div>
        </div>
      </div>
      <div class="hero-media">
        <img src="/src/assets/hero.png" alt="Pengalaman belanja PasarKita" />
      </div>
    </section>

    ${PromoBanner({ promos })}

    <section class="section-block">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Kategori populer</span>
          <h2>Mulai dari kebutuhan yang paling sering dicari</h2>
        </div>
        <a class="text-link" href="#/products">Lihat semua</a>
      </div>
      ${CategoryMenu({ categories: categoryOptions, activeCategory: filters.category, productCounts })}
    </section>

    <section class="catalog-panel" id="catalog">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Katalog produk</span>
          <h2>${hasActiveFilters ? "Hasil pencarian produk" : "Produk pilihan untuk kamu"}</h2>
        </div>
        <span class="result-count">${visibleProducts.length} produk</span>
      </div>

      <form class="filter-panel" id="filter-form">
        <label>
          <span>Kategori</span>
          <select name="category">
            <option value="">Semua kategori</option>
            ${categoryOptions
              .map(
                (category) => `
                  <option value="${escapeHtml(category.name)}" ${filters.category === category.name ? "selected" : ""}>
                    ${escapeHtml(category.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </label>
        <label>
          <span>Harga mulai</span>
          <input name="minPrice" inputmode="numeric" value="${escapeHtml(filters.minPrice)}" placeholder="Rp minimum" />
        </label>
        <label>
          <span>Harga sampai</span>
          <input name="maxPrice" inputmode="numeric" value="${escapeHtml(filters.maxPrice)}" placeholder="Rp maksimum" />
        </label>
        <label>
          <span>Rating</span>
          <select name="rating">
            <option value="">Semua rating</option>
            <option value="4" ${filters.rating === "4" ? "selected" : ""}>4.0 ke atas</option>
            <option value="4.5" ${filters.rating === "4.5" ? "selected" : ""}>4.5 ke atas</option>
            <option value="4.8" ${filters.rating === "4.8" ? "selected" : ""}>4.8 ke atas</option>
          </select>
        </label>
        <label>
          <span>Urutkan</span>
          <select name="sort">
            ${sortOptions
              .map(
                (option) => `
                  <option value="${option.value}" ${filters.sort === option.value ? "selected" : ""}>
                    ${option.label}
                  </option>
                `
              )
              .join("")}
          </select>
        </label>
        <input type="hidden" name="q" value="${escapeHtml(filters.q)}" />
        <button class="btn btn-primary" type="submit">
          <span data-lucide="sliders-horizontal"></span>
          Terapkan
        </button>
        <a class="btn btn-secondary" href="#/products">Reset</a>
      </form>

      ${hasActiveFilters ? `<div class="active-filters">${activeFilterChips(filters)}</div>` : ""}

      ${ProductGrid({
        products: visibleProducts,
        emptyTitle: "Produk belum tersedia",
        emptyMessage: "Coba ubah kata kunci, kategori, atau rentang harga.",
      })}
    </section>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Rekomendasi</span>
          <h2>Produk dengan ulasan tinggi</h2>
        </div>
      </div>
      ${ProductGrid({ products: recommended })}
    </section>

    <section class="section-block two-section-grid">
      <div>
        <div class="section-heading compact">
          <div>
            <span class="eyebrow">Terlaris</span>
            <h2>Sering dibeli</h2>
          </div>
        </div>
        ${ProductGrid({ products: bestSelling })}
      </div>
      <div>
        <div class="section-heading compact">
          <div>
            <span class="eyebrow">Promo hari ini</span>
            <h2>Diskon aktif</h2>
          </div>
        </div>
        ${ProductGrid({ products: todayPromos })}
      </div>
    </section>
  `;
}

export function afterRender({ navigate, renderRoute }) {
  document.querySelector("#hero-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate(buildProductUrl({ q: data.get("q") }));
  });

  document.querySelector("#filter-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate(
      buildProductUrl({
        q: data.get("q"),
        category: data.get("category"),
        minPrice: data.get("minPrice"),
        maxPrice: data.get("maxPrice"),
        rating: data.get("rating"),
        sort: data.get("sort"),
      })
    );
  });

  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await addToCart(button.dataset.addCart, 1);
        showToast("Produk masuk ke keranjang.");
        window.dispatchEvent(new Event("pasarkita:cart-updated"));
      } catch (error) {
        showToast(error.message || "Produk belum tersedia.", "error");
      }
    });
  });
}
