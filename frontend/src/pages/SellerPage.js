import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import { getSellerOrders, updateSellerOrderStatus } from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

function sellerOrderCard(order) {
  const firstItem = order.items?.[0];
  return `
    <article class="order-card">
      <div>
        <span class="eyebrow">${escapeHtml(order.status_order || "Diproses")}</span>
        <h2>${escapeHtml(order.invoice_number || order.order_id)}</h2>
        <p>${escapeHtml(firstItem?.nama_produk || "Pesanan toko")}</p>
      </div>
      <div class="order-card-side">
        <strong>${formatCurrency(order.total_bayar || 0)}</strong>
        <button class="btn btn-secondary" type="button" data-seller-status="${escapeHtml(order.order_id)}" data-status="READY_FOR_SHIPMENT">
          Siap dikirim
        </button>
        <button class="btn btn-primary" type="button" data-seller-status="${escapeHtml(order.order_id)}" data-status="SHIPPED">
          Dikirim
        </button>
      </div>
    </article>
  `;
}

export async function render() {
  const orders = await getSellerOrders();
  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Seller</span>
        <h1>Pesanan toko</h1>
        <p>Kelola proses pengemasan dan pengiriman dari pesanan yang masuk ke toko kamu.</p>
      </div>
      <a class="btn btn-secondary" href="#/products">Lihat katalog</a>
    </section>
    ${
      orders.length
        ? `<section class="order-list">${orders.map(sellerOrderCard).join("")}</section>`
        : EmptyState({
            icon: "store",
            title: "Belum ada pesanan toko",
            message: "Pesanan dari pembeli akan tampil di area ini.",
            action: `<a class="btn btn-primary" href="#/products">Buka katalog</a>`,
          })
    }
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelectorAll("[data-seller-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await updateSellerOrderStatus(button.dataset.sellerStatus, button.dataset.status);
        showToast("Status pesanan diperbarui.");
        renderRoute();
      } catch (error) {
        showToast(error.message || "Status belum bisa diperbarui.", "error");
      }
    });
  });
}
