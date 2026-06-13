import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { showToast } from "./components/Toast.js";
import { renderIcons } from "./icons.js";
import * as CartPage from "./pages/CartPage.js";
import * as CheckoutPage from "./pages/CheckoutPage.js";
import * as HomePage from "./pages/HomePage.js";
import * as ProductListPage from "./pages/ProductListPage.js";
import * as LoginPage from "./pages/LoginPage.js";
import * as OrdersPage from "./pages/OrdersPage.js";
import * as ProductDetailPage from "./pages/ProductDetailPage.js";
import * as RegisterPage from "./pages/RegisterPage.js";
import * as SellerPage from "./pages/SellerPage.js";
import * as ProfilePage from "./pages/ProfilePage.js";
import * as ChatPage from "./pages/ChatPage.js";
import * as NotificationsPage from "./pages/NotificationsPage.js";
import * as StorePage from "./pages/StorePage.js";
import * as SellerDashboardPage from "./pages/SellerDashboardPage.js";
import * as InternalDashboardPage from "./pages/InternalDashboardPage.js";
import { requireAuth, requireRole } from "./app/guards.js";
import { getCartCountSnapshot, getCartState } from "./services/cartService.js";
import { getProducts } from "./services/productService.js";
import { logoutUser } from "./services/authService.js";
import { getCurrentUser } from "./utils/storage.js";
import { escapeHtml } from "./utils/validation.js";

let headerRoot;
let viewRoot;
let footerRoot;

const routes = [
  { pattern: /^\/$/, page: HomePage },
  { pattern: /^\/products$/, page: ProductListPage },
  { pattern: /^\/products\/([^/]+)$/, page: ProductDetailPage, keys: ["id"] },
  { pattern: /^\/cart$/, page: CartPage },
  { pattern: /^\/checkout$/, page: CheckoutPage, guard: requireAuth },
  { pattern: /^\/login$/, page: LoginPage },
  { pattern: /^\/register$/, page: RegisterPage },
  { pattern: /^\/orders$/, page: OrdersPage, guard: requireAuth },
  { pattern: /^\/orders\/([^/]+)$/, page: OrdersPage, keys: ["id"], guard: requireAuth },
  { pattern: /^\/seller$/, page: SellerPage, guard: (path) => requireRole(path, ["seller"]) },
  { pattern: /^\/seller\/products$/, page: SellerDashboardPage, guard: (path) => requireRole(path, ["seller"]) },
  { pattern: /^\/profile$/, page: ProfilePage, guard: requireAuth },
  { pattern: /^\/chat$/, page: ChatPage, guard: requireAuth },
  { pattern: /^\/notifications$/, page: NotificationsPage, guard: requireAuth },
  { pattern: /^\/stores$/, page: StorePage },
  { pattern: /^\/stores\/([^/]+)$/, page: StorePage, keys: ["id"] },
  { pattern: /^\/support$/, page: InternalDashboardPage, params: { area: "support" }, guard: (path) => requireRole(path, ["customer_support", "platform_admin"]) },
  { pattern: /^\/finance$/, page: InternalDashboardPage, params: { area: "finance" }, guard: (path) => requireRole(path, ["finance_ops", "platform_admin"]) },
  { pattern: /^\/fulfillment$/, page: InternalDashboardPage, params: { area: "fulfillment" }, guard: (path) => requireRole(path, ["fulfillment_ops", "platform_admin"]) },
  { pattern: /^\/admin\/catalog$/, page: InternalDashboardPage, params: { area: "catalog" }, guard: (path) => requireRole(path, ["catalog_admin", "platform_admin"]) },
  { pattern: /^\/admin\/platform$/, page: InternalDashboardPage, params: { area: "platform" }, guard: (path) => requireRole(path, ["platform_admin"]) },
  { pattern: /^\/admin\/tech$/, page: InternalDashboardPage, params: { area: "tech" }, guard: (path) => requireRole(path, ["tech_maintainer", "platform_admin"]) },
];

function parseHash() {
  const hash = window.location.hash || "#/";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path = "/", queryString = ""] = raw.split("?");

  return {
    path: path || "/",
    query: new URLSearchParams(queryString),
  };
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (!match) continue;

    const params = { ...(route.params || {}) };
    (route.keys || []).forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1]);
    });

    return { route, params };
  }

  return null;
}


