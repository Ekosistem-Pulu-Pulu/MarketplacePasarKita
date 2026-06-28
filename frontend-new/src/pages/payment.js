import { formatCurrency } from "../utils/formatCurrency.js";
import { findGuestOrder, findOrder, setOrderStatus } from "../services/orderService.js";
import { getUser, isLoggedIn, readGuestDraft } from "../utils/storage.js";
import { emptyState, toast } from "../utils/ui.js";

let activeOrder;

export async function render({ params }) {
  // Coba ambil order: legacy (logged-in) atau guest (lookup by order_id + email)
  let order = null;
  if (isLoggedIn()) {
    order = await findOrder(params.id);
  } else {
    const draft = readGuestDraft() || {};
    const candidateEmails = [];
    if (draft.email) candidateEmails.push(draft.email);
    if (!candidateEmails.length) {
      try {
        const allOrders = JSON.parse(localStorage.getItem("pasarkita_orders") || "[]");
        const local = allOrders.find((o) => o.id === params.id);
        if (local) order = local;
      } catch { /* ignore */ }
    }
    for (const email of candidateEmails) {
      const guest = await findGuestOrder(params.id, email).catch(() => null);
      if (guest) {
        order = mergeGuestOrder(guest, params.id, draft);
        break;
      }
    }
  }
  if (!order) return `<section class="container page-space">${emptyState({ icon: "receipt-text", title: "Pesanan tidak ditemukan", message: "Nomor pesanan tidak tersedia.", action: `<a class="btn btn-primary" href="#/orders">Lihat Pesanan</a>` })}</section>`;
  activeOrder = order;
  return renderPayment(order);
}

function mergeGuestOrder(serverOrder, id, draft) {
  return {
    id: serverOrder.order_id || id,
    status: humanStatus(serverOrder.status_order || serverOrder.status),
    isLocal: false,
    isGuest: true,
    items: (serverOrder.items || []).map((item) => ({
      product: { name: item.nama_produk, image: "", store: { name: "" } },
      qty: item.qty,
      variant: item.variant || "",
    })),
    recipient: serverOrder.recipient || draft,
    payment: { id: paymentChannelFromIntent(serverOrder.payment_method), name: paymentChannelFromIntent(serverOrder.payment_method) },
    shipping: { id: serverOrder.shipping_rate_id, name: (serverOrder.shipping_courier || "") + " " + (serverOrder.shipping_service || ""), carrier: serverOrder.shipping_courier, service: serverOrder.shipping_service, eta: serverOrder.shipping_eta, price: serverOrder.shipping_cost },
    totals: {
      subtotal: serverOrder.subtotal,
      discount: 0,
      shipping: serverOrder.shipping_cost,
      payment: 0,
      serviceFee: serverOrder.marketplace_fee,
      bankFee: serverOrder.bank_fee,
      gatewayFee: serverOrder.gateway_fee,
      systemTax: serverOrder.system_tax,
      total: serverOrder.total_bayar,
    },
    payment_intent_id: serverOrder.payment_request_id,
    virtual_account: "",
    payment_url: serverOrder.payment_intent_url,
    payment_expires_at: "",
    createdAt: serverOrder.created_at,
  };
}

function humanStatus(status) {
  switch (status) {
    case "PENDING_PAYMENT": return "Menunggu Pembayaran";
    case "PAYMENT_PROCESSING": return "Pembayaran Diproses";
    case "PAID": return "Pembayaran Diterima";
    case "READY_FOR_SHIPMENT": return "Pesanan Dikemas";
    case "SHIPPED": return "Pesanan Dikirim";
    case "DELIVERED":
    case "COMPLETED": return "Pesanan Selesai";
    case "CANCELLED": return "Pesanan Dibatalkan";
    default: return status || "Menunggu Pembayaran";
  }
}

function paymentChannelFromIntent(method) {
  const m = String(method || "").toUpperCase();
  if (m === "VIRTUAL_ACCOUNT" || m === "VA") return "virtual-account";
  if (m === "EWALLET") return "ewallet";
  if (m === "COD") return "cod";
  return m.toLowerCase() || "virtual-account";
}

export function afterRender({ params, navigate }) {
  document.querySelector("#copy-va")?.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(document.querySelector("#va-number").textContent.replaceAll(" ", ""));
    toast("Nomor Virtual Account disalin.", "info");
  });
  document.querySelector("#mark-paid")?.addEventListener("click", async () => {
    try {
      await setOrderStatus(params.id, activeOrder.payment?.id === "cod" ? "Pesanan Dikemas" : "Pembayaran Diproses");
      toast(activeOrder.payment?.id === "cod" ? "Pesanan dikonfirmasi dan diteruskan ke seller." : "Pembayaran diterima dan sedang diproses.");
      navigate(`/order/${params.id}`);
    } catch (error) {
      toast(error.message, "error");
    }
  });
}

