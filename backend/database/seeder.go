package database

import (
	"os"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"pasarkita-marketplace-backend/models"
)

func SeedDatabase(db *gorm.DB) error {
	if err := seedUsers(db); err != nil {
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

func seedUsers(db *gorm.DB) error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}
	users := []models.User{
		{UserID: "USR001", Name: "Raka Buyer", Email: "buyer@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleBuyer, Phone: "081200000001", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER001", Name: "Toko Sambal Roa", Email: "seller@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleSeller, Phone: "081200000002", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "SELLER002", Name: "Kopi Gayo Seller", Email: "seller2@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleSeller, Phone: "081200000003", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "CAT001", Name: "Catalog Admin", Email: "catalog@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleCatalogAdmin, Phone: "081200000004", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "CS001", Name: "Customer Support", Email: "support@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleCustomerSupport, Phone: "081200000005", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "FIN001", Name: "Finance Ops", Email: "finance@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleFinanceOps, Phone: "081200000006", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "FUL001", Name: "Fulfillment Ops", Email: "fulfillment@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleFulfillmentOps, Phone: "081200000007", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "ADM001", Name: "Platform Admin", Email: "admin@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RolePlatformAdmin, Phone: "081200000008", EmailVerified: true, Status: "ACTIVE"},
		{UserID: "TECH001", Name: "Tech Maintainer", Email: "tech@pasarkita.local", PasswordHash: models.HashPassword("password123", secret), Role: models.RoleTechMaintainer, Phone: "081200000009", EmailVerified: true, Status: "ACTIVE"},
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "email", "password_hash", "role", "phone", "email_verified", "status"}),
	}).Create(&users).Error
}

