const ORDERS_KEY = "pasarkita_recent_orders";

function readOrders() {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function normalizeStoredOrder(order, extra = {}) {
  const rawStatus = order.status_order || order.status || "PENDING_PAYMENT";

  return {
    ...extra,
    ...order,
    order_id: order.order_id,
    status_order: String(rawStatus).toUpperCase(),
    created_at: order.created_at || extra.created_at || new Date().toISOString(),
  };
}

export function rememberOrder(order, extra = {}) {
  if (!order?.order_id) return getStoredOrders();

  const normalized = normalizeStoredOrder(order, extra);
  const current = readOrders().filter((item) => item.order_id !== normalized.order_id);
  const next = [normalized, ...current].slice(0, 30);

  writeOrders(next);
  return next;
}

export function getStoredOrders() {
  return readOrders().map((order) => normalizeStoredOrder(order));
}

export function getStoredOrder(orderId) {
  const order = readOrders().find((item) => item.order_id === orderId);
  return order ? normalizeStoredOrder(order) : null;
}
