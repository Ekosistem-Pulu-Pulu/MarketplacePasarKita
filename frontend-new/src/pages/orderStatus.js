import { formatCurrency } from "../utils/formatCurrency.js";
import { findOrder, listOrders, setOrderStatus } from "../services/orderService.js";
import { orderStatuses } from "../data/orders.js";
import { OrderStepper } from "../components/OrderStepper.js";
import { emptyState, escapeHtml, toast } from "../utils/ui.js";

function statusClass(status) {
  if (status === "Pesanan Selesai") return "success";
  if (status === "Menunggu Pembayaran") return "warning";
  return "info";
}

function renderRecipientBlock(order) {
  // Untuk guest order, tampilkan info penerima dengan field alamat terpisah
  // (disediakan oleh LogistikKita untuk perhitungan ongkir).
  if (order.recipient && order.recipient.namaPenerima) {
    const r = order.recipient;
    return `
      <div class="recipient-block">
        <div class="recipient-row"><span data-lucide="user"></span><div><strong>${escapeHtml(r.namaPenerima)}</strong><small>${escapeHtml(r.email || "")}${r.phone ? ` · ${escapeHtml(r.phone)}` : ""}</small></div></div>
        <div class="recipient-row"><span data-lucide="map-pin"></span><div><strong>${escapeHtml(r.alamatLengkap || "")}</strong><small>${escapeHtml(r.kelurahan || "")}${r.kelurahan && (r.kecamatan || r.kota) ? ", " : ""}${escapeHtml(r.kecamatan || "")}${r.kecamatan && r.kota ? ", " : ""}${escapeHtml(r.kota || "")}${r.country && r.country !== "Indonesia" ? ` · ${escapeHtml(r.country)}` : ""}</small></div></div>
      </div>
    `;
  }
  return `<div><span>Alamat</span><strong>${order.address?.label || "Rumah"}</strong></div>`;
}

function renderShipmentTracking(order) {
  if (!order.shipment && !order.shippingWaybill) return "";
  const shipment = order.shipment || {};
  const courier = shipment.courier || order.shipping?.name || "LogistikKita";
  const waybill = order.shippingWaybill || shipment.waybill || "";
  const trackingUrl = shipment.trackingUrl || (waybill ? `https://track.logistikkita.id/${encodeURIComponent(waybill)}` : "");
  const statusText = order.shipmentStatus || shipment.status || "Menunggu penjemputan";
  return `
    <div class="shipment-tracking-card">
      <div class="shipment-tracking-head"><span data-lucide="truck"></span><div><strong>${escapeHtml(courier)}</strong><small>${escapeHtml(statusText)}</small></div></div>
      ${waybill ? `<div class="shipment-waybill"><span>No. Resi</span><b>${escapeHtml(waybill)}</b>${trackingUrl ? `<a class="btn btn-soft btn-sm" href="${escapeHtml(trackingUrl)}" target="_blank" rel="noopener">Lacak di LogistikKita</a>` : ""}</div>` : ""}
    </div>
  `;
}

let activeOrder;

