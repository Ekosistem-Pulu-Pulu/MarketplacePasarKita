import { formatCurrency } from "../utils/formatCurrency.js";

export function CheckoutSummary(totals) {
  return `
    <aside class="summary-card checkout-summary">
      <h2>Ringkasan Pembayaran</h2>
      <div><span>Subtotal produk</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
      <div><span>Ongkos kirim</span><strong>${formatCurrency(totals.shipping.price)}</strong></div>
      <div><span>Biaya pembayaran</span><strong>${formatCurrency(totals.payment.fee)}</strong></div>
      <div><span>Biaya layanan</span><strong>${formatCurrency(totals.serviceFee)}</strong></div>
      <div><span>Potongan belanja</span><strong class="positive">-${formatCurrency(totals.discount)}</strong></div>
      <hr />
      <div class="summary-total"><span>Total pembayaran</span><strong>${formatCurrency(totals.total)}</strong></div>
      <button class="btn btn-primary full" type="submit"><span data-lucide="lock-keyhole"></span>Buat Pesanan</button>
      <small>Dengan melanjutkan, kamu menyetujui syarat dan ketentuan PasarKita.</small>
    </aside>
  `;
}
