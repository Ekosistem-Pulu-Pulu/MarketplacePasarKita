import { formatCurrency } from "../utils/formatCurrency.js";

export function SellerStats(stats) {
  const items = [
    ["circle-dollar-sign", "Pendapatan Bulan Ini", formatCurrency(stats.revenue), "+18,4% dari bulan lalu"],
    ["receipt-text", "Pesanan Masuk", stats.orders, "12 perlu diproses"],
    ["package", "Total Produk", stats.products, "Semua aktif"],
    ["star", "Rating Toko", stats.rating, "Dari 1.824 ulasan"],
  ];
  return `<div class="seller-stats">${items.map(([icon, label, value, note]) => `<article><span data-lucide="${icon}"></span><div><small>${label}</small><strong>${value}</strong><em>${note}</em></div></article>`).join("")}</div>`;
}
