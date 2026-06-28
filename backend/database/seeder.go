package database

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"pasarkita-marketplace-backend/models"
)

func SeedDatabase(db *gorm.DB, seedPassword string) error {
	if err := seedUsers(db, seedPassword); err != nil {
		return err
	}

	if err := seedStores(db); err != nil {
		return err
	}

	if err := seedProducts(db); err != nil {
		return err
	}

	if err := seedAddresses(db); err != nil {
		return err
	}

	if err := seedMarketplaceData(db); err != nil {
		return err
	}

	if err := seedOrders(db); err != nil {
		return err
	}

	return seedAuditLogs(db)
}

func seedUsers(db *gorm.DB, seedPassword string) error {
	users := []models.User{
		{UserID: "USR001", Name: "Raka Buyer", Email: "buyer@pasarkita.local", Role: models.RoleBuyer, Phone: "081200000001", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER001", Name: "Nusa Techspace", Email: "seller@pasarkita.local", Role: models.RoleSeller, Phone: "081200000002", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER002", Name: "Sora Living", Email: "sora@pasarkita.local", Role: models.RoleSeller, Phone: "081200000003", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER003", Name: "Rasa Nusantara", Email: "rasa@pasarkita.local", Role: models.RoleSeller, Phone: "081200000010", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER004", Name: "Ara Studio", Email: "ara@pasarkita.local", Role: models.RoleSeller, Phone: "081200000011", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER005", Name: "Sehat Selalu", Email: "sehat@pasarkita.local", Role: models.RoleSeller, Phone: "081200000012", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER006", Name: "Ruang Baca Co.", Email: "buku@pasarkita.local", Role: models.RoleSeller, Phone: "081200000013", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER007", Name: "Gerak Aktif", Email: "gerak@pasarkita.local", Role: models.RoleSeller, Phone: "081200000014", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER008", Name: "Masa Kini Goods", Email: "masakini@pasarkita.local", Role: models.RoleSeller, Phone: "081200000015", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "CAT001", Name: "Catalog Admin", Email: "catalog@pasarkita.local", Role: models.RoleCatalogAdmin, Phone: "081200000004", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "CS001", Name: "Customer Support", Email: "support@pasarkita.local", Role: models.RoleCustomerSupport, Phone: "081200000005", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "FIN001", Name: "Finance Ops", Email: "finance@pasarkita.local", Role: models.RoleFinanceOps, Phone: "081200000006", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "FUL001", Name: "Fulfillment Ops", Email: "fulfillment@pasarkita.local", Role: models.RoleFulfillmentOps, Phone: "081200000007", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "ADM001", Name: "Platform Admin", Email: "admin@pasarkita.local", Role: models.RolePlatformAdmin, Phone: "081200000008", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "TECH001", Name: "Tech Maintainer", Email: "tech@pasarkita.local", Role: models.RoleTechMaintainer, Phone: "081200000009", EmailVerified: true, Status: "ACTIVE"},
	}
	for index := range users {
		hash, err := models.HashPassword(seedPassword)
		if err != nil {
			return err
		}
		users[index].PasswordHash = hash
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoNothing: true,
	}).Create(&users).Error
}

