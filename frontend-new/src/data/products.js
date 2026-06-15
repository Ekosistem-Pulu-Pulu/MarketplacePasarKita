import { getStoreById } from "./stores.js";

const seed = [
  ["earbuds-tws-aero", "Earbuds TWS AeroBeat ANC", "elektronik", 329000, 18, 4.9, 2840, 48, "nusa-tech", "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80", ["Hitam", "Putih", "Navy"]],
  ["keyboard-mecha-mini", "Mechanical Keyboard Mini 68 Keys", "elektronik", 419000, 12, 4.8, 1670, 26, "nusa-tech", "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80", ["Brown Switch", "Red Switch"]],
  ["powerbank-volt", "Powerbank VoltGo 20.000mAh 22.5W", "elektronik", 279000, 15, 4.8, 3210, 62, "nusa-tech", "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80", ["Graphite", "Silver"]],
  ["smartwatch-loop", "Smartwatch Loop Fit AMOLED", "elektronik", 589000, 20, 4.7, 920, 34, "nusa-tech", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", ["Black", "Rose Gold"]],
  ["linen-shirt", "Kemeja Linen Relaxed Fit Premium", "fashion", 189000, 10, 4.8, 1280, 39, "ara-studio", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80", ["S", "M", "L", "XL"]],
  ["everyday-sneakers", "Everyday Sneakers Cloud Sole", "fashion", 349000, 16, 4.7, 2260, 31, "ara-studio", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", ["39", "40", "41", "42", "43"]],
  ["canvas-totebag", "Totebag Canvas Daily Carry", "fashion", 89000, 0, 4.6, 760, 71, "ara-studio", "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80", ["Natural", "Olive", "Black"]],
  ["overshirt-utility", "Utility Overshirt Urban Series", "fashion", 249000, 14, 4.8, 640, 28, "ara-studio", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80", ["M", "L", "XL"]],
  ["granola-almond", "Granola Madu Almond Panggang 500g", "makanan", 72000, 13, 4.9, 4890, 94, "rasa-nusantara", "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=800&q=80", ["Original", "Dark Choco"]],
  ["kopi-gayo", "Kopi Arabika Gayo Medium Roast 250g", "makanan", 88000, 9, 4.9, 3640, 82, "rasa-nusantara", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80", ["Biji", "Bubuk Halus", "Bubuk Kasar"]],
  ["sambal-roa", "Sambal Roa Asap Khas Manado 200g", "makanan", 49000, 7, 4.8, 5720, 120, "rasa-nusantara", "https://images.unsplash.com/photo-1563599175592-c58dc214deff?auto=format&fit=crop&w=800&q=80", ["Original", "Extra Pedas"]],
  ["cookies-sea-salt", "Cookies Dark Choco Sea Salt 12pcs", "makanan", 65000, 10, 4.9, 2180, 68, "rasa-nusantara", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80", ["Box 12", "Box 24"]],
  ["gentle-skincare", "Paket Skincare Gentle Daily Set", "kesehatan", 259000, 15, 4.8, 1840, 29, "sehat-selalu", "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80", ["Normal Skin", "Dry Skin"]],
  ["diffuser-calm", "Essential Oil Diffuser Calm Mist", "kesehatan", 199000, 12, 4.7, 980, 37, "sehat-selalu", "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80", ["White", "Wood"]],
  ["yoga-mat", "Yoga Mat EcoGrip 6mm", "kesehatan", 179000, 11, 4.8, 1420, 54, "sehat-selalu", "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80", ["Sage", "Lilac", "Midnight"]],
  ["vitamin-organizer", "Weekly Vitamin Organizer Travel", "kesehatan", 39000, 0, 4.6, 670, 86, "sehat-selalu", "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80", ["Pastel", "Mono"]],
  ["container-set", "Set Wadah Kedap Udara 8 Pcs", "rumah-tangga", 139000, 20, 4.8, 2390, 61, "sora-living", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80", ["Clear", "Smoke"]],
  ["lampu-meja", "Lampu Meja LED Focus Adjustable", "rumah-tangga", 149000, 17, 4.7, 1140, 45, "sora-living", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80", ["White", "Black"]],
  ["linen-bedding", "Linen Bedding Set Queen Size", "rumah-tangga", 489000, 14, 4.9, 740, 22, "sora-living", "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80", ["Sand", "Sage", "Cloud"]],
  ["rak-serbaguna", "Rak Modular Serbaguna 4 Susun", "rumah-tangga", 219000, 12, 4.7, 860, 41, "sora-living", "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80", ["Natural", "White"]],
  ["watch-mesh", "Jam Tangan Minimal Steel Mesh", "aksesoris", 229000, 10, 4.8, 1580, 47, "masa-kini", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80", ["Silver", "Black", "Rose Gold"]],
  ["slingbag-city", "City Sling Bag Water Repellent", "aksesoris", 169000, 8, 4.7, 1280, 53, "masa-kini", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80", ["Black", "Khaki"]],
  ["sunglasses-polarized", "Kacamata Polarized Metro Classic", "aksesoris", 139000, 18, 4.6, 890, 64, "masa-kini", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80", ["Black", "Tortoise"]],
  ["card-holder", "Leather Card Holder Slimline", "aksesoris", 99000, 0, 4.7, 620, 76, "masa-kini", "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80", ["Tan", "Black", "Forest"]],
  ["journal-dotted", "Dotted Journal Hardcover A5", "buku", 59000, 0, 4.8, 1470, 89, "ruang-baca", "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80", ["Midnight", "Terracotta", "Sage"]],
  ["book-atomic-habits", "Buku Atomic Habits Edisi Indonesia", "buku", 108000, 8, 4.9, 4520, 55, "ruang-baca", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", []],
  ["reading-lamp", "Lampu Baca Portable Rechargeable", "buku", 69000, 13, 4.7, 830, 46, "ruang-baca", "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80", ["Warm White", "Cool White"]],
  ["pen-set", "Premium Gel Pen Set 6 Warna", "buku", 45000, 0, 4.6, 960, 110, "ruang-baca", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80", ["Earth Tone", "Classic"]],
  ["dumbbell-adjustable", "Adjustable Dumbbell Set 20kg", "olahraga", 719000, 12, 4.8, 860, 18, "gerak-aktif", "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80", ["10kg", "20kg"]],
  ["running-belt", "Running Belt Flex Pocket", "olahraga", 79000, 9, 4.7, 1320, 73, "gerak-aktif", "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80", ["Black", "Neon Lime"]],
  ["resistance-band", "Resistance Band Pro Set 5 Level", "olahraga", 119000, 15, 4.8, 2760, 84, "gerak-aktif", "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80", ["Set 5 Level"]],
  ["sports-bottle", "Botol Olahraga Thermo 1 Liter", "olahraga", 129000, 10, 4.7, 1190, 66, "gerak-aktif", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80", ["Black", "Ocean", "Coral"]],
];

const categoryNames = {
  elektronik: "Elektronik",
  fashion: "Fashion",
  makanan: "Makanan",
  kesehatan: "Kesehatan",
  "rumah-tangga": "Rumah Tangga",
  aksesoris: "Aksesoris",
  buku: "Buku",
  olahraga: "Olahraga",
};

export const products = seed.map(([id, name, categoryId, price, discount, rating, sold, stock, storeId, image, variants], index) => ({
  id,
  name,
  categoryId,
  category: categoryNames[categoryId],
  price,
  originalPrice: discount ? Math.round(price / (1 - discount / 100) / 1000) * 1000 : price,
  discount,
  rating,
  sold,
  stock,
  store: getStoreById(storeId),
  image,
  variants,
  featured: index % 3 === 0,
  description: `${name} dipilih dari material berkualitas dan dikurasi untuk kebutuhan sehari-hari. Produk dikemas aman, memiliki kontrol kualitas toko, dan didukung layanan retur 7 hari PasarKita.`,
  highlights: ["Kualitas terkurasi", "Dikirim maksimal 24 jam", "Garansi retur 7 hari", "Kemasan aman"],
}));

export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function filterProducts({ query = "", category = "", location = "", minPrice = 0, maxPrice = Infinity, rating = 0, promo = "", sort = "recommended" } = {}) {
  const keyword = query.trim().toLowerCase();
  const result = products.filter((product) => {
    const searchable = `${product.name} ${product.category} ${product.store.name} ${product.store.location}`.toLowerCase();
    return (!keyword || searchable.includes(keyword))
      && (!category || product.categoryId === category)
      && (!location || product.store.location === location)
      && product.price >= Number(minPrice || 0)
      && product.price <= Number(maxPrice || Infinity)
      && product.rating >= Number(rating || 0)
      && (!promo || product.discount > 0);
  });

  return [...result].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "sold") return b.sold - a.sold;
    return (b.rating * b.sold) - (a.rating * a.sold);
  });
}