function renderPayment(order) {
  const paid = !["Menunggu Pembayaran", "PENDING_PAYMENT"].includes(order.status);
  const isCod = order.payment?.id === "cod";
  const isWallet = order.payment?.id === "ewallet";
  const paymentLabel = isWallet ? "Kode Pembayaran E-Wallet" : "Virtual Account PasarKita";
  const fallbackVA = `8808 1200 ${String(order.id || "").replace(/\D/g, "").padEnd(8, "0").slice(-8)}`;
  const paymentCode = order.virtual_account || (isWallet ? `PKPAY-${String(order.id || "").slice(-6)}` : fallbackVA);
  const expires = order.payment_expires_at ? new Date(order.payment_expires_at).toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : new Date(Date.now() + 86400000).toLocaleDateString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const recipient = order.recipient || {};
  return `
    <section class="payment-page">
      <div class="payment-panel">
        <div class="payment-icon ${paid ? "paid" : ""}"><span data-lucide="${paid ? "circle-check" : isCod ? "banknote" : isWallet ? "wallet-cards" : "landmark"}"></span></div>
        <span class="eyebrow">${paid ? "Pembayaran diterima" : isCod ? "Bayar di tempat" : "Menunggu pembayaran"}</span>
        <h1>${paid ? "Pembayaran sedang diproses" : isCod ? "Pesanan siap dikonfirmasi" : `Bayar sebelum ${expires}`}</h1>
        <p>${paid ? "Kami sedang memverifikasi pembayaranmu dan akan memberi kabar setelah seller mulai mengemas pesanan." : isCod ? "Kamu akan melakukan pembayaran tunai saat kurir mengantarkan pesanan." : `Gunakan ${paymentLabel.toLowerCase()} berikut untuk menyelesaikan pembayaran.`}</p>
        <div class="payment-total"><span>Total Pembayaran</span><strong>${formatCurrency(order.totals?.total || order.totals)}</strong></div>
        ${order.totals?.bankFee || order.totals?.systemTax ? `
          <div class="payment-breakdown">
            <div><span>Subtotal</span><strong>${formatCurrency(order.totals.subtotal)}</strong></div>
            <div><span>Marketplace 2%</span><strong>${formatCurrency(order.totals.serviceFee)}</strong></div>
            <div><span>Bank fee (SmartBank)</span><strong>${formatCurrency(order.totals.bankFee || 0)}</strong></div>
            <div><span>Gateway fee (SmartBank)</span><strong>${formatCurrency(order.totals.gatewayFee || 0)}</strong></div>
            <div><span>Pajak sistem (SmartBank)</span><strong>${formatCurrency(order.totals.systemTax || 0)}</strong></div>
          </div>
        ` : ""}
        ${isCod ? "" : `<div class="va-card"><div><span>${paymentLabel}</span><strong id="va-number">${paymentCode}</strong></div><button type="button" id="copy-va"><span data-lucide="copy"></span>Salin</button></div>`}
        <div class="payment-instructions"><h2>${isCod ? "Informasi Penting" : "Cara Pembayaran"}</h2><ol>${isCod ? `<li>Siapkan uang tunai sesuai total pembayaran.</li><li>Pastikan paket masih tersegel saat diterima.</li><li>Bayar langsung kepada kurir yang mengantar.</li>` : isWallet ? `<li>Buka aplikasi E-Wallet yang kamu pilih.</li><li>Pilih menu pembayaran atau scan kode.</li><li>Masukkan kode pembayaran dan pastikan nominal sesuai.</li><li>Selesaikan transaksi lalu tekan tombol di bawah.</li>` : `<li>Buka aplikasi mobile banking atau ATM pilihanmu.</li><li>Pilih menu transfer Virtual Account.</li><li>Masukkan nomor VA dan pastikan nominal sesuai.</li><li>Selesaikan transaksi lalu tekan tombol di bawah.</li>`}</ol></div>
        ${order.isGuest ? `<p class="payment-meta">Pesanan tamu atas nama <strong>${escapeEmail(recipient.email)}</strong> — simpan email untuk melacak pesanan tanpa login.</p>` : ""}
        ${paid ? `<a class="btn btn-primary full" href="#/order/${order.id}">Lihat Status Pesanan</a>` : `<button class="btn btn-primary full" id="mark-paid"><span data-lucide="circle-check"></span>${isCod ? "Konfirmasi Pesanan" : "Saya Sudah Bayar"}</button>`}
        <a class="payment-link" href="#/orders">Kembali ke daftar pesanan</a>
      </div>
    </section>
  `;
}

function escapeEmail(email) {
  const node = document.createElement("div");
  node.textContent = String(email || "");
  return node.innerHTML;
}