func seedStores(db *gorm.DB) error {
	if err := db.Model(&models.Store{}).Where("store_id LIKE ?", "STORE%").Update("status", "INACTIVE").Error; err != nil {
		return err
	}
	stores := []models.Store{
		{StoreID: "nusa-tech", SellerID: "SELLER001", Name: "Nusa Techspace", Slug: "nusa-techspace", Description: "Elektronik dan gadget pilihan.", City: "Bandung", Province: "Jawa Barat", Location: "Bandung", RatingAverage: 4.9, ProductCount: 126, Badge: "Official Store", Initials: "NT", Status: "ACTIVE"},
		{StoreID: "sora-living", SellerID: "SELLER002", Name: "Sora Living", Slug: "sora-living", Description: "Solusi modern untuk rumah.", City: "Jakarta Selatan", Province: "DKI Jakarta", Location: "Jakarta Selatan", RatingAverage: 4.8, ProductCount: 84, Badge: "Star Seller", Initials: "SL", Status: "ACTIVE"},
		{StoreID: "rasa-nusantara", SellerID: "SELLER003", Name: "Rasa Nusantara", Slug: "rasa-nusantara", Description: "Makanan pilihan dari berbagai daerah.", City: "Yogyakarta", Province: "DI Yogyakarta", Location: "Yogyakarta", RatingAverage: 4.9, ProductCount: 58, Badge: "Toko Terpercaya", Initials: "RN", Status: "ACTIVE"},
		{StoreID: "ara-studio", SellerID: "SELLER004", Name: "Ara Studio", Slug: "ara-studio", Description: "Fashion nyaman untuk keseharian.", City: "Surabaya", Province: "Jawa Timur", Location: "Surabaya", RatingAverage: 4.8, ProductCount: 93, Badge: "Star Seller", Initials: "AS", Status: "ACTIVE"},
		{StoreID: "sehat-selalu", SellerID: "SELLER005", Name: "Sehat Selalu", Slug: "sehat-selalu", Description: "Perawatan diri dan hidup sehat.", City: "Malang", Province: "Jawa Timur", Location: "Malang", RatingAverage: 4.9, ProductCount: 77, Badge: "Official Store", Initials: "SS", Status: "ACTIVE"},
		{StoreID: "ruang-baca", SellerID: "SELLER006", Name: "Ruang Baca Co.", Slug: "ruang-baca", Description: "Buku dan alat tulis pilihan.", City: "Depok", Province: "Jawa Barat", Location: "Depok", RatingAverage: 4.7, ProductCount: 112, Badge: "Toko Terpercaya", Initials: "RB", Status: "ACTIVE"},
		{StoreID: "gerak-aktif", SellerID: "SELLER007", Name: "Gerak Aktif", Slug: "gerak-aktif", Description: "Perlengkapan olahraga dan aktivitas.", City: "Tangerang", Province: "Banten", Location: "Tangerang", RatingAverage: 4.8, ProductCount: 69, Badge: "Star Seller", Initials: "GA", Status: "ACTIVE"},
		{StoreID: "masa-kini", SellerID: "SELLER008", Name: "Masa Kini Goods", Slug: "masa-kini-goods", Description: "Aksesoris modern dan fungsional.", City: "Semarang", Province: "Jawa Tengah", Location: "Semarang", RatingAverage: 4.7, ProductCount: 101, Badge: "Toko Terpercaya", Initials: "MK", Status: "ACTIVE"},
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "store_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"seller_id", "name", "slug", "description", "city", "province", "location", "logo_url", "rating_average", "review_count", "product_count", "badge", "initials", "status"}),
	}).Create(&stores).Error
}

