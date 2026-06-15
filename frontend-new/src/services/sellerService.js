import { products } from "../data/products.js";
import { sellerOrders } from "../data/orders.js";

let sellerProducts = products.filter((product) => product.store.id === "nusa-tech");

export async function getSellerDashboard() {
  return {
    stats: { revenue: 28750000, orders: 128, products: sellerProducts.length, rating: 4.9 },
    weeklySales: [4200000, 5800000, 4600000, 7200000, 6400000, 8800000, 7600000],
    categorySales: [48, 24, 18, 10],
    products: [...sellerProducts],
    orders: [...sellerOrders],
  };
}

export async function addSellerProduct(payload) {
  const product = {
    id: `seller-${Date.now()}`,
    rating: 0,
    sold: 0,
    discount: 0,
    status: "Aktif",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    store: { id: "nusa-tech", name: "Nusa Techspace", location: "Bandung", badge: "Official Store" },
    ...payload,
  };
  sellerProducts = [product, ...sellerProducts];
  return product;
}
