import { getOrderStatus, listOrders } from "../api/marketplaceApi.js";
import { EmptyState } from "../components/EmptyState.js";
import { StatusBadge, getStatusMeta } from "../components/StatusBadge.js";
import { formatCurrency } from "../utils/currency.js";
import { getStoredOrder, getStoredOrders, rememberOrder } from "../utils/orders.js";
import { escapeHtml } from "../utils/validation.js";

const timelineSteps = [
  { status: "PENDING_PAYMENT", label: "Checkout dibuat" },
  { status: "PAYMENT_PROCESSING", label: "Payment diproses" },
  { status: "PAID", label: "Pembayaran berhasil" },
  { status: "READY_FOR_SHIPMENT", label: "Seller siapkan barang" },
  { status: "SHIPPED", label: "Dikirim" },
  { status: "COMPLETED", label: "Selesai" },
];

function statusIndex(status) {
  const index = timelineSteps.findIndex((step) => step.status === status);
  return index === -1 ? 0 : index;
}

function orderCard(order) {
  const firstItem = Array.isArray(order.items) ? order.items[0] : null;
  return `
    <article class="order-card">
      <div>
        <strong>${escapeHtml(order.order_id)}</strong>
        <p>${escapeHtml(order.nama_produk || firstItem?.nama_produk || order.product_id || "Order marketplace")}</p>
      </div>
      <div class="order-card-side">
        ${StatusBadge(order.status_order)}
        <strong>${formatCurrency(order.total_bayar || 0)}</strong>
        <a class="secondary-button small" href="#/orders/${escapeHtml(order.order_id)}">Detail</a>
      </div>
    </article>
  `;
}

function timeline(status) {
  const current = statusIndex(status);
  const failed = status === "PAYMENT_FAILED" || status === "CANCELLED";

  return `
    <div class="timeline">
      ${timelineSteps
        .map((step, index) => {
          const state = failed && index === 1 ? "failed" : index < current ? "done" : index === current ? "active" : "";
          return `
            <div class="timeline-step ${state}">
              <span aria-hidden="true"></span>
              <strong>${step.label}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

async function renderOrderDetail(orderId) {
  let order;

  try {
    const response = await getOrderStatus(orderId);
    order = response.data;
    rememberOrder(order);
  } catch {
    order = getStoredOrder(orderId);
  }

  if (!order) {
    return EmptyState({
      title: "Order tidak ditemukan",
      message: "Order belum tersimpan di browser dan API tidak mengembalikan data.",
      action: `<a class="primary-button" href="#/orders">Lihat daftar order</a>`,
    });
  }

  const meta = getStatusMeta(order.status_order);

  return `
    <section class="order-detail-layout">
      <article class="status-card order-detail-card">
        <p class="eyebrow">Status order</p>
        <h2>${escapeHtml(order.order_id)}</h2>
        <div class="status-badge-wrap">${StatusBadge(order.status_order)}</div>
        <p class="status-desc">${escapeHtml(meta.description)}</p>
        ${timeline(order.status_order)}
        <div class="status-actions">
          <button class="primary-button" type="button" id="refresh-order">Refresh status</button>
          <a class="secondary-button" href="#/orders">Daftar order</a>
          <a class="secondary-button" href="#/products">Belanja lagi</a>
        </div>
      </article>

      <aside class="summary-card">
        <h2>Detail transaksi</h2>
        <div class="order-items">
          <div class="order-item-row"><span>Produk</span><strong>${escapeHtml(order.nama_produk || order.product_id || "-")}</strong></div>
          <div class="order-item-row"><span>Qty</span><strong>${order.qty || "-"}</strong></div>
          <div class="order-item-row"><span>Subtotal</span><strong>${formatCurrency(order.subtotal || 0)}</strong></div>
          <div class="order-item-row"><span>Marketplace fee</span><strong>${formatCurrency(order.marketplace_fee || 0)}</strong></div>
          <div class="order-item-row"><span>Total bayar</span><strong>${formatCurrency(order.total_bayar || 0)}</strong></div>
          <div class="order-item-row"><span>Payment request</span><strong>${escapeHtml(order.payment_request_id || "-")}</strong></div>
        </div>
        <div class="shipping-box">
          <strong>Alamat pengiriman</strong>
          <p>${escapeHtml(order.alamat_pengiriman || "Alamat mengikuti request checkout.")}</p>
        </div>
      </aside>
    </section>
  `;
}

async function renderOrderList() {
  let orders = getStoredOrders();
  try {
    const response = await listOrders();
    if (Array.isArray(response.data)) {
      orders = response.data;
      orders.forEach((order) => rememberOrder(order));
    }
  } catch {
    // Stored browser orders are the fallback when backend is unavailable.
  }

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Order</p>
        <h1>Daftar order terakhir</h1>
        <p>Order diambil dari backend ketika login, lalu disimpan lokal sebagai fallback.</p>
      </div>
      <a class="secondary-button" href="#/products">Belanja lagi</a>
    </section>

    ${
      orders.length
        ? `<section class="order-list">${orders.map(orderCard).join("")}</section>`
        : EmptyState({
            title: "Belum ada order",
            message: "Checkout produk terlebih dahulu untuk melihat daftar order.",
          })
    }
  `;
}

export async function render({ params }) {
  return params.id ? renderOrderDetail(params.id) : renderOrderList();
}

export function afterRender({ renderRoute }) {
  document.querySelector("#refresh-order")?.addEventListener("click", renderRoute);
}
