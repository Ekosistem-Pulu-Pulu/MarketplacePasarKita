export const stores = [
  { id: "nusa-tech", name: "Nusa Techspace", location: "Bandung", rating: 4.9, products: 126, badge: "Official Store", initials: "NT" },
  { id: "sora-living", name: "Sora Living", location: "Jakarta Selatan", rating: 4.8, products: 84, badge: "Star Seller", initials: "SL" },
  { id: "rasa-nusantara", name: "Rasa Nusantara", location: "Yogyakarta", rating: 4.9, products: 58, badge: "Toko Terpercaya", initials: "RN" },
  { id: "ara-studio", name: "Ara Studio", location: "Surabaya", rating: 4.8, products: 93, badge: "Star Seller", initials: "AS" },
  { id: "sehat-selalu", name: "Sehat Selalu", location: "Malang", rating: 4.9, products: 77, badge: "Official Store", initials: "SS" },
  { id: "ruang-baca", name: "Ruang Baca Co.", location: "Depok", rating: 4.7, products: 112, badge: "Toko Terpercaya", initials: "RB" },
  { id: "gerak-aktif", name: "Gerak Aktif", location: "Tangerang", rating: 4.8, products: 69, badge: "Star Seller", initials: "GA" },
  { id: "masa-kini", name: "Masa Kini Goods", location: "Semarang", rating: 4.7, products: 101, badge: "Toko Terpercaya", initials: "MK" },
];

export function getStoreById(id) {
  return stores.find((store) => store.id === id);
}
