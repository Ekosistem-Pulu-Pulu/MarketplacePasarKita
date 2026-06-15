import { categories, getCategoryById } from "../data/categories.js";
import { products } from "../data/products.js";
import { getProducts } from "../services/productService.js";
import { ProductGrid } from "../components/ProductGrid.js";
import { emptyState, escapeHtml } from "../utils/ui.js";

function readFilters(route) {
  const params = route.query;
  return {
    query: params.get("q") || "",
    category: route.params.category || params.get("category") || "",
    location: params.get("location") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    rating: params.get("rating") || "",
    promo: params.get("promo") || "",
    sort: params.get("sort") || "recommended",
  };
}

function filterForm(filters) {
  const locations = [...new Set(products.map((product) => product.store.location))].sort();
  return `
    <form class="filter-panel" id="catalog-filter">
      <div class="filter-title"><div><span data-lucide="sliders-horizontal"></span><strong>Filter Produk</strong></div><div class="filter-title-actions"><button type="button" id="reset-filter">Reset</button><button class="filter-close" type="button" id="mobile-filter-close" aria-label="Tutup filter"><span data-lucide="x"></span></button></div></div>
      <label><span>Kategori</span><select name="category"><option value="">Semua kategori</option>${categories.map((category) => `<option value="${category.id}" ${filters.category === category.id ? "selected" : ""}>${category.name}</option>`).join("")}</select></label>
      <label><span>Rentang harga</span><div class="price-inputs"><input name="minPrice" type="number" min="0" placeholder="Minimum" value="${filters.minPrice}" /><input name="maxPrice" type="number" min="0" placeholder="Maksimum" value="${filters.maxPrice}" /></div></label>
      <label><span>Rating minimum</span><select name="rating"><option value="">Semua rating</option>${[4.9, 4.8, 4.7, 4.5].map((rating) => `<option value="${rating}" ${String(filters.rating) === String(rating) ? "selected" : ""}>${rating} ke atas</option>`).join("")}</select></label>
      <label><span>Lokasi toko</span><select name="location"><option value="">Semua lokasi</option>${locations.map((location) => `<option value="${location}" ${filters.location === location ? "selected" : ""}>${location}</option>`).join("")}</select></label>
      <label><span>Status promo</span><select name="promo"><option value="">Semua produk</option><option value="discount" ${filters.promo ? "selected" : ""}>Sedang diskon</option></select></label>
      <button class="btn btn-primary full" type="submit"><span data-lucide="filter"></span>Terapkan Filter</button>
    </form>
  `;
}

export async function render(route) {
  const filters = readFilters(route);
  const items = await getProducts(filters);
  const category = getCategoryById(filters.category);
  const title = filters.query ? `Hasil pencarian "${escapeHtml(filters.query)}"` : category ? category.name : "Semua Produk";

  return `
    <section class="catalog-hero"><div class="container"><span class="eyebrow">Jelajahi katalog</span><h1>${title}</h1><p>Temukan produk berkualitas dari toko pilihan di seluruh Indonesia.</p></div></section>
    <section class="container catalog-layout">
      <div class="catalog-filter-backdrop" id="catalog-filter-backdrop"></div>
      <aside class="catalog-filter-shell" id="catalog-filter-shell">${filterForm(filters)}</aside>
      <main class="catalog-results">
        <div class="catalog-toolbar">
          <div><strong id="result-count">${items.length} produk ditemukan</strong><span>Produk terkurasi untuk kebutuhanmu</span></div>
          <div class="catalog-mobile-actions"><button class="catalog-mobile-filter" id="mobile-filter-toggle" type="button"><span data-lucide="sliders-horizontal"></span>Filter</button><label><span>Urutkan</span><select id="catalog-sort"><option value="recommended">Paling Relevan</option><option value="price-low">Harga Termurah</option><option value="price-high">Harga Termahal</option><option value="rating">Rating Tertinggi</option><option value="sold">Paling Banyak Terjual</option></select></label></div>
        </div>
        <div id="catalog-products">${items.length ? ProductGrid(items) : emptyState({ icon: "search-x", title: "Produk tidak ditemukan", message: "Coba ubah kata kunci atau gunakan filter yang lebih luas.", action: `<a class="btn btn-primary" href="#/products">Reset pencarian</a>` })}</div>
      </main>
    </section>
  `;
}

export function afterRender({ route, navigate, refreshIcons }) {
  const filters = readFilters(route);
  const sort = document.querySelector("#catalog-sort");
  sort.value = filters.sort;
  const filterShell = document.querySelector("#catalog-filter-shell");
  const filterBackdrop = document.querySelector("#catalog-filter-backdrop");
  const closeFilter = () => {
    filterShell?.classList.remove("is-open");
    filterBackdrop?.classList.remove("is-open");
    document.body.classList.remove("drawer-open");
  };
  const openFilter = () => {
    filterShell?.classList.add("is-open");
    filterBackdrop?.classList.add("is-open");
    document.body.classList.add("drawer-open");
  };

  async function updateResults() {
    const form = document.querySelector("#catalog-filter");
    const values = Object.fromEntries(new FormData(form).entries());
    values.sort = sort.value;
    values.q = filters.query;
    const params = new URLSearchParams(Object.entries(values).filter(([, value]) => String(value).trim()));
    const items = await getProducts({
      query: values.q,
      category: values.category,
      location: values.location,
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      rating: values.rating,
      promo: values.promo,
      sort: values.sort,
    });
    document.querySelector("#result-count").textContent = `${items.length} produk ditemukan`;
    document.querySelector("#catalog-products").innerHTML = items.length ? ProductGrid(items) : emptyState({ icon: "search-x", title: "Produk tidak ditemukan", message: "Coba ubah kata kunci atau gunakan filter yang lebih luas." });
    refreshIcons();
    history.replaceState(null, "", `#${route.path}?${params}`);
    closeFilter();
  }

  document.querySelector("#catalog-filter")?.addEventListener("submit", (event) => { event.preventDefault(); updateResults(); });
  sort?.addEventListener("change", updateResults);
  document.querySelector("#reset-filter")?.addEventListener("click", () => navigate("/products"));
  document.querySelector("#mobile-filter-toggle")?.addEventListener("click", openFilter);
  document.querySelector("#mobile-filter-close")?.addEventListener("click", closeFilter);
  filterBackdrop?.addEventListener("click", closeFilter);
}
