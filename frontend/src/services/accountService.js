import { listAddresses, saveAddress } from "../api/accountApi.js";

export async function getAddresses() {
  const response = await listAddresses();
  return response.data || [];
}

export async function createAddress(payload) {
  const response = await saveAddress(payload);
  return response.data;
}
