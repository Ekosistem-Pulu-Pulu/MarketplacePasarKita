import { getOrderStatus } from "../api/marketplaceApi.js";
import { StatusBadge, getStatusMeta } from "../components/StatusBadge.js";
import { formatCurrency } from "../utils/currency.js";
import { escapeHtml } from "../utils/validation.js";

export async function render({ params }) {
  const response = await getOrderStatus(params.id);
  const order = response.data;
  const meta = getStatusMeta(order.status_order);

  return `
    <section class="order-status-layout">
      <article class="card-panel order-status-card">
        <p class="eyebrow">Status order</p>
        <div class="order-status-head">
          <div>
            <h1>${escapeHtml(order.order_id)}</h1>
            <p>${escapeHtml(meta.description)}</p>
          </div>
          ${StatusBadge(order.status_order)}
        </div>

        <dl class="detail-list">
          <div>
            <dt>Produk</dt>
            <dd>${escapeHtml(order.nama_produk || order.product_id)}</dd>
          </div>
          <div>
            <dt>Qty</dt>
            <dd>${order.qty || "-"}</dd>
          </div>
          <div>
            <dt>Subtotal</dt>
            <dd>${formatCurrency(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Marketplace fee</dt>
            <dd>${formatCurrency(order.marketplace_fee)}</dd>
          </div>
          <div>
            <dt>Total bayar</dt>
            <dd>${formatCurrency(order.total_bayar)}</dd>
          </div>
          <div>
            <dt>Payment request</dt>
            <dd>${escapeHtml(order.payment_request_id || "-")}</dd>
          </div>
        </dl>

        <div class="integration-note">
          Status diambil dari <code>GET /marketplace/status_order?order_id=${escapeHtml(order.order_id)}</code>.
          Frontend hanya membaca status dari API atau mock data.
        </div>

        <div class="form-actions">
          <button class="primary-button" type="button" id="refresh-order">Refresh status</button>
          <a class="secondary-button" href="#/products">Kembali ke katalog</a>
        </div>
      </article>
    </section>
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelector("#refresh-order")?.addEventListener("click", renderRoute);
}
