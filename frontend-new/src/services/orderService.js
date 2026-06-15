import { createOrder, getOrder, getOrders, updateOrderStatus } from "../utils/storage.js";

export async function listOrders() {
  return getOrders();
}

export async function findOrder(id) {
  return getOrder(id);
}

export async function placeOrder(payload) {
  return createOrder(payload);
}

export async function setOrderStatus(id, status) {
  return updateOrderStatus(id, status);
}