func seedStores(db *gorm.DB) error {
	stores := []models.Store{
		{StoreID: "STORE001", SellerID: "SELLER001", Name: "Toko Sambal Roa", Slug: "toko-sambal-roa", Description: "UMKM makanan pedas dan camilan rumahan.", City: "Bandung", Province: "Jawa Barat", LogoURL: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=320&q=80", RatingAverage: 4.8, ReviewCount: 128, Status: "ACTIVE"},
		{StoreID: "STORE002", SellerID: "SELLER002", Name: "Kopi Gayo Nusantara", Slug: "kopi-gayo-nusantara", Description: "Roastery kopi Arabika Gayo dan minuman lokal.", City: "Aceh Tengah", Province: "Aceh", LogoURL: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=320&q=80", RatingAverage: 4.7, ReviewCount: 94, Status: "ACTIVE"},
		{StoreID: "STORE003", SellerID: "SELLER003", Name: "Anyaman Bambu Lestari", Slug: "anyaman-bambu-lestari", Description: "Kerajinan anyaman bambu handmade.", City: "Yogyakarta", Province: "DI Yogyakarta", LogoURL: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=320&q=80", RatingAverage: 4.6, ReviewCount: 51, Status: "ACTIVE"},
		{StoreID: "STORE004", SellerID: "SELLER004", Name: "Batik Modern Solo", Slug: "batik-modern-solo", Description: "Batik tulis dan fashion lokal.", City: "Solo", Province: "Jawa Tengah", RatingAverage: 4.5, ReviewCount: 44, Status: "ACTIVE"},
		{StoreID: "STORE005", SellerID: "SELLER005", Name: "Madu Hutan Bogor", Slug: "madu-hutan-bogor", Description: "Produk madu dan herbal.", City: "Bogor", Province: "Jawa Barat", RatingAverage: 4.4, ReviewCount: 37, Status: "ACTIVE"},
		{StoreID: "STORE006", SellerID: "SELLER006", Name: "Herbal Sereh Surabaya", Slug: "herbal-sereh-surabaya", Description: "Sabun dan perawatan herbal.", City: "Surabaya", Province: "Jawa Timur", RatingAverage: 4.3, ReviewCount: 22, Status: "ACTIVE"},
		{StoreID: "STORE007", SellerID: "SELLER007", Name: "Aksesoris Jakarta", Slug: "aksesoris-jakarta", Description: "Dompet dan aksesori harian.", City: "Jakarta", Province: "DKI Jakarta", RatingAverage: 4.2, ReviewCount: 31, Status: "ACTIVE"},
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "store_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"seller_id", "name", "slug", "description", "city", "province", "logo_url", "rating_average", "review_count", "status"}),
	}).Create(&stores).Error
}

func seedProducts(db *gorm.DB) error {
	products := []models.Product{
		{ProductID: "PRD001", SellerID: "SELLER001", StoreID: "STORE001", NamaProduk: "Keripik Tempe Renyah", Deskripsi: "Keripik tempe gurih dari UMKM lokal dengan kemasan siap kirim.", Harga: 15000, Stok: 45, Kategori: "Makanan", ImageURL: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80", BeratGram: 350, Kondisi: "Baru", Lokasi: "Bandung", RatingAvg: 4.8, ReviewCount: 41, SoldCount: 320, StatusAktif: true},
		{ProductID: "PRD002", SellerID: "SELLER002", StoreID: "STORE002", NamaProduk: "Kopi Arabika Gayo", Deskripsi: "Kopi arabika Gayo 200 gram dengan aroma kuat dan rasa seimbang.", Harga: 35000, Stok: 30, Kategori: "Minuman", ImageURL: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80", BeratGram: 250, Kondisi: "Baru", Lokasi: "Aceh Tengah", RatingAvg: 4.7, ReviewCount: 28, SoldCount: 210, StatusAktif: true},
		{ProductID: "PRD003", SellerID: "SELLER003", StoreID: "STORE003", NamaProduk: "Tas Anyaman Bambu", Deskripsi: "Tas anyaman bambu handmade untuk belanja dan aktivitas harian.", Harga: 85000, Stok: 12, Kategori: "Kerajinan", ImageURL: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80", BeratGram: 700, Kondisi: "Baru", Lokasi: "Yogyakarta", RatingAvg: 4.6, ReviewCount: 17, SoldCount: 92, StatusAktif: true},
		{ProductID: "PRD004", SellerID: "SELLER001", StoreID: "STORE001", NamaProduk: "Sambal Roa Pedas", Deskripsi: "Sambal roa khas Manado dengan level pedas sedang.", Harga: 32000, Stok: 24, Kategori: "Makanan", ImageURL: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80", BeratGram: 300, Kondisi: "Baru", Lokasi: "Bandung", RatingAvg: 4.9, ReviewCount: 54, SoldCount: 480, StatusAktif: true},
		{ProductID: "PRD005", SellerID: "SELLER004", StoreID: "STORE004", NamaProduk: "Batik Tulis Modern", Deskripsi: "Kemeja batik tulis motif modern untuk acara formal.", Harga: 250000, Stok: 8, Kategori: "Fashion", ImageURL: "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=900&q=80", BeratGram: 450, Kondisi: "Baru", Lokasi: "Solo", RatingAvg: 4.5, ReviewCount: 12, SoldCount: 39, StatusAktif: true},
		{ProductID: "PRD006", SellerID: "SELLER005", StoreID: "STORE005", NamaProduk: "Madu Hutan Murni", Deskripsi: "Madu hutan murni ukuran 250 ml tanpa campuran gula.", Harga: 70000, Stok: 0, Kategori: "Kesehatan", ImageURL: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80", BeratGram: 400, Kondisi: "Baru", Lokasi: "Bogor", RatingAvg: 4.4, ReviewCount: 9, SoldCount: 74, StatusAktif: true},
		{ProductID: "PRD007", SellerID: "SELLER006", StoreID: "STORE006", NamaProduk: "Sabun Herbal Sereh", Deskripsi: "Sabun herbal handmade berbahan sereh dan minyak kelapa.", Harga: 22000, Stok: 18, Kategori: "Kesehatan", ImageURL: "https://images.unsplash.com/photo-1607006483224-7942c595e5f1?auto=format&fit=crop&w=900&q=80", BeratGram: 180, Kondisi: "Baru", Lokasi: "Surabaya", RatingAvg: 4.3, ReviewCount: 8, SoldCount: 58, StatusAktif: true},
		{ProductID: "PRD008", SellerID: "SELLER007", StoreID: "STORE007", NamaProduk: "Dompet Kulit Sintetis", Deskripsi: "Dompet kulit sintetis lokal dengan banyak slot kartu.", Harga: 65000, Stok: 15, Kategori: "Fashion", ImageURL: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80", BeratGram: 220, Kondisi: "Baru", Lokasi: "Jakarta", RatingAvg: 4.2, ReviewCount: 11, SoldCount: 67, StatusAktif: true},
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "product_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"seller_id", "store_id", "nama_produk", "deskripsi", "harga", "stok", "kategori", "image_url", "berat_gram", "kondisi", "lokasi", "rating_avg", "review_count", "sold_count", "status_aktif"}),
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
		{NotificationID: "NTF-SEED-001", UserID: "USR001", Title: "Selamat datang di PasarKita", Body: "Akun demo buyer siap digunakan untuk belanja.", Type: "system"},
		{NotificationID: "NTF-SEED-002", UserID: "SELLER001", Title: "Toko aktif", Body: "Toko demo seller sudah aktif dan menerima pesanan.", Type: "store"},
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
