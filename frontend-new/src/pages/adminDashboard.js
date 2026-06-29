import { ROLE, ROLE_LABELS, accountTypeLabel, isAdmin, isSeller } from "../utils/roles.js";
import { getUser } from "../utils/storage.js";
import * as authApi from "../api/authApi.js";
import * as marketplaceApi from "../api/marketplaceApi.js";
import { escapeHtml, toast } from "../utils/ui.js";

// Definisi menu sidebar per-role. Hanya berisi item yang punya endpoint
// backend siap pakai atau yang akan diisi di iterasi berikutnya — UI tidak
// pernah mengarahkan user ke endpoint yang akan balik 403.
const ADMIN_NAV = {
  [ROLE.PLATFORM_ADMIN]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
    { id: "accounts", label: "Akun PasarKita", icon: "users" },
    { id: "logs", label: "Log Aktivitas", icon: "activity" },
    { id: "products", label: "Kelola Produk", icon: "package" },
  ],
  [ROLE.CATALOG_ADMIN]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
    { id: "products", label: "Kelola Produk", icon: "package" },
  ],
  [ROLE.TECH_MAINTAINER]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
    { id: "logs", label: "Log Aktivitas", icon: "activity" },
  ],
  [ROLE.CUSTOMER_SUPPORT]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
  ],
  [ROLE.FINANCE_OPS]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
  ],
  [ROLE.FULFILLMENT_OPS]: [
    { id: "overview", label: "Ringkasan", icon: "layout-dashboard" },
  ],
};

let activeTab = "overview";
let requestSeq = 0; // token anti-race untuk请求 lambat yang menumpuk

function sidebar(user) {
  const items = ADMIN_NAV[user.role] || [];
  return `
    <aside class="seller-sidebar" id="admin-sidebar">
      <button class="seller-sidebar-close" id="admin-menu-close" type="button" aria-label="Tutup menu"><span data-lucide="x"></span></button>
      <a class="brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
      <div>
        <small>MENU OPERASIONAL</small>
        ${items.map((item) => `<a data-tab="${item.id}" href="#" class="${activeTab === item.id ? "active" : ""}"><span data-lucide="${item.icon}"></span><span>${escapeHtml(item.label)}</span></a>`).join("")}
      </div>
      <div>
        <small>PENGATURAN</small>
        <a href="#/profile"><span data-lucide="user"></span>Profil Saya</a>
        <a href="#/"><span data-lucide="arrow-left"></span>Kembali ke Marketplace</a>
      </div>
    </aside>
  `;
}

function topbar(user) {
  return `
    <div class="seller-topbar">
      <button class="seller-menu-toggle" id="admin-menu-toggle" type="button" aria-label="Buka menu admin"><span data-lucide="menu"></span></button>
      <div>
        <span class="eyebrow">${escapeHtml(accountTypeLabel(user.role))}</span>
        <h1>Halo, ${escapeHtml(user.name)}</h1>
        <p>Panel admin PasarKita untuk peran ${escapeHtml(accountTypeLabel(user.role))}.</p>
      </div>
    </div>
  `;
}

function overviewCards(user) {
  const navItems = ADMIN_NAV[user.role] || [];
  return `
    <div class="seller-stats">
      <article>
        <span data-lucide="shield-check"></span>
        <div><small>Status akun</small><strong>${escapeHtml(accountTypeLabel(user.role))}</strong><em>Aktif</em></div>
      </article>
      <article>
        <span data-lucide="key-round"></span>
        <div><small>Email</small><strong>${escapeHtml(user.email)}</strong><em>Terverifikasi</em></div>
      </article>
      <article>
        <span data-lucide="calendar"></span>
        <div><small>ID Akun</small><strong>${escapeHtml(user.id || "—")}</strong><em>Bergabung Juni 2026</em></div>
      </article>
      <article>
        <span data-lucide="activity"></span>
        <div><small>Hak akses modul</small><strong>${navItems.length} menu</strong><em>Operasional</em></div>
      </article>
    </div>
    <article class="seller-panel">
      <div class="seller-panel-heading"><div><h2>Ringkasan ${escapeHtml(accountTypeLabel(user.role))}</h2><p>Informasi ringkas dan akses cepat untuk peran operasionalmu.</p></div></div>
      <div class="empty-mini" style="background: #f7f9ff; border-color: #d8e2f7;">
        <div class="empty-mini-icon"><span data-lucide="info"></span></div>
        <div class="empty-mini-body">
          <h3>Akses dashboard</h3>
          <p>Gunakan menu di sidebar untuk membuka modul sesuai hak akses. Dashboard khusus peran non-teknis (customer support, finance ops, fulfillment ops) masih dalam tahap pengembangan dan akan ditambah seiring tersedia endpoint backend yang relevan.</p>
        </div>
      </div>
    </article>
  `;
}

