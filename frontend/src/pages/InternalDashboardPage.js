import { API_BASE_URL } from "../config/apiConfig.js";
import { browseProducts } from "../api/marketplaceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { getStoredOrders } from "../utils/orders.js";
import { ROLE_DEFINITIONS } from "../utils/roles.js";
import { escapeHtml } from "../utils/validation.js";

const AREA_CONFIG = {
  support: {
    eyebrow: "Customer Support",
    title: "Support Center",
    owner: "customer_support",
    description: "Tim ini menangani chat, komplain buyer/seller, dan eskalasi kasus ke finance atau fulfillment.",
    work: [
      "Balas chat buyer/seller dengan konteks order dan produk.",
      "Buat eskalasi refund ke Finance Ops saat payment bermasalah.",
      "Buat eskalasi pengiriman ke Fulfillment Ops saat order tertahan.",
    ],
  },
  finance: {
    eyebrow: "Finance Ops",
    title: "Payment dan Rekonsiliasi",
    owner: "finance_ops",
    description: "Tim ini memantau payment request, fee marketplace, refund, dan rekonsiliasi transaksi.",
    work: [
      "Validasi payment request dari checkout Marketplace.",
      "Review refund atau dispute sebelum diteruskan ke payment service.",
      "Pantau marketplace fee 2% dan status settlement seller.",
    ],
  },
  fulfillment: {
    eyebrow: "Fulfillment Ops",
    title: "Pengiriman dan SLA",
    owner: "fulfillment_ops",
    description: "Tim ini memastikan order berbayar siap dikirim, resi terisi, dan SLA pengiriman dipantau.",
    work: [
      "Pantau order paid yang perlu diproses seller.",
      "Follow up resi dan status pengiriman.",
      "Eskalasi masalah logistik ke support saat buyer terdampak.",
    ],
  },
  catalog: {
    eyebrow: "Catalog Admin",
    title: "Moderasi Katalog",
    owner: "catalog_admin",
    description: "Tim ini menjaga kualitas data produk, kategori, status aktif, dan konten katalog.",
    work: [
      "Review produk nonaktif, stok kosong, atau kategori tidak tepat.",
      "Bantu seller memperbaiki nama, deskripsi, harga, dan kategori.",
      "Eskalasi pelanggaran katalog ke Platform Admin.",
    ],
  },
  platform: {
    eyebrow: "Platform Admin",
    title: "Governance Platform",
    owner: "platform_admin",
    description: "Tim ini mengatur role, kebijakan marketplace, kategori, dan akses operasional internal.",
    work: [
      "Kelola pembagian akses role internal.",
      "Tetapkan aturan kategori dan kebijakan listing.",
      "Pantau eskalasi lintas support, finance, fulfillment, dan tech.",
    ],
  },
  tech: {
    eyebrow: "Tech Maintainer",
    title: "Health dan Integrasi",
    owner: "tech_maintainer",
    description: "Tim ini memelihara aplikasi, API gateway, konfigurasi env, error, dan kesiapan rilis.",
    work: [
      "Pantau frontend, backend, dan integrasi API Marketplace.",
      "Perbaiki bug, cek build, dan audit konfigurasi VITE_API_BASE_URL.",
      "Koordinasi incident teknis ke role operasional terdampak.",
    ],
  },
};

function metricCard(label, value, note = "") {
  return `
    <article class="seller-stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </article>
  `;
}

