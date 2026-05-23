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
		&models.Product{},
		&models.Order{},
		&models.OrderItem{},
		&models.AuditLog{},
	)
}
