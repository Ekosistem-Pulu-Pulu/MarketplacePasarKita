import { filterProducts, getProductById, products } from "../data/products.js";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getProducts(filters = {}) {
  await wait();
  return filterProducts(filters);
}

export async function getProduct(id) {
  await wait(120);
  return getProductById(id);
}

export async function getFeaturedProducts(limit = 8) {
  await wait();
  return products.filter((product) => product.featured).slice(0, limit);
}

export async function getSimilarProducts(product, limit = 4) {
  await wait(100);
  return products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, limit);
}
