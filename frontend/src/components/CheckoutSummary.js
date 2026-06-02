import { formatCurrency } from "../utils/formatCurrency.js";

export function CheckoutSummary({ summary, buttonLabel = "Checkout", disabled = false }) {
  const subtotal = Number(summary.subtotal || 0);
  const discount = Number(summary.discount ?? summary.discount_amount ?? 0);
  const shipping = Number(summary.shipping ?? summary.shipping_cost ?? 0);
  const marketplaceFee = Number(summary.marketplace_fee || 0);
  const gatewayFee = Number(summary.gateway_fee || 0);
  const total = Number(summary.total ?? summary.total_bayar ?? subtotal + shipping + marketplaceFee + gatewayFee - discount);

  return `
    <aside class="summary-card">
      <div class="summary-card-header">
        <span data-lucide="credit-card"></span>
        <h2>Ringkasan belanja</h2>
      </div>
      <div class="summary-lines">
        <div>
          <span>Subtotal</span>
          <strong>${formatCurrency(subtotal)}</strong>
        </div>
        <div>
          <span>Biaya layanan</span>
          <strong>${formatCurrency(marketplaceFee)}</strong>
        </div>
        <div>
          <span>Biaya gateway</span>
          <strong>${formatCurrency(gatewayFee)}</strong>
        </div>
        <div>
          <span>Diskon</span>
          <strong>${formatCurrency(discount)}</strong>
        </div>
        <div>
          <span>Ongkir</span>
          <strong>${formatCurrency(shipping)}</strong>
        </div>
        <div class="summary-total">
          <span>Total pembayaran</span>
          <strong>${formatCurrency(total)}</strong>
        </div>
      </div>
      <button class="btn btn-primary full-width" type="submit" ${disabled ? "disabled" : ""}>
        ${buttonLabel}
      </button>
    </aside>
  `;
}
