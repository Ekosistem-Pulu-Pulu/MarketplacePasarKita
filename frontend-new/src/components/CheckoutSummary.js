import { formatCurrency } from "../utils/formatCurrency.js";

// CheckoutSummary menerima satu objek totals dengan struktur sebagai berikut:
// - subtotal, shipping.price, payment.fee        : harga lokal (marketplace)
// - serviceFee / marketplace_fee                  : 2% fee marketplace
// - bankFee, gatewayFee, systemTax                : dari SmartBank payment intent
// - discount                                       : diskon voucher (legacy flow)
// - total                                           : grand total akhir
// - note (string, optional)                        : catatan UI, mis. "fee dihitung setelah submit"
export function CheckoutSummary(totals) {
  const t = totals || {};
  const shipping = t.shipping?.price ?? t.shipping ?? 0;
  const paymentLabel = t.payment?.label || t.payment || "Metode pembayaran";
  const shippingLabel = t.shipping?.label || "Pilih lokasi dulu";
  const note = t.note ? `<p class="summary-note">${escapeNote(t.note)}</p>` : "";
  const feeLines = `
    <div><span>Subtotal produk</span><strong>${formatCurrency(t.subtotal || 0)}</strong></div>
    <div><span>Ongkos kirim <small class="muted">(${escapeNote(shippingLabel)})</small></span><strong>${formatCurrency(Number(shipping) || 0)}</strong></div>
    <div><span>Biaya layanan PasarKita</span><strong>${formatCurrency(t.serviceFee ?? t.marketplace_fee ?? 0)}</strong></div>
    ${t.bankFee ? `<div><span>Biaya bank <small class="muted">(SmartBank)</small></span><strong>${formatCurrency(t.bankFee)}</strong></div>` : ""}
    ${t.gatewayFee ? `<div><span>Biaya gateway <small class="muted">(SmartBank)</small></span><strong>${formatCurrency(t.gatewayFee)}</strong></div>` : ""}
    ${t.systemTax ? `<div><span>Pajak sistem <small class="muted">(SmartBank)</small></span><strong>${formatCurrency(t.systemTax)}</strong></div>` : ""}
    ${t.discount ? `<div><span>Potongan belanja</span><strong class="positive">-${formatCurrency(t.discount)}</strong></div>` : ""}
  `;
  return `
    <aside class="summary-card checkout-summary">
      <h2>Ringkasan Pembayaran</h2>
      ${feeLines}
      <hr />
      <div class="summary-total"><span>Total pembayaran</span><strong>${formatCurrency(t.total || 0)}</strong></div>
      <div class="summary-meta">
        <span><span data-lucide="shield-check"></span>Pembayaran diproses oleh SmartBank</span>
        <span><span data-lucide="truck"></span>Pengiriman oleh LogistikKita</span>
      </div>
      ${note}
      <button class="btn btn-primary full" type="submit"><span data-lucide="lock-keyhole"></span>Buat Pesanan</button>
      <small>Dengan melanjutkan, kamu menyetujui syarat dan ketentuan PasarKita.</small>
    </aside>
  `;
}

function escapeNote(value) {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}