async function loadAccountsContent() {
  try {
    const accounts = await authApi.listAccounts();
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return `<article class="seller-panel"><div class="seller-panel-heading"><div><h2>Akun PasarKita</h2><p>Belum ada akun terdaftar.</p></div></div></article>`;
    }
    return `
      <article class="seller-panel">
        <div class="seller-panel-heading"><div><h2>Akun PasarKita</h2><p>Total <strong>${accounts.length}</strong> akun aktif. Endpoint: <code>GET /auth/accounts</code>.</p></div></div>
        <div class="seller-data-table"><div class="seller-table"><div class="seller-table-row header"><span>Nama</span><span>Email</span><span>Peran</span><span>User ID</span></div>
          ${accounts.map((a) => `<div class="seller-table-row"><span>${escapeHtml(a.name)}</span><span>${escapeHtml(a.email)}</span><span><span class="status-pill info">${escapeHtml(ROLE_LABELS[a.role] || a.role)}</span></span><span>${escapeHtml(a.id)}</span></div>`).join("")}
        </div></div>
      </article>
    `;
  } catch (error) {
    return `<article class="seller-panel"><div class="seller-panel-heading"><div><h2>Akun PasarKita</h2><p>Gagal memuat daftar akun.</p></div></div>
      <div class="empty-mini"><div class="empty-mini-icon"><span data-lucide="wifi-off"></span></div><div class="empty-mini-body"><h3>Tidak dapat memuat data</h3><p>${escapeHtml(error.message || "Periksa token atau koneksi backend.")}</p></div></div>
    </article>`;
  }
}

async function loadLogsContent() {
  try {
    const logs = await marketplaceApi.listAuditLogs();
    if (!Array.isArray(logs) || logs.length === 0) {
      return `<article class="seller-panel"><div class="seller-panel-heading"><div><h2>Log Aktivitas Platform</h2><p>Belum ada log tercatat.</p></div></div></article>`;
    }
    return `
      <article class="seller-panel">
        <div class="seller-panel-heading"><div><h2>Log Aktivitas Platform</h2><p>${logs.length} entri terbaru dari <code>GET /marketplace/logging</code>.</p></div></div>
        <div class="seller-data-table"><div class="seller-table"><div class="seller-table-row header"><span>Method</span><span>Path</span><span>User</span><span>Status</span></div>
          ${logs.map((log) => `<div class="seller-table-row"><span><span class="status-pill info">${escapeHtml(log.method)}</span></span><span>${escapeHtml(log.path)}</span><span>${escapeHtml(log.user_id || "—")}</span><span><span class="status-pill ${Number(log.status_code) >= 400 ? "warning" : "success"}">${Number(log.status_code) || "—"}</span></span></div>`).join("")}
        </div></div>
      </article>
    `;
  } catch (error) {
    return `<article class="seller-panel"><div class="seller-panel-heading"><div><h2>Log Aktivitas Platform</h2><p>Gagal memuat log.</p></div></div>
      <div class="empty-mini"><div class="empty-mini-icon"><span data-lucide="wifi-off"></span></div><div class="empty-mini-body"><h3>Tidak dapat memuat log</h3><p>${escapeHtml(error.message || "Periksa token atau koneksi backend.")}</p></div></div>
    </article>`;
  }
}

