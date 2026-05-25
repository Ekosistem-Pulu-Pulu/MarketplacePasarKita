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
	return db.AutoMigrate(
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
	)
}
