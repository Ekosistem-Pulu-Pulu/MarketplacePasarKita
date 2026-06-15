import { categories, getCategoryById } from "../data/categories.js";

export async function getCategories() {
  return [...categories];
}

export async function getCategory(id) {
  return getCategoryById(id);
}
