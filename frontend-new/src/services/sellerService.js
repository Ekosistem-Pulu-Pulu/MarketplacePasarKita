import { createSellerProduct, fetchSellerDashboard } from "../api/marketplaceApi.js";
import { products as fallbackProducts } from "../data/products.js";
import { sellerOrders } from "../data/orders.js";

let localProducts = fallbackProducts.filter((product) => product.store.id === "nusa-tech");

function makeDashboard(products, orders) {
  const mappedOrders = orders.map((order) => order.totals ? {
    id: order.id,
    buyer: order.buyer || "Pembeli PasarKita",
    total: order.totals.total,
    status: order.status,
    createdAt: order.createdAt,
  } : order);
  const revenue = mappedOrders.reduce((total, order) => total + Number(order.total || 0), 0);
  return {
    stats: { revenue, orders: mappedOrders.length, products: products.length, rating: 4.9 },
    weeklySales: [4200000, 5800000, 4600000, 7200000, 6400000, 8800000, Math.max(revenue, 7600000)],
    categorySales: [48, 24, 18, 10],
    products,
    orders: mappedOrders,
  };
}

export async function getSellerDashboard() {
  try {
    return await fetchSellerDashboard();
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return makeDashboard(localProducts, sellerOrders);
  }
}

export async function addSellerProduct(payload) {
  try {
    return await createSellerProduct({
      ...payload,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      variants: [],
      highlights: ["Produk seller terverifikasi", "Dikirim maksimal 24 jam", "Garansi retur 7 hari", "Kemasan aman"],
    });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const product = {
      id: `seller-${Date.now()}`,
      rating: 0,
      sold: 0,
      discount: 0,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      store: { id: "nusa-tech", name: "Nusa Techspace", location: "Bandung", badge: "Official Store" },
      ...payload,
    };
    localProducts = [product, ...localProducts];
    return product;
  }
}
