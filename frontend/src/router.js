import { Footer } from "./components/Footer.js";
import { Header } from "./components/Header.js";
import { showToast } from "./components/Toast.js";
import { renderIcons } from "./icons.js";
import * as CartPage from "./pages/CartPage.js";
import * as CheckoutPage from "./pages/CheckoutPage.js";
import * as HomePage from "./pages/HomePage.js";
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
import { getCartCountSnapshot } from "./services/cartService.js";
import { logoutUser } from "./services/authService.js";
import { getCurrentUser } from "./utils/storage.js";
import { escapeHtml } from "./utils/validation.js";

let headerRoot;
let viewRoot;
let footerRoot;

const routes = [
  { pattern: /^\/$/, page: HomePage },
  { pattern: /^\/products$/, page: HomePage },
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
}

export function initRouter(roots) {
  headerRoot = roots.headerRoot;
  viewRoot = roots.viewRoot;
  footerRoot = roots.footerRoot;

  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("pasarkita:cart-updated", renderRoute);

  if (!window.location.hash) {
    navigate("/");
    return;
  }

  renderRoute();
}
