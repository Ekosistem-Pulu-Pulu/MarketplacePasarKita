export function filterProducts(products, filters = {}) {
  const query = String(filters.q || "").trim().toLowerCase();
  const category = String(filters.category || "").trim();
  const minPrice = Number(filters.minPrice || 0);
  const maxPrice = Number(filters.maxPrice || 0);
  const minRating = Number(filters.rating || 0);

  let result = products.filter((product) => {
    const searchText = [
      product.name,
      product.category,
      product.store.name,
      product.store.location,
      product.description,
    ]
      .join(" ")
      .toLowerCase();

    if (query && !searchText.includes(query)) return false;
    if (category && product.category !== category) return false;
    if (minPrice && product.price < minPrice) return false;
    if (maxPrice && product.price > maxPrice) return false;
    if (minRating && product.rating < minRating) return false;
    return true;
  });

  switch (filters.sort) {
    case "newest":
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "price-low":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case "best-selling":
      result = [...result].sort((a, b) => b.sold - a.sold);
      break;
    case "rating":
      result = [...result].sort((a, b) => b.rating - a.rating);
      break;
    case "discount":
      result = [...result].sort((a, b) => b.discount - a.discount);
      break;
    default:
      result = [...result].sort((a, b) => b.rating * 100 + b.sold - (a.rating * 100 + a.sold));
  }

  return result;
}

export function getActiveFilters(filters = {}) {
  return Object.entries(filters).filter(([, value]) => String(value || "").trim() !== "");
}
