export const categories = [
  { id: "elektronik", name: "Elektronik", icon: "smartphone", color: "#e8f0ff", description: "Gadget pintar untuk aktivitas harian" },
  { id: "fashion", name: "Fashion", icon: "shirt", color: "#fff0f5", description: "Gaya nyaman untuk setiap suasana" },
  { id: "makanan", name: "Makanan", icon: "utensils", color: "#fff5e5", description: "Camilan dan bahan pangan pilihan" },
  { id: "kesehatan", name: "Kesehatan", icon: "heart-pulse", color: "#e9fbf2", description: "Perawatan diri dan hidup sehat" },
  { id: "rumah-tangga", name: "Rumah Tangga", icon: "house", color: "#eff8ff", description: "Solusi praktis untuk rumah" },
  { id: "aksesoris", name: "Aksesoris", icon: "watch", color: "#f5efff", description: "Detail kecil penyempurna gaya" },
  { id: "buku", name: "Buku", icon: "book-open", color: "#fff7df", description: "Bacaan, jurnal, dan alat tulis" },
  { id: "olahraga", name: "Olahraga", icon: "dumbbell", color: "#eafaf8", description: "Perlengkapan untuk tetap aktif" },
];

export function getCategoryById(id) {
  return categories.find((category) => category.id === id);
}
