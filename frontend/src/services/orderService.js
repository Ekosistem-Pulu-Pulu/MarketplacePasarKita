import { cancelOrder, getOrderStatus, listOrders, listSellerOrders } from "../api/marketplaceApi.js";
import { apiRequest } from "../api/client.js";

export async function getBuyerOrders() {
  const response = await listOrders();
  return response.data || [];
}

export async function getOrder(orderId) {
  const response = await getOrderStatus(orderId);
  return response.data;
}

export async function cancelBuyerOrder(orderId, reason = "") {
  const response = await cancelOrder(orderId, reason);
  return response.data;
}

export async function getOrderTracking(orderId) {
  const response = await apiRequest(`/marketplace/orders/${encodeURIComponent(orderId)}/tracking`);
  return response.data;
}

export async function getSellerOrders() {
  const response = await listSellerOrders();
  return response.data || [];
}

export async function updateSellerOrderStatus(orderId, status) {
  const response = await apiRequest(`/marketplace/seller/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    body: { status },
  });
  return response.data;
}
