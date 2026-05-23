import { bindNavbar, Navbar } from "./components/Navbar.js";
import { Loading } from "./components/Loading.js";
import { showToast } from "./components/Toast.js";
import * as ProductListPage from "./pages/ProductListPage.js";
import * as ProductDetailPage from "./pages/ProductDetailPage.js";
import * as CheckoutPage from "./pages/CheckoutPage.js";
import * as OrderStatusPage from "./pages/OrderStatusPage.js";
import * as SellerDashboardPage from "./pages/SellerDashboardPage.js";
import * as CartPage from "./pages/CartPage.js";
import * as InternalDashboardPage from "./pages/InternalDashboardPage.js";

let navbarRoot;
let viewRoot;

const routes = [
  { pattern: /^\/products$/, page: ProductListPage },
  { pattern: /^\/products\/([^/]+)$/, page: ProductDetailPage, keys: ["id"] },
  { pattern: /^\/cart$/, page: CartPage },
  { pattern: /^\/checkout$/, page: CheckoutPage },
  { pattern: /^\/checkout\/([^/]+)$/, page: CheckoutPage, keys: ["id"] },
  { pattern: /^\/orders$/, page: OrderStatusPage },
  { pattern: /^\/orders\/([^/]+)$/, page: OrderStatusPage, keys: ["id"] },
  { pattern: /^\/seller\/products$/, page: SellerDashboardPage },
  { pattern: /^\/support$/, page: InternalDashboardPage, params: { area: "support" } },
  { pattern: /^\/finance$/, page: InternalDashboardPage, params: { area: "finance" } },
  { pattern: /^\/fulfillment$/, page: InternalDashboardPage, params: { area: "fulfillment" } },
  { pattern: /^\/admin\/catalog$/, page: InternalDashboardPage, params: { area: "catalog" } },
  { pattern: /^\/admin\/platform$/, page: InternalDashboardPage, params: { area: "platform" } },
  { pattern: /^\/admin\/tech$/, page: InternalDashboardPage, params: { area: "tech" } },
];

function parseHash() {
  const hash = window.location.hash || "#/products";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path, queryString = ""] = raw.split("?");

  return {
    path: path || "/products",
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

export async function renderRoute() {
  const { path, query } = parseHash();
  const matched = matchRoute(path);

  navbarRoot.innerHTML = Navbar(path);
  bindNavbar({ navigate, renderRoute });

  if (!matched) {
    navigate("/products");
    return;
  }

  viewRoot.innerHTML = Loading();

  try {
    viewRoot.innerHTML = await matched.route.page.render({
      params: matched.params,
      query,
    });

    matched.route.page.afterRender?.({
      params: matched.params,
      query,
      navigate,
      renderRoute,
    });

    viewRoot.focus({ preventScroll: true });
  } catch (error) {
    viewRoot.innerHTML = `
      <section class="error-state card-panel">
        <p class="eyebrow">Error state</p>
        <h1>Halaman gagal dimuat</h1>
        <p>${error.message || "Terjadi kesalahan saat memuat data."}</p>
        <button class="primary-button" type="button" id="retry-route">Coba lagi</button>
      </section>
    `;
    document.querySelector("#retry-route")?.addEventListener("click", renderRoute);
    showToast(error.message || "Gagal memuat halaman.", "error");
  }
}

export function initRouter(roots) {
  navbarRoot = roots.navbarRoot;
  viewRoot = roots.viewRoot;

  window.addEventListener("hashchange", renderRoute);

  if (!window.location.hash) {
    navigate("/products");
    return;
  }

  renderRoute();
}
