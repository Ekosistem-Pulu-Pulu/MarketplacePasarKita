package database

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"pasarkita-marketplace-backend/models"
)

func SeedDatabase(db *gorm.DB) error {
	if err := seedProducts(db); err != nil {
		return err
	}

	if err := seedOrders(db); err != nil {
		return err
	}

	return seedAuditLogs(db)
}

func seedProducts(db *gorm.DB) error {
	products := []models.Product{
		{ProductID: "PRD001", SellerID: "SELLER001", NamaProduk: "Keripik Tempe Renyah", Deskripsi: "Keripik tempe gurih dari UMKM lokal dengan kemasan siap kirim.", Harga: 15000, Stok: 45, Kategori: "Makanan", StatusAktif: true},
		{ProductID: "PRD002", SellerID: "SELLER002", NamaProduk: "Kopi Arabika Gayo", Deskripsi: "Kopi arabika Gayo 200 gram dengan aroma kuat dan rasa seimbang.", Harga: 35000, Stok: 30, Kategori: "Minuman", StatusAktif: true},
		{ProductID: "PRD003", SellerID: "SELLER003", NamaProduk: "Tas Anyaman Bambu", Deskripsi: "Tas anyaman bambu handmade untuk belanja dan aktivitas harian.", Harga: 85000, Stok: 12, Kategori: "Kerajinan", StatusAktif: true},
		{ProductID: "PRD004", SellerID: "SELLER001", NamaProduk: "Sambal Roa Pedas", Deskripsi: "Sambal roa khas Manado dengan level pedas sedang.", Harga: 32000, Stok: 24, Kategori: "Makanan", StatusAktif: true},
		{ProductID: "PRD005", SellerID: "SELLER004", NamaProduk: "Batik Tulis Modern", Deskripsi: "Kemeja batik tulis motif modern untuk acara formal.", Harga: 250000, Stok: 8, Kategori: "Fashion", StatusAktif: true},
		{ProductID: "PRD006", SellerID: "SELLER005", NamaProduk: "Madu Hutan Murni", Deskripsi: "Madu hutan murni ukuran 250 ml tanpa campuran gula.", Harga: 70000, Stok: 0, Kategori: "Kesehatan", StatusAktif: true},
		{ProductID: "PRD007", SellerID: "SELLER006", NamaProduk: "Sabun Herbal Sereh", Deskripsi: "Sabun herbal handmade berbahan sereh dan minyak kelapa.", Harga: 22000, Stok: 18, Kategori: "Kesehatan", StatusAktif: true},
		{ProductID: "PRD008", SellerID: "SELLER007", NamaProduk: "Dompet Kulit Sintetis", Deskripsi: "Dompet kulit sintetis lokal dengan banyak slot kartu.", Harga: 65000, Stok: 15, Kategori: "Fashion", StatusAktif: true},
	}

	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(&products).Error
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
				{OrderIDRef: "ORD-SEED-001", ProductID: "PRD001", NamaProduk: "Keripik Tempe Renyah", Harga: 15000, Qty: 2, LineTotal: 30000},
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
				{OrderIDRef: "ORD-SEED-002", ProductID: "PRD002", NamaProduk: "Kopi Arabika Gayo", Harga: 35000, Qty: 1, LineTotal: 35000},
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
				{OrderIDRef: "ORD-SEED-003", ProductID: "PRD003", NamaProduk: "Tas Anyaman Bambu", Harga: 85000, Qty: 1, LineTotal: 85000},
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
				{OrderIDRef: "ORD-SEED-004", ProductID: "PRD004", NamaProduk: "Sambal Roa Pedas", Harga: 32000, Qty: 2, LineTotal: 64000},
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
