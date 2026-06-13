import { browseProducts, getProductById } from "../api/marketplaceApi.js";

const sortMap = {
  "price-low": "price_asc",
  "price-high": "price_desc",
};

export function mapProduct(product) {
  if (!product) return null;

  let discount = 0;
  let originalPrice = null;
  const idNum = parseInt(product.product_id?.replace(/\D/g, "") || "0", 10);
  if (idNum && idNum % 3 === 0) {
    discount = ((idNum % 4) + 1) * 5; // 5%, 10%, 15%, 20%
    originalPrice = Math.round(Number(product.harga || 0) / (1 - discount / 100));
  }

  return {
    id: product.product_id,
    name: product.nama_produk,
    description: product.deskripsi || "",
    category: product.kategori || "Produk",
    price: Number(product.harga || 0),
    originalPrice,
    discount,
    rating: Number(product.rating_avg || 0),
    sold: Number(product.sold_count || 0),
    stock: Number(product.stok || 0),
    image: product.image_url || "/src/assets/hero.png",
    specs: [
      product.kondisi ? `Kondisi ${product.kondisi}` : "Kondisi produk dicek penjual",
      product.berat_gram ? `Berat ${product.berat_gram} gram` : "Berat mengikuti data penjual",
      product.lokasi ? `Dikirim dari ${product.lokasi}` : "Pengiriman tersedia",
    ],
    raw: product,
    store: {
      id: product.store_id || product.seller_id || "",
      name: product.store_name || product.seller_id || "Toko PasarKita",
      location: product.lokasi || "Indonesia",
      rating: Number(product.store_rating || product.rating_avg || 0),
    },
  };
}

function applyClientFilters(products, filters) {
  const minPrice = Number(filters.minPrice || 0);
  const maxPrice = Number(filters.maxPrice || 0);
  const minRating = Number(filters.rating || 0);
  let result = products.filter((product) => {
    if (minPrice && product.price < minPrice) return false;
    if (maxPrice && product.price > maxPrice) return false;
    if (minRating && product.rating < minRating) return false;
    return true;
  });

  if (filters.sort === "rating") {
    result = [...result].sort((a, b) => b.rating - a.rating);
  }
  if (filters.sort === "best-selling") {
    result = [...result].sort((a, b) => b.sold - a.sold);
  }

  return result;
}

const productCache = new Map();
const listCache = new Map();
const CACHE_TTL = 15000; // 15 seconds cache TTL

export async function getProducts(filters = {}) {
  const cacheKey = JSON.stringify(filters);
  const cached = listCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await browseProducts({
    keyword: filters.q || filters.keyword || "",
    category: filters.category || "",
    sort: sortMap[filters.sort] || filters.sort || "",
    page: filters.page || 1,
    limit: filters.limit || 48,
  });
  const payload = response.data || {};
  const items = (payload.items || []).map(mapProduct).filter(Boolean);
  const filtered = applyClientFilters(items, filters);
  const result = {
    items: filtered,
    total: payload.total ?? filtered.length,
    page: payload.page ?? 1,
    limit: payload.limit ?? filtered.length,
  };

  listCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function getProduct(productId) {
  const cached = productCache.get(productId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await getProductById(productId);
  const mapped = mapProduct(response.data);
  if (mapped) {
    productCache.set(productId, { data: mapped, timestamp: Date.now() });
  }
  return mapped;
}

export async function getCategoryOptions() {
  const { items } = await getProducts({ limit: 100 });
  return [...new Set(items.map((product) => product.category).filter(Boolean))].map((name) => ({
    name,
    icon: "tag",
    count: items.filter((product) => product.category === name).length,
  }));
}
