import * as authApi from "../api/authApi.js";
import { getUser, isApiSession, updateUser } from "../utils/storage.js";

export async function getProfile() {
  if (!isApiSession()) return getUser();
  try {
    const [profile, addresses] = await Promise.all([authApi.getMe(), authApi.getAddresses()]);
    return updateUser({ ...profile, addresses });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return getUser();
  }
}

export async function updateProfile(payload) {
  const current = getUser();
  if (!isApiSession()) return updateUser({ ...current, ...payload, avatar: payload.name.slice(0, 2).toUpperCase() });
  try {
    const profile = await authApi.updateMe(payload);
    return updateUser({ ...profile, addresses: current?.addresses || [] });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return updateUser({ ...current, ...payload, avatar: payload.name.slice(0, 2).toUpperCase() });
  }
}

export async function saveCheckoutAddress(payload) {
  const current = getUser();
  const existing = current?.addresses?.[0];
  const city = payload.city || "Bandung";
  const province = payload.province || "Jawa Barat";
  const address = {
    id: existing?.id || "addr-home",
    label: existing?.label || "Rumah",
    recipient: payload.recipient,
    phone: payload.phone,
    address: payload.address,
    city,
    province,
    postalCode: payload.postalCode || "40162",
    isDefault: true,
  };
  if (!isApiSession()) {
    updateUser({ addresses: [address] });
    return address;
  }
  try {
    const saved = await authApi.saveAddress(address);
    updateUser({ addresses: [saved, ...(current?.addresses || []).filter((item) => item.id !== saved.id)] });
    return saved;
  } catch (error) {
    if (!error.isNetworkError) throw error;
    updateUser({ addresses: [address] });
    return address;
  }
}