export function navigate(path) {
  const target = path.startsWith("#") ? path : `#${path}`;

  if (window.location.hash === target) {
    renderRoute();
    return;
  }

  window.location.hash = target;
}

export function buildProductQuery(values) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    const cleanValue = String(value || "").trim();
    if (cleanValue) params.set(key, cleanValue);
  });

  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export async function renderRoute() {
  const { path, query } = parseHash();
  const matched = matchRoute(path);

  headerRoot.innerHTML = Header({
    activePath: path,
    keyword: query.get("q") || "",
    cartCount: getCartCountSnapshot(),
    user: getCurrentUser(),
  });
  footerRoot.innerHTML = Footer();

  getCartState().then(() => {
    const count = getCartCountSnapshot();
    document.querySelectorAll(".nav-count-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-grid" : "none";
    });
    document.querySelectorAll(".bottom-count-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-grid" : "none";
    });
  }).catch(() => {});

  if (!matched) {
    viewRoot.innerHTML = `
      <section class="state-panel">
        <span class="state-icon" data-lucide="map"></span>
        <h1>Halaman tidak ditemukan</h1>
        <p>Area yang kamu buka belum tersedia. Kembali ke katalog untuk lanjut berbelanja.</p>
        <a class="btn btn-primary" href="#/products">Buka katalog</a>
      </section>
    `;
    bindShellEvents();
    renderIcons();
    return;
  }

  const guardRedirect = matched.route.guard?.(path);
  if (guardRedirect) {
    navigate(guardRedirect);
    return;
  }

  viewRoot.innerHTML = `
    <section class="loading-view" role="status">
      <span data-lucide="loader-circle"></span>
      <p>Menyiapkan halaman belanja...</p>
    </section>
  `;
  renderIcons();

  try {
    viewRoot.innerHTML = await matched.route.page.render({
      params: matched.params,
      query,
      navigate,
    });

    matched.route.page.afterRender?.({
      params: matched.params,
      query,
      navigate,
      renderRoute,
    });
  } catch (error) {
    viewRoot.innerHTML = `
      <section class="state-panel state-panel-danger">
        <span class="state-icon" data-lucide="circle-alert"></span>
        <h1>Terjadi kendala saat memuat data</h1>
        <p>${escapeHtml(error.message || "Coba lagi sebentar lagi.")}</p>
        <button class="btn btn-primary" type="button" id="retry-route">Coba lagi</button>
      </section>
    `;
    document.querySelector("#retry-route")?.addEventListener("click", renderRoute);
    showToast("Terjadi kendala saat memuat data. Coba lagi sebentar lagi.", "error");
  }

  bindShellEvents();
  renderIcons();
  viewRoot.focus({ preventScroll: true });
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