func seedProducts(db *gorm.DB) error {
	if err := db.Model(&models.Product{}).Where("product_id LIKE ?", "PRD%").Update("status_aktif", false).Error; err != nil {
		return err
	}

	type catalogSeed struct {
		id, name, categoryID, storeID, image string
		price                                int64
		discount                             int
		rating                               float64
		sold, stock                          int
		variants                             []string
	}
	seeds := []catalogSeed{
		{"earbuds-tws-aero", "Earbuds TWS AeroBeat ANC", "elektronik", "nusa-tech", "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80", 329000, 18, 4.9, 2840, 48, []string{"Hitam", "Putih", "Navy"}},
		{"keyboard-mecha-mini", "Mechanical Keyboard Mini 68 Keys", "elektronik", "nusa-tech", "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80", 419000, 12, 4.8, 1670, 26, []string{"Brown Switch", "Red Switch"}},
		{"powerbank-volt", "Powerbank VoltGo 20.000mAh 22.5W", "elektronik", "nusa-tech", "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80", 279000, 15, 4.8, 3210, 62, []string{"Graphite", "Silver"}},
		{"smartwatch-loop", "Smartwatch Loop Fit AMOLED", "elektronik", "nusa-tech", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", 589000, 20, 4.7, 920, 34, []string{"Black", "Rose Gold"}},
		{"linen-shirt", "Kemeja Linen Relaxed Fit Premium", "fashion", "ara-studio", "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80", 189000, 10, 4.8, 1280, 39, []string{"S", "M", "L", "XL"}},
		{"everyday-sneakers", "Everyday Sneakers Cloud Sole", "fashion", "ara-studio", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", 349000, 16, 4.7, 2260, 31, []string{"39", "40", "41", "42", "43"}},
		{"canvas-totebag", "Totebag Canvas Daily Carry", "fashion", "ara-studio", "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80", 89000, 0, 4.6, 760, 71, []string{"Natural", "Olive", "Black"}},
		{"overshirt-utility", "Utility Overshirt Urban Series", "fashion", "ara-studio", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80", 249000, 14, 4.8, 640, 28, []string{"M", "L", "XL"}},
		{"granola-almond", "Granola Madu Almond Panggang 500g", "makanan", "rasa-nusantara", "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=800&q=80", 72000, 13, 4.9, 4890, 94, []string{"Original", "Dark Choco"}},
		{"kopi-gayo", "Kopi Arabika Gayo Medium Roast 250g", "makanan", "rasa-nusantara", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80", 88000, 9, 4.9, 3640, 82, []string{"Biji", "Bubuk Halus", "Bubuk Kasar"}},
		{"sambal-roa", "Sambal Roa Asap Khas Manado 200g", "makanan", "rasa-nusantara", "https://images.unsplash.com/photo-1563599175592-c58dc214deff?auto=format&fit=crop&w=800&q=80", 49000, 7, 4.8, 5720, 120, []string{"Original", "Extra Pedas"}},
		{"cookies-sea-salt", "Cookies Dark Choco Sea Salt 12pcs", "makanan", "rasa-nusantara", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80", 65000, 10, 4.9, 2180, 68, []string{"Box 12", "Box 24"}},
		{"gentle-skincare", "Paket Skincare Gentle Daily Set", "kesehatan", "sehat-selalu", "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80", 259000, 15, 4.8, 1840, 29, []string{"Normal Skin", "Dry Skin"}},
		{"diffuser-calm", "Essential Oil Diffuser Calm Mist", "kesehatan", "sehat-selalu", "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80", 199000, 12, 4.7, 980, 37, []string{"White", "Wood"}},
		{"yoga-mat", "Yoga Mat EcoGrip 6mm", "kesehatan", "sehat-selalu", "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80", 179000, 11, 4.8, 1420, 54, []string{"Sage", "Lilac", "Midnight"}},
		{"vitamin-organizer", "Weekly Vitamin Organizer Travel", "kesehatan", "sehat-selalu", "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=800&q=80", 39000, 0, 4.6, 670, 86, []string{"Pastel", "Mono"}},
		{"container-set", "Set Wadah Kedap Udara 8 Pcs", "rumah-tangga", "sora-living", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=800&q=80", 139000, 20, 4.8, 2390, 61, []string{"Clear", "Smoke"}},
		{"lampu-meja", "Lampu Meja LED Focus Adjustable", "rumah-tangga", "sora-living", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80", 149000, 17, 4.7, 1140, 45, []string{"White", "Black"}},
		{"linen-bedding", "Linen Bedding Set Queen Size", "rumah-tangga", "sora-living", "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80", 489000, 14, 4.9, 740, 22, []string{"Sand", "Sage", "Cloud"}},
		{"rak-serbaguna", "Rak Modular Serbaguna 4 Susun", "rumah-tangga", "sora-living", "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80", 219000, 12, 4.7, 860, 41, []string{"Natural", "White"}},
		{"watch-mesh", "Jam Tangan Minimal Steel Mesh", "aksesoris", "masa-kini", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80", 229000, 10, 4.8, 1580, 47, []string{"Silver", "Black", "Rose Gold"}},
		{"slingbag-city", "City Sling Bag Water Repellent", "aksesoris", "masa-kini", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80", 169000, 8, 4.7, 1280, 53, []string{"Black", "Khaki"}},
		{"sunglasses-polarized", "Kacamata Polarized Metro Classic", "aksesoris", "masa-kini", "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80", 139000, 18, 4.6, 890, 64, []string{"Black", "Tortoise"}},
		{"card-holder", "Leather Card Holder Slimline", "aksesoris", "masa-kini", "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80", 99000, 0, 4.7, 620, 76, []string{"Tan", "Black", "Forest"}},
		{"journal-dotted", "Dotted Journal Hardcover A5", "buku", "ruang-baca", "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80", 59000, 0, 4.8, 1470, 89, []string{"Midnight", "Terracotta", "Sage"}},
		{"book-atomic-habits", "Buku Atomic Habits Edisi Indonesia", "buku", "ruang-baca", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", 108000, 8, 4.9, 4520, 55, []string{}},
		{"reading-lamp", "Lampu Baca Portable Rechargeable", "buku", "ruang-baca", "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80", 69000, 13, 4.7, 830, 46, []string{"Warm White", "Cool White"}},
		{"pen-set", "Premium Gel Pen Set 6 Warna", "buku", "ruang-baca", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80", 45000, 0, 4.6, 960, 110, []string{"Earth Tone", "Classic"}},
		{"dumbbell-adjustable", "Adjustable Dumbbell Set 20kg", "olahraga", "gerak-aktif", "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80", 719000, 12, 4.8, 860, 18, []string{"10kg", "20kg"}},
		{"running-belt", "Running Belt Flex Pocket", "olahraga", "gerak-aktif", "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80", 79000, 9, 4.7, 1320, 73, []string{"Black", "Neon Lime"}},
		{"resistance-band", "Resistance Band Pro Set 5 Level", "olahraga", "gerak-aktif", "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80", 119000, 15, 4.8, 2760, 84, []string{"Set 5 Level"}},
		{"sports-bottle", "Botol Olahraga Thermo 1 Liter", "olahraga", "gerak-aktif", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80", 129000, 10, 4.7, 1190, 66, []string{"Black", "Ocean", "Coral"}},
	}

	categoryNames := map[string]string{"elektronik": "Elektronik", "fashion": "Fashion", "makanan": "Makanan", "kesehatan": "Kesehatan", "rumah-tangga": "Rumah Tangga", "aksesoris": "Aksesoris", "buku": "Buku", "olahraga": "Olahraga"}
	storeOwners := map[string]string{"nusa-tech": "SELLER001", "sora-living": "SELLER002", "rasa-nusantara": "SELLER003", "ara-studio": "SELLER004", "sehat-selalu": "SELLER005", "ruang-baca": "SELLER006", "gerak-aktif": "SELLER007", "masa-kini": "SELLER008"}
	storeLocations := map[string]string{"nusa-tech": "Bandung", "sora-living": "Jakarta Selatan", "rasa-nusantara": "Yogyakarta", "ara-studio": "Surabaya", "sehat-selalu": "Malang", "ruang-baca": "Depok", "gerak-aktif": "Tangerang", "masa-kini": "Semarang"}
	highlights := []string{"Kualitas terkurasi", "Dikirim maksimal 24 jam", "Garansi retur 7 hari", "Kemasan aman"}
	products := make([]models.Product, 0, len(seeds))
	for index, seed := range seeds {
		originalPrice := seed.price
		if seed.discount > 0 {
			originalPrice = ((seed.price * 100 / int64(100-seed.discount)) + 500) / 1000 * 1000
		}
		products = append(products, models.Product{
			ProductID: seed.id, SellerID: storeOwners[seed.storeID], StoreID: seed.storeID,
			NamaProduk: seed.name, Deskripsi: seed.name + " dipilih dari material berkualitas dan dikurasi untuk kebutuhan sehari-hari. Produk dikemas aman dan didukung layanan retur 7 hari PasarKita.",
			Harga: seed.price, OriginalPrice: originalPrice, Discount: seed.discount, Stok: seed.stock,
			CategoryID: seed.categoryID, Kategori: categoryNames[seed.categoryID], ImageURL: seed.image,
			Variants: seed.variants, Featured: index%3 == 0, Highlights: highlights,
			BeratGram: 500, Kondisi: "Baru", Lokasi: storeLocations[seed.storeID],
			RatingAvg: seed.rating, ReviewCount: seed.sold / 8, SoldCount: seed.sold, StatusAktif: true,
		})
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "product_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"seller_id", "store_id", "nama_produk", "deskripsi", "harga", "original_price", "discount", "stok", "category_id", "kategori", "image_url", "variants", "featured", "highlights", "berat_gram", "kondisi", "lokasi", "rating_avg", "review_count", "sold_count", "status_aktif"}),
	}).Create(&products).Error
}

func seedAddresses(db *gorm.DB) error {
	addresses := []models.UserAddress{
		{AddressID: "ADDR-SEED-001", UserID: "USR001", Label: "Rumah", Recipient: "Raka Buyer", Phone: "081200000001", AddressLine: "Jl. Contoh No. 10", City: "Bandung", Province: "Jawa Barat", PostalCode: "40111", IsDefault: true},
		{AddressID: "ADDR-SEED-002", UserID: "USR001", Label: "Kantor", Recipient: "Raka Buyer", Phone: "081200000001", AddressLine: "Jl. Asia Afrika No. 8", City: "Bandung", Province: "Jawa Barat", PostalCode: "40112", IsDefault: false},
	}
	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(&addresses).Error
}

func seedMarketplaceData(db *gorm.DB) error {
	expiredAt := time.Now().Add(30 * 24 * time.Hour)
	vouchers := []models.Voucher{
		{Code: "PASARKITA10", Name: "Diskon 10% PasarKita", DiscountType: "PERCENT", DiscountValue: 10, MinSpend: 50000, MaxDiscount: 20000, Active: true, ExpiredAt: &expiredAt},
		{Code: "ONGKIRHEMAT", Name: "Potongan Belanja Rp 12.000", DiscountType: "AMOUNT", DiscountValue: 12000, MinSpend: 75000, MaxDiscount: 12000, Active: true, ExpiredAt: &expiredAt},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&vouchers).Error; err != nil {
		return err
	}

	reviews := []models.Review{
		{ReviewID: "REV-SEED-001", ProductID: "PRD001", UserID: "USR001", Rating: 5, Comment: "Renyah dan sampai cepat."},
		{ReviewID: "REV-SEED-002", ProductID: "PRD004", UserID: "USR001", Rating: 5, Comment: "Pedasnya pas untuk makan harian."},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&reviews).Error; err != nil {
		return err
	}

	discussions := []models.ProductDiscussion{
		{DiscussionID: "DSC-SEED-001", ProductID: "PRD001", UserID: "USR001", Message: "Expired date berapa lama?", Reply: "Produk tahan 3 bulan sejak tanggal produksi."},
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&discussions).Error; err != nil {
		return err
	}

	notifications := []models.Notification{
		{NotificationID: "NTF-SEED-001", UserID: "USR001", Title: "Selamat datang di PasarKita", Body: "Akun pembeli siap digunakan untuk belanja.", Type: "system"},
		{NotificationID: "NTF-SEED-002", UserID: "SELLER001", Title: "Toko aktif", Body: "Toko seller sudah aktif dan menerima pesanan.", Type: "store"},
	}
	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(&notifications).Error
}

type orderSeed struct {
	order models.Order
	items []models.OrderItem
}

func seedOrders(db *gorm.DB) error {
	seeds := []orderSeed{
		{
			order: models.Order{
				OrderID:           "ORD-SEED-001",
				UserID:            "USR001",
				StatusOrder:       models.StatusPendingPayment,
				Subtotal:          30000,
				MarketplaceFee:    600,
				GatewayFee:        153,
				TotalBayar:        30600,
				PaymentRequestID:  "PAYREQ-SEED-001",
				AlamatPengiriman:  "Jl. Contoh No. 10, Bandung",
				IntegrationStatus: "PENDING_PAYMENT",
			},
			items: []models.OrderItem{
				{OrderIDRef: "ORD-SEED-001", ProductID: "PRD001", SellerID: "SELLER001", StoreID: "STORE001", NamaProduk: "Keripik Tempe Renyah", Harga: 15000, Qty: 2, LineTotal: 30000},
			},
		},
		{
			order: models.Order{
				OrderID:           "ORD-SEED-002",
				UserID:            "USR002",
				StatusOrder:       models.StatusPaid,
				Subtotal:          35000,
				MarketplaceFee:    700,
				GatewayFee:        178,
				TotalBayar:        35700,
				PaymentRequestID:  "PAYREQ-SEED-002",
				AlamatPengiriman:  "Jl. Merdeka No. 21, Jakarta",
				IntegrationStatus: "SUCCESS",
			},
			items: []models.OrderItem{
				{OrderIDRef: "ORD-SEED-002", ProductID: "PRD002", SellerID: "SELLER002", StoreID: "STORE002", NamaProduk: "Kopi Arabika Gayo", Harga: 35000, Qty: 1, LineTotal: 35000},
			},
		},
		{
			order: models.Order{
				OrderID:           "ORD-SEED-003",
				UserID:            "USR003",
				StatusOrder:       models.StatusPaymentFailed,
				Subtotal:          85000,
				MarketplaceFee:    1700,
				GatewayFee:        433,
				TotalBayar:        86700,
				PaymentRequestID:  "PAYREQ-SEED-003",
				AlamatPengiriman:  "Jl. Asia Afrika No. 8, Bandung",
				IntegrationStatus: "PAYMENT_FAILED",
			},
			items: []models.OrderItem{
				{OrderIDRef: "ORD-SEED-003", ProductID: "PRD003", SellerID: "SELLER003", StoreID: "STORE003", NamaProduk: "Tas Anyaman Bambu", Harga: 85000, Qty: 1, LineTotal: 85000},
			},
		},
		{
			order: models.Order{
				OrderID:           "ORD-SEED-004",
				UserID:            "USR004",
				StatusOrder:       models.StatusShipped,
				Subtotal:          64000,
				MarketplaceFee:    1280,
				GatewayFee:        326,
				TotalBayar:        65280,
				PaymentRequestID:  "PAYREQ-SEED-004",
				AlamatPengiriman:  "Jl. Dipatiukur No. 5, Bandung",
				IntegrationStatus: "SUCCESS",
			},
			items: []models.OrderItem{
				{OrderIDRef: "ORD-SEED-004", ProductID: "PRD004", SellerID: "SELLER001", StoreID: "STORE001", NamaProduk: "Sambal Roa Pedas", Harga: 32000, Qty: 2, LineTotal: 64000},
			},
		},
	}

	for _, seed := range seeds {
		if err := db.Where("order_id = ?", seed.order.OrderID).FirstOrCreate(&seed.order).Error; err != nil {
			return err
		}

		var itemCount int64
		if err := db.Model(&models.OrderItem{}).Where("order_id_ref = ?", seed.order.OrderID).Count(&itemCount).Error; err != nil {
			return err
		}
		if itemCount == 0 {
			if err := db.Create(&seed.items).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func seedAuditLogs(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.AuditLog{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	logs := []models.AuditLog{
		{Method: "GET", Path: "/marketplace/browse_produk", UserID: "USR001", StatusCode: 200, Message: "seed browse request"},
		{Method: "POST", Path: "/marketplace/checkout", UserID: "USR001", StatusCode: 201, Message: "seed checkout request without direct saldo mutation"},
		{Method: "GET", Path: "/marketplace/status_order", UserID: "USR001", StatusCode: 200, Message: "seed status order request"},
	}

	return db.Create(&logs).Error
}