export async function render({ params }) {
  if (!params.id) {
    const orders = await listOrders();
    return `
      <section class="container page-heading"><div><span class="eyebrow">Riwayat transaksi</span><h1>Pesanan Saya</h1><p>Pantau pembayaran, pengiriman, dan pesanan yang selesai.</p></div><a class="btn btn-secondary" href="#/products">Belanja Lagi</a></section>
      <section class="container order-list-page">${orders.length ? orders.map((order) => `
        <article class="order-card">
          <div class="order-card-top"><span>${new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span><b>${order.id}</b><em class="status-pill ${statusClass(order.status)}">${order.status}</em></div>
          <div class="order-card-body"><img src="${order.items[0].product.image}" alt="" /><div><strong>${escapeHtml(order.items[0].product.name)}</strong><p>${order.items.length > 1 ? `+${order.items.length - 1} produk lainnya` : order.items[0].product.store.name}</p></div><div><span>Total Belanja</span><strong>${formatCurrency(order.totals.total)}</strong></div></div>
          <div class="order-card-actions">${order.status === "Menunggu Pembayaran" ? `<a class="btn btn-soft" href="#/payment/${order.id}">Bayar Sekarang</a>` : ""}<a class="btn btn-primary" href="#/order/${order.id}">Lihat Detail</a></div>
        </article>`).join("") : emptyState({ icon: "receipt-text", title: "Belum ada pesanan", message: "Pesanan yang kamu buat akan muncul di halaman ini.", action: `<a class="btn btn-primary" href="#/products">Mulai Belanja</a>` })}</section>
    `;
  }

  const order = await findOrder(params.id);
  if (!order) return `<section class="container page-space">${emptyState({ icon: "receipt-text", title: "Pesanan tidak ditemukan", message: "Nomor pesanan tidak tersedia.", action: `<a class="btn btn-primary" href="#/orders">Lihat Pesanan</a>` })}</section>`;
  activeOrder = order;
  const activeIndex = Math.max(0, orderStatuses.indexOf(order.status));
  return `
    <section class="container page-heading"><div><span class="eyebrow">Detail pesanan${order.isGuest ? " · Guest" : ""}</span><h1>${order.id}</h1><p>Dibuat ${new Date(order.createdAt).toLocaleString("id-ID")}</p></div><a class="btn btn-secondary" href="#/orders">Semua Pesanan</a></section>
    <section class="container order-detail-layout">
      <main>
        <section class="order-status-card"><div class="order-status-head"><div class="status-hero-icon"><span data-lucide="${order.status === "Pesanan Selesai" ? "package-check" : "truck"}"></span></div><div><span class="status-pill ${statusClass(order.status)}">${order.status}</span><h2>${activeIndex < 3 ? "Pesananmu sedang kami siapkan" : activeIndex === 3 ? "Pesanan sedang dalam perjalanan" : "Pesanan telah selesai"}</h2><p>Setiap perubahan status akan tercatat di halaman ini.</p></div></div>
          ${OrderStepper(order.status)}
        </section>
        ${renderShipmentTracking(order)}
        <section class="checkout-card"><div class="checkout-card-heading"><span data-lucide="package"></span><div><h2>Produk Dipesan</h2><p>${order.items.length} produk dalam pesanan ini.</p></div></div><div class="checkout-products">${order.items.map((item) => `<article><img src="${item.product.image}" alt="" /><div><small>${item.product.store.name}</small><strong>${escapeHtml(item.product.name)}</strong><span>${item.qty} barang · ${item.variant || "Standar"}</span></div><b>${formatCurrency(item.product.price * item.qty)}</b></article>`).join("")}</div></section>
      </main>
      <aside class="summary-card order-side">
        <h2>Ringkasan Pesanan</h2>
        <div><span>Metode pembayaran</span><strong>${order.payment?.name || order.paymentMethod || "SmartBank"}</strong></div>
        <div><span>Pengiriman</span><strong>${renderShippingName(order)}</strong></div>
        ${renderRecipientBlock(order)}
        <hr/>
        <div class="summary-total"><span>Total</span><strong>${formatCurrency(order.totals?.total || 0)}</strong></div>
        ${order.status === "Menunggu Pembayaran" ? `<a class="btn btn-primary full" href="#/payment/${order.id}">Bayar Sekarang</a>` : activeIndex < orderStatuses.length - 1 && order.isLocal ? `<button class="btn btn-soft full" id="advance-status">Simulasikan Status Berikutnya</button>` : `<a class="btn btn-secondary full" href="#/products">Belanja Lagi</a>`}
      </aside>
    </section>
  `;
}

function renderShippingName(order) {
  if (order.shipping?.name) return order.shipping.name;
  if (order.shippingMethod) return order.shippingMethod;
  if (order.shippingCourier) return `${order.shippingCourier}${order.shippingService ? ` · ${order.shippingService}` : ""}`;
  return "LogistikKita";
}

export function afterRender({ params, renderRoute }) {
  document.querySelector("#advance-status")?.addEventListener("click", async () => {
    const order = activeOrder;
    const nextStatus = orderStatuses[Math.min(orderStatuses.length - 1, orderStatuses.indexOf(order.status) + 1)];
    await setOrderStatus(order.id, nextStatus);
    toast(`Status berubah menjadi ${nextStatus}.`);
    renderRoute();
  });
}