function workQueue(config, products, orders) {
  const inactiveProducts = products.filter((product) => !product.status_aktif);
  const emptyStock = products.filter((product) => Number(product.stok) <= 0);
  const recentOrders = orders.slice(0, 5);

  if (config.owner === "catalog_admin") {
    return `
      <section class="table-card">
        <div class="table-toolbar"><strong>Queue review katalog</strong></div>
        <div class="table-scroll">
          <table class="table">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Stok</th><th>Status</th></tr></thead>
            <tbody>
              ${(inactiveProducts.length ? inactiveProducts : emptyStock).slice(0, 8).map(
                (product) => `
                  <tr>
                    <td><strong>${escapeHtml(product.nama_produk)}</strong><div class="table-subtext">${escapeHtml(product.seller_id)}</div></td>
                    <td>${escapeHtml(product.kategori)}</td>
                    <td>${product.stok}</td>
                    <td>${product.status_aktif ? "Perlu cek stok" : "Nonaktif"}</td>
                  </tr>
                `
              ).join("") || `<tr><td colspan="4" class="table-empty">Tidak ada queue review.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  if (config.owner === "tech_maintainer") {
    return `
      <section class="ops-grid">
        <article class="ops-card">
          <span>Frontend mode</span>
          <strong>${escapeHtml(import.meta.env.MODE)}</strong>
          <p>Vite hanya mengekspos env client dengan prefix VITE_, sesuai dokumentasi Context7.</p>
        </article>
        <article class="ops-card">
          <span>API Base URL</span>
          <strong>${escapeHtml(API_BASE_URL)}</strong>
          <p>Digunakan oleh seluruh request Marketplace API.</p>
        </article>
        <article class="ops-card">
          <span>Endpoint penting</span>
          <strong>/marketplace/*</strong>
          <p>browse_produk, checkout, status_order, seller/products.</p>
        </article>
      </section>
    `;
  }

  return `
    <section class="ops-grid">
      ${(recentOrders.length ? recentOrders : [
        { order_id: "QUEUE-CHAT-001", nama_produk: "Pertanyaan buyer", status_order: "OPEN", total_bayar: 0 },
        { order_id: "QUEUE-ESC-002", nama_produk: "Eskalasi operasional", status_order: "PENDING", total_bayar: 0 },
        { order_id: "QUEUE-SLA-003", nama_produk: "Follow up seller", status_order: "OPEN", total_bayar: 0 },
      ]).map(
        (item) => `
          <article class="ops-card">
            <span>${escapeHtml(item.status_order || "OPEN")}</span>
            <strong>${escapeHtml(item.order_id)}</strong>
            <p>${escapeHtml(item.nama_produk || item.product_id || "Queue operasional")}</p>
            ${item.total_bayar ? `<small>${formatCurrency(item.total_bayar)}</small>` : ""}
          </article>
        `
      ).join("")}
    </section>
  `;
}

export async function render({ params }) {
  const config = AREA_CONFIG[params.area] || AREA_CONFIG.support;
  const role = ROLE_DEFINITIONS[config.owner];
  const [productsResult] = await Promise.allSettled([
    browseProducts({ includeInactive: true, limit: 100 }),
  ]);
  const products =
    productsResult.status === "fulfilled" ? productsResult.value.data.items : [];
  const orders = getStoredOrders();
  const activeProducts = products.filter((product) => product.status_aktif);
  const inactiveProducts = products.filter((product) => !product.status_aktif);
  const subtotal = orders.reduce((total, order) => total + Number(order.total_bayar || 0), 0);

  return `
    <section class="role-dashboard-hero">
      <div>
        <p class="eyebrow">${escapeHtml(config.eyebrow)}</p>
        <h1>${escapeHtml(config.title)}</h1>
        <p>${escapeHtml(config.description)}</p>
      </div>
      <aside class="role-summary-card">
        <span class="role-pill">${escapeHtml(role.label)}</span>
        <p>${escapeHtml(role.description)}</p>
      </aside>
    </section>

    <section class="seller-stats">
      ${metricCard("Produk aktif", String(activeProducts.length), "Data dari backend seller/products")}
      ${metricCard("Produk nonaktif", String(inactiveProducts.length), "Butuh review katalog")}
      ${metricCard("Order lokal", String(orders.length), "Dari checkout browser ini")}
      ${metricCard("GMV lokal", formatCurrency(subtotal), "Estimasi dari order tersimpan")}
    </section>

    <section class="role-work-grid">
      <article class="summary-card">
        <h2>Bagian ini mengerjakan</h2>
        <ul class="role-task-list">
          ${config.work.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </article>

      <article class="summary-card">
        <h2>Flow eskalasi</h2>
        <div class="flow-steps">
          <span>Buyer/Seller</span>
          <span>Customer Support</span>
          <span>Finance/Fulfillment/Catalog</span>
          <span>Platform Admin atau Tech Maintainer</span>
        </div>
      </article>
    </section>

    ${workQueue(config, products, orders)}
  `;
}
