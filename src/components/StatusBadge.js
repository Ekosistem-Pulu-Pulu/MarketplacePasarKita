export const ORDER_STATUSES = {
  DRAFT: {
    label: "Draft",
    description: "Order belum dikirim.",
    className: "status-draft",
  },
  PENDING_PAYMENT: {
    label: "Menunggu Pembayaran",
    description: "Payment request sudah dibuat dan menunggu proses.",
    className: "status-pending",
  },
  PAYMENT_PROCESSING: {
    label: "Diproses",
    description: "Pembayaran sedang diproses oleh service pembayaran.",
    className: "status-processing",
  },
  PAID: {
    label: "Dibayar",
    description: "Pembayaran berhasil.",
    className: "status-paid",
  },
  PAYMENT_FAILED: {
    label: "Gagal",
    description: "Pembayaran gagal diproses.",
    className: "status-failed",
  },
  READY_FOR_SHIPMENT: {
    label: "Siap Dikirim",
    description: "Order siap masuk proses pengiriman.",
    className: "status-shipment",
  },
  SHIPPED: {
    label: "Dikirim",
    description: "Pesanan sedang dikirim.",
    className: "status-shipped",
  },
  COMPLETED: {
    label: "Selesai",
    description: "Pesanan selesai.",
    className: "status-paid",
  },
  CANCELLED: {
    label: "Dibatalkan",
    description: "Pesanan dibatalkan.",
    className: "status-failed",
  },
};

export function getStatusMeta(status) {
  return (
    ORDER_STATUSES[status] || {
      label: status || "Tidak diketahui",
      description: "Status belum dikenali frontend.",
      className: "status-draft",
    }
  );
}

export function StatusBadge(status) {
  const meta = getStatusMeta(status);

  return `<span class="status-badge ${meta.className}">${meta.label}</span>`;
}