function bindSearchAutocomplete(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  const input = form.querySelector("input[name='q']");
  if (!input) return;

  let dropdown = form.querySelector(".search-suggestions-dropdown");

  const closeDropdown = () => {
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
    }
  };

  const clickOutsideHandler = (e) => {
    if (!form.contains(e.target)) {
      closeDropdown();
      document.removeEventListener("click", clickOutsideHandler);
    }
  };

  const handleInput = debounce(async () => {
    const queryVal = input.value.trim();
    if (queryVal.length < 2) {
      closeDropdown();
      return;
    }

    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "search-suggestions-dropdown";
      form.appendChild(dropdown);
      document.addEventListener("click", clickOutsideHandler);
    }

    dropdown.innerHTML = `
      <div class="suggestion-loading">
        <span data-lucide="loader-circle" class="spin"></span>
        <span>Mencari "${escapeHtml(queryVal)}"...</span>
      </div>
    `;
    renderIcons();

    try {
      const catalog = await getProducts({ q: queryVal, limit: 6 });
      const items = catalog.items || [];

      if (items.length === 0) {
        dropdown.innerHTML = `
          <div class="suggestion-empty">
            <span data-lucide="info"></span>
            <span>Produk tidak ditemukan</span>
          </div>
        `;
        renderIcons();
        return;
      }

      const matchQuery = queryVal.toLowerCase();
      const categories = [...new Set(items.map(item => item.category))]
        .filter(cat => cat.toLowerCase().includes(matchQuery))
        .slice(0, 3);

      const stores = [...new Map(items.map(item => [item.store.id, item.store])).values()]
        .filter(store => store.name.toLowerCase().includes(matchQuery))
        .slice(0, 3);

      let html = "";

      if (categories.length > 0) {
        html += `
          <div class="suggestion-section">
            <div class="suggestion-section-title">Kategori Terkait</div>
            ${categories.map(cat => `
              <div class="suggestion-item" data-suggestion-type="category" data-suggestion-value="${escapeHtml(cat)}">
                <span data-lucide="tag"></span>
                <span class="suggestion-item-title">${escapeHtml(cat)}</span>
              </div>
            `).join("")}
          </div>
        `;
      }

      if (stores.length > 0) {
        html += `
          <div class="suggestion-section">
            <div class="suggestion-section-title">Toko Terkait</div>
            ${stores.map(store => `
              <div class="suggestion-item" data-suggestion-type="store" data-suggestion-value="${escapeHtml(store.name)}">
                <span data-lucide="store"></span>
                <div class="suggestion-item-info">
                  <span class="suggestion-item-title">${escapeHtml(store.name)}</span>
                  <span class="suggestion-item-meta">${escapeHtml(store.location)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      html += `
        <div class="suggestion-section">
          <div class="suggestion-section-title">Produk Terkait</div>
          ${items.map(product => `
            <a href="#/products/${escapeHtml(product.id)}" class="suggestion-item" data-suggestion-type="product">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
              <div class="suggestion-item-info">
                <span class="suggestion-item-title">${escapeHtml(product.name)}</span>
                <span class="suggestion-item-price">Rp ${product.price.toLocaleString("id-ID")}</span>
                <span class="suggestion-item-meta">${escapeHtml(product.store.name)} • ${escapeHtml(product.store.location)}</span>
              </div>
            </a>
          `).join("")}
        </div>
      `;

      dropdown.innerHTML = html;
      renderIcons();

      dropdown.querySelectorAll(".suggestion-item[data-suggestion-type]").forEach(item => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const type = item.dataset.suggestionType;
          const val = item.dataset.suggestionValue;
          closeDropdown();
          if (type === "category") {
            navigate(`/products?category=${encodeURIComponent(val)}`);
          } else if (type === "store") {
            navigate(`/products?q=${encodeURIComponent(val)}`);
          }
        });
      });

      dropdown.querySelectorAll(".suggestion-item[href]").forEach(link => {
        link.addEventListener("click", () => {
          closeDropdown();
        });
      });

    } catch (err) {
      dropdown.innerHTML = `
        <div class="suggestion-error">
          <span data-lucide="circle-alert"></span>
          <span>Gagal memuat rekomendasi</span>
        </div>
      `;
      renderIcons();
    }
  }, 300);

  input.addEventListener("input", handleInput);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });
}

function bindShellEvents() {
  document.querySelector("#header-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate(buildProductQuery({ q: data.get("q") }));
  });

  document.querySelector("#mobile-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate(buildProductQuery({ q: data.get("q") }));
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      logoutUser();
      navigate("/products");
    });
  });

  bindSearchAutocomplete("#header-search");
  bindSearchAutocomplete("#mobile-search");
  bindSearchAutocomplete("#hero-search");
}

export function initRouter(roots) {
  headerRoot = roots.headerRoot;
  viewRoot = roots.viewRoot;
  footerRoot = roots.footerRoot;

  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("pasarkita:cart-updated", () => {
    const count = getCartCountSnapshot();
    
    document.querySelectorAll(".nav-count-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-grid" : "none";
    });

    document.querySelectorAll(".bottom-count-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-grid" : "none";
    });

    const heroCartCount = document.querySelector(".hero-metrics div:last-child strong");
    if (heroCartCount) {
      heroCartCount.textContent = count;
    }

    const { path } = parseHash();
    if (path === "/cart" || path.startsWith("/checkout")) {
      renderRoute();
    }
  });

  if (!window.location.hash) {
    navigate("/");
    return;
  }

  renderRoute();
}
