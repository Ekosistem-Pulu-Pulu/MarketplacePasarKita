import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import {
  cancelBuyerOrder,
  getBuyerOrders,
  getOrder,
  getOrderTracking,
} from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

function statusLabel(status) {
  const labels = {
    PENDING_PAYMENT: "Menunggu pembayaran",
    PAYMENT_PROCESSING: "Pembayaran diproses",
    PAYMENT_FAILED: "Pembayaran gagal",
    PAID: "Dibayar",
    READY_FOR_SHIPMENT: "Siap dikirim",
    SHIPPED: "Dikirim",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] || "Diproses";
}

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

function timeline(status) {
  const current = statusIndex(status);
  const failed = status === "PAYMENT_FAILED" || status === "CANCELLED";

  return `
    <div class="timeline" style="margin-top: 16px;">
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

function orderCard(order) {
  const firstItem = order.items?.[0];
  return `
    <article class="order-card">
      <div>
        <span class="eyebrow">${escapeHtml(statusLabel(order.status_order))}</span>
        <h2>${escapeHtml(order.invoice_number || order.order_id)}</h2>
        <p>${escapeHtml(firstItem?.nama_produk || "Pesanan PasarKita")}</p>
      </div>
      <div class="order-card-side">
        <strong>${formatCurrency(order.total_bayar || 0)}</strong>
        <a class="btn btn-secondary" href="#/orders/${encodeURIComponent(order.order_id)}">Detail</a>
      </div>
    </article>
  `;
}

function orderDetail(order, tracking) {
  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">${escapeHtml(statusLabel(order.status_order))}</span>
        <h1>${escapeHtml(order.invoice_number || order.order_id)}</h1>
        <p>Payment berjalan melalui Gateway dan SmartBank. Pengiriman diproses melalui LogistiKita.</p>
      </div>
      <a class="btn btn-secondary" href="#/orders">Semua pesanan</a>
    </section>

    <section class="checkout-layout">
      <div class="checkout-main">
        <section class="checkout-card">
          <div class="checkout-card-heading">
            <span data-lucide="package"></span>
            <h2>Item pesanan</h2>
          </div>
          ${(order.items || [])
            .map(
              (item) => `
                <article class="checkout-item">
                  <div>
                    <strong>${escapeHtml(item.nama_produk)}</strong>
                    <span>${item.qty} x ${formatCurrency(item.harga)}</span>
                  </div>
                </article>
              `
            )
            .join("")}
        </section>

        <section class="checkout-card">
          <div class="checkout-card-heading">
            <span data-lucide="truck"></span>
            <h2>Status pengiriman</h2>
          </div>
          <p><strong>${escapeHtml(statusLabel(tracking?.status || order.status_order))}</strong></p>
          ${[tracking?.courier, tracking?.service, tracking?.estimated_days].filter(Boolean).length ? `<p>${escapeHtml([tracking?.courier, tracking?.service, tracking?.estimated_days].filter(Boolean).join(" - "))}</p>` : ""}
          ${timeline(order.status_order)}
        </section>
      </div>

      <aside class="summary-card">
        <div class="summary-card-header">
          <span data-lucide="receipt-text"></span>
          <h2>Ringkasan</h2>
        </div>
        <div class="summary-lines">
          <div><span>Subtotal</span><strong>${formatCurrency(order.subtotal || 0)}</strong></div>
          <div><span>Biaya layanan</span><strong>${formatCurrency(order.marketplace_fee || 0)}</strong></div>
          <div><span>Biaya gateway</span><strong>${formatCurrency(order.gateway_fee || 0)}</strong></div>
          <div><span>Ongkir</span><strong>${formatCurrency(order.shipping_cost || 0)}</strong></div>
          <div><span>Diskon</span><strong>${formatCurrency(order.discount_amount || 0)}</strong></div>
          <div class="summary-total"><span>Total pembayaran</span><strong>${formatCurrency(order.total_bayar || 0)}</strong></div>
        </div>
        ${
          ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAYMENT_FAILED"].includes(order.status_order)
            ? `<button class="btn btn-secondary full-width" type="button" data-cancel-order="${escapeHtml(order.order_id)}">Batalkan pesanan</button>`
            : ""
        }
      </aside>
    </section>
  `;
}

export async function render({ params }) {
  if (params.id) {
    const [order, tracking] = await Promise.all([
      getOrder(params.id),
      getOrderTracking(params.id).catch(() => null),
    ]);
    return orderDetail(order, tracking);
  }

  const orders = await getBuyerOrders();
  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Pesanan</span>
        <h1>Riwayat belanja</h1>
        <p>Pantau pembayaran, pengemasan, pengiriman, dan pembatalan pesanan dari akun kamu.</p>
      </div>
      <a class="btn btn-secondary" href="#/products">Belanja lagi</a>
    </section>
    ${
      orders.length
        ? `<section class="order-list">${orders.map(orderCard).join("")}</section>`
        : EmptyState({
            icon: "receipt-text",
            title: "Belum ada pesanan",
            message: "Pesanan yang dibuat dari checkout akan tampil di sini.",
            action: `<a class="btn btn-primary" href="#/products">Buka katalog</a>`,
          })
    }
  `;
}

export function afterRender({ navigate }) {
  document.querySelectorAll("[data-cancel-order]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await cancelBuyerOrder(button.dataset.cancelOrder, "Dibatalkan oleh pembeli");
        showToast("Pesanan dibatalkan.");
        navigate("/orders");
      } catch (error) {
        showToast(error.message || "Pesanan belum bisa dibatalkan.", "error");
      }
    });
  });
}
