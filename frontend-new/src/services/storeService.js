import { fetchStores } from "../api/marketplaceApi.js";
import { stores as fallbackStores } from "../data/stores.js";

export async function getStores() {
  try {
    const items = await fetchStores();
    return items?.length ? items : fallbackStores;
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return fallbackStores;
  }
}
