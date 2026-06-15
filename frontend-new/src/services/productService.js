import { filterProducts, getProductById, products as fallbackProducts } from "../data/products.js";
import { browseProducts, fetchProduct } from "../api/marketplaceApi.js";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));
const cache = new Map();
let snapshot = [...fallbackProducts];

const sortMap = {
  "price-low": "price_asc",
  "price-high": "price_desc",
  rating: "rating_desc",
  sold: "sold_desc",
};

export async function getProducts(filters = {}) {
  try {
    const response = await browseProducts({
      keyword: filters.query || filters.q || "",
      category: filters.category || "",
      location: filters.location || "",
      minPrice: filters.minPrice || "",
      maxPrice: filters.maxPrice || "",
      rating: filters.rating || "",
      promo: Boolean(filters.promo),
      sort: sortMap[filters.sort] || "",
      limit: filters.limit || 100,
    });
    const rawItems = Array.isArray(response) ? response : response?.items || response?.products || [];
    const items = rawItems.filter(Boolean);
    if (Array.isArray(rawItems)) {
      if (items.length) {
        snapshot = items;
        items.forEach((product) => cache.set(product.id, product));
      }
      return items;
    }
  } catch (error) {
    if (!error.isNetworkError) throw error;
    // Offline demo falls back to the complete local catalog.
  }
  await wait();
  return filterProducts(filters);
}

export async function getProduct(id) {
  if (cache.has(id)) return cache.get(id);
  try {
    const product = await fetchProduct(id);
    cache.set(id, product);
    return product;
  } catch (error) {
    if (!error.isNetworkError) throw error;
    await wait(120);
    return getProductById(id);
  }
}

export async function getFeaturedProducts(limit = 8) {
  const items = await getProducts();
  return items.filter((product) => product.featured).slice(0, limit).concat(items.slice(0, limit)).slice(0, limit);
}

export async function getSimilarProducts(product, limit = 4) {
  const items = await getProducts({ category: product.categoryId });
  return items.filter((item) => item.id !== product.id).slice(0, limit);
}

export function getProductSnapshot() {
  return snapshot;
}
