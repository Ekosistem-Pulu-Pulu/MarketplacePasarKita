import { orderStatuses } from "../data/orders.js";

export function OrderStepper(status) {
  const activeIndex = orderStatuses.indexOf(status);
  return `<div class="status-timeline">${orderStatuses.map((item, index) => `
    <div class="${index <= activeIndex ? "active" : ""}">
      <span>${index < activeIndex ? `<i data-lucide="check"></i>` : index + 1}</span>
      <strong>${item}</strong>
      <small>${index <= activeIndex ? (index === activeIndex ? "Status saat ini" : "Selesai") : "Menunggu"}</small>
    </div>`).join("")}</div>`;
}