function productsPlaceholder() {
  return `
    <article class="seller-panel">
      <div class="seller-panel-heading"><div><h2>Kelola Produk</h2><p>Modul manajemen katalog produk.</p></div></div>
      <div class="empty-mini" style="background: #f7f9ff; border-color: #d8e2f7;">
        <div class="empty-mini-icon"><span data-lucide="package"></span></div>
        <div class="empty-mini-body">
          <h3>Modul katalog dalam pengembangan</h3>
          <p>Endpoint backend sudah tersedia untuk platform admin dan catalog admin: <code>POST /marketplace/manajemen_produk</code> dan <code>PATCH /marketplace/products/:id/status</code>. UI lengkap menyusul.</p>
        </div>
      </div>
    </article>
  `;
}

async function renderActiveTab(user) {
  switch (activeTab) {
    case "accounts":
      return await loadAccountsContent();
    case "logs":
      return await loadLogsContent();
    case "products":
      return productsPlaceholder();
    case "overview":
    default:
      return overviewCards(user);
  }
}

export async function render() {
  const user = getUser();
  if (!user || !isAdmin(user?.role)) {
    return `<section class="container page-heading"><span class="eyebrow">Akses ditolak</span><h1>Dashboard khusus akun operasional</h1><p>Halaman ini hanya untuk peran admin seperti Platform Admin, Catalog Admin, atau Tech Maintainer.</p><a class="btn btn-primary" href="#/orders">Kembali ke Pesanan</a></section>`;
  }
  // Reset tab aktif jika role baru tidak memiliki tab sebelumnya (misal
  // sebelumnya logout sebagai platform_admin dengan tab "logs", lalu
  // login kembali sebagai catalog_admin yang tidak punya logs).
  const validTabs = (ADMIN_NAV[user.role] || []).map((item) => item.id);
  if (!validTabs.includes(activeTab)) activeTab = "overview";
  return `
    <section class="seller-shell admin-shell">
      <div class="seller-sidebar-backdrop" id="admin-sidebar-backdrop"></div>
      ${sidebar(user)}
      <main class="seller-main">
        ${topbar(user)}
        <div id="admin-tab-content">${await renderActiveTab(user)}</div>
      </main>
    </section>
  `;
}

export async function afterRender({ refreshIcons }) {
  const user = getUser();
  if (!user || !isAdmin(user?.role)) return;
  const sidebarEl = document.querySelector("#admin-sidebar");
  if (sidebarEl) {
    sidebarEl.querySelectorAll("[data-tab]").forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        const next = link.dataset.tab;
        if (!next || next === activeTab) return;
        activeTab = next;
        sidebarEl.querySelectorAll("[data-tab]").forEach((el) => el.classList.toggle("active", el.dataset.tab === activeTab));
        const slot = document.querySelector("#admin-tab-content");
        if (!slot) return;
        // Token request: jika tab diganti sebelum请求 sebelumnya selesai,
        // hasil permintaan lama dibuang agar tidak menimpa tab yang lebih baru.
        const token = ++requestSeq;
        const label = link.querySelector("span:last-child")?.textContent || next;
        slot.innerHTML = `<div class="admin-loading" role="status" aria-live="polite"><span class="spinner"></span><p>Memuat modul ${escapeHtml(label)}…</p></div>`;
        refreshIcons();
        const html = await renderActiveTab(user);
        if (token !== requestSeq) return;
        slot.innerHTML = html;
        refreshIcons();
      });
    });
  }
  const shell = document.querySelector(".admin-shell");
  document.querySelector("#admin-menu-toggle")?.addEventListener("click", () => shell?.classList.add("is-menu-open"));
  document.querySelector("#admin-menu-close")?.addEventListener("click", () => shell?.classList.remove("is-menu-open"));
  document.querySelector("#admin-sidebar-backdrop")?.addEventListener("click", () => shell?.classList.remove("is-menu-open"));
  refreshIcons();
}
