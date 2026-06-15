import { ProductGrid as renderProductGrid } from "./ProductCard.js";

export function ProductGrid(items, compact = false) {
  return renderProductGrid(items, compact);
}
