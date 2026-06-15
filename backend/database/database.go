package database

import (
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/models"
)

func Connect(cfg config.Config) (*gorm.DB, error) {
	return gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{})
}

func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.User{},
		&models.UserAddress{},
		&models.Store{},
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.CartItem{},
		&models.Wishlist{},
		&models.Voucher{},
		&models.Review{},
		&models.ProductDiscussion{},
		&models.ChatMessage{},
		&models.Notification{},
		&models.Shipment{},
		&models.AuditLog{},
	); err != nil {
		return err
	}

	// Relasi product-store diperkaya saat query agar StoreID non-primary tetap aman
	// untuk katalog lama dan seed frontend baru.
	if db.Migrator().HasConstraint(&models.Store{}, "fk_products_store") {
		return db.Migrator().DropConstraint(&models.Store{}, "fk_products_store")
	}
	return nil
}
