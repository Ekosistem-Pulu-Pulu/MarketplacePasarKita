package repositories

import (
	"strings"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
)

type ProductRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Browse(keyword, kategori, sort string, page, limit int) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := r.db.Model(&models.Product{}).Where("status_aktif = ? AND stok > 0", true)
	if keyword != "" {
		like := "%" + strings.ToLower(keyword) + "%"
		query = query.Where("LOWER(nama_produk) LIKE ? OR LOWER(deskripsi) LIKE ?", like, like)
	}
	if kategori != "" && kategori != "all" {
		query = query.Where("kategori = ?", kategori)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch sort {
	case "price_asc", "low":
		query = query.Order("harga ASC")
	case "price_desc", "high":
		query = query.Order("harga DESC")
	default:
		query = query.Order("created_at DESC")
	}

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Find(&products).Error
	return products, total, err
}

func (r *ProductRepository) FindByProductID(productID string) (*models.Product, error) {
	var product models.Product
	if err := r.db.Where("product_id = ?", productID).First(&product).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *ProductRepository) ListAll() ([]models.Product, error) {
	var products []models.Product
	err := r.db.Order("created_at DESC").Find(&products).Error
	return products, err
}

func (r *ProductRepository) Save(product *models.Product) error {
	return r.db.Save(product).Error
}

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(order *models.Order) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(order).Error
	})
}

func (r *OrderRepository) FindByOrderID(orderID string) (*models.Order, error) {
	var order models.Order
	if err := r.db.Preload("Items").Where("order_id = ?", orderID).First(&order).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) Save(order *models.Order) error {
	return r.db.Save(order).Error
}

type AuditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) Create(log models.AuditLog) {
	_ = r.db.Create(&log).Error
}

func (r *AuditLogRepository) Latest(limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
