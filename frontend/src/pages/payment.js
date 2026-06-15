import { formatCurrency } from "../utils/formatCurrency.js";
import { getOrder, updateOrderStatus } from "../utils/storage.js";
import { emptyState, toast } from "../utils/ui.js";

export function render({ params }) {
  const order = getOrder(params.id);
  if (!order) return `<section class="container page-space">${emptyState({ icon: "receipt-text", title: "Pesanan tidak ditemukan", message: "Nomor pesanan tidak tersedia.", action: `<a class="btn btn-primary" href="#/orders">Lihat Pesanan</a>` })}</section>`;
  const paid = order.status !== "Menunggu Pembayaran";
  const isCod = order.payment.id === "cod";
  const isWallet = order.payment.id === "ewallet";
  const paymentLabel = isWallet ? "Kode Pembayaran E-Wallet" : "Virtual Account PasarKita";
  const paymentCode = isWallet ? `PKPAY-${String(order.id).slice(-6)}` : `8808 1200 ${String(order.id).replace(/\D/g, "").padEnd(8, "0").slice(-8)}`;
  return `
    <section class="payment-page">
      <div class="payment-panel">
        <div class="payment-icon ${paid ? "paid" : ""}"><span data-lucide="${paid ? "circle-check" : isCod ? "banknote" : isWallet ? "wallet-cards" : "landmark"}"></span></div>
        <span class="eyebrow">${paid ? "Pembayaran diterima" : isCod ? "Bayar di tempat" : "Menunggu pembayaran"}</span>
        <h1>${paid ? "Pembayaran sedang diproses" : isCod ? "Pesanan siap dikonfirmasi" : `Bayar sebelum ${new Date(Date.now() + 86400000).toLocaleDateString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`}</h1>
        <p>${paid ? "Kami sedang memverifikasi pembayaranmu dan akan memberi kabar setelah seller mulai mengemas pesanan." : isCod ? "Kamu akan melakukan pembayaran tunai saat kurir mengantarkan pesanan." : `Gunakan ${paymentLabel.toLowerCase()} berikut untuk menyelesaikan pembayaran.`}</p>
        <div class="payment-total"><span>Total Pembayaran</span><strong>${formatCurrency(order.totals.total)}</strong></div>
        ${isCod ? "" : `<div class="va-card"><div><span>${paymentLabel}</span><strong id="va-number">${paymentCode}</strong></div><button type="button" id="copy-va"><span data-lucide="copy"></span>Salin</button></div>`}
        <div class="payment-instructions"><h2>${isCod ? "Informasi Penting" : "Cara Pembayaran"}</h2><ol>${isCod ? `<li>Siapkan uang tunai sesuai total pembayaran.</li><li>Pastikan paket masih tersegel saat diterima.</li><li>Bayar langsung kepada kurir yang mengantar.</li>` : isWallet ? `<li>Buka aplikasi E-Wallet yang kamu pilih.</li><li>Pilih menu pembayaran atau scan kode.</li><li>Masukkan kode pembayaran dan pastikan nominal sesuai.</li><li>Selesaikan transaksi lalu tekan tombol di bawah.</li>` : `<li>Buka aplikasi mobile banking atau ATM pilihanmu.</li><li>Pilih menu transfer Virtual Account.</li><li>Masukkan nomor VA dan pastikan nominal sesuai.</li><li>Selesaikan transaksi lalu tekan tombol di bawah.</li>`}</ol></div>
        ${paid ? `<a class="btn btn-primary full" href="#/order/${order.id}">Lihat Status Pesanan</a>` : `<button class="btn btn-primary full" id="mark-paid"><span data-lucide="circle-check"></span>${isCod ? "Konfirmasi Pesanan" : "Saya Sudah Bayar"}</button>`}
        <a class="payment-link" href="#/orders">Kembali ke daftar pesanan</a>
      </div>
    </section>
  `;
}

export function afterRender({ params, navigate }) {
  document.querySelector("#copy-va")?.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(document.querySelector("#va-number").textContent.replaceAll(" ", ""));
    toast("Nomor Virtual Account disalin.", "info");
  });
  document.querySelector("#mark-paid")?.addEventListener("click", () => {
    const order = getOrder(params.id);
    updateOrderStatus(params.id, order.payment.id === "cod" ? "Pesanan Dikemas" : "Pembayaran Diproses");
    toast(order.payment.id === "cod" ? "Pesanan dikonfirmasi dan diteruskan ke seller." : "Pembayaran diterima dan sedang diproses.");
    navigate(`/order/${params.id}`);
  });
}
