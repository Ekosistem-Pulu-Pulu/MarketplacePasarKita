import { EmptyState } from "./EmptyState.js";
import { ProductCard } from "./ProductCard.js";

export function ProductGrid({ products, emptyTitle, emptyMessage }) {
  if (!products.length) {
    return EmptyState({
      title: emptyTitle,
      message: emptyMessage,
      icon: "filter",
    });
  }

  return `<div class="product-grid">${products.map(ProductCard).join("")}</div>`;
}
