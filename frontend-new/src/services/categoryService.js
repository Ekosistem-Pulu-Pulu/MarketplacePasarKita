import { categories, getCategoryById } from "../data/categories.js";
import { fetchCategories } from "../api/marketplaceApi.js";

export async function getCategories() {
  try {
    const items = await fetchCategories();
    return items?.length ? items : [...categories];
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return [...categories];
  }
}

export async function getCategory(id) {
  const items = await getCategories();
  return items.find((category) => category.id === id) || getCategoryById(id);
}
