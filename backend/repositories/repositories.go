package repositories

import (
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

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

	query := r.db.Model(&models.Product{}).
		Joins("LEFT JOIN stores ON stores.store_id = products.store_id").
		Where("products.status_aktif = ? AND products.stok > 0", true)

	if keyword != "" {
		like := "%" + strings.ToLower(keyword) + "%"
		query = query.Where(
			"LOWER(products.nama_produk) LIKE ? OR LOWER(products.deskripsi) LIKE ? OR LOWER(products.kategori) LIKE ? OR LOWER(stores.name) LIKE ?",
			like, like, like, like,
		)
	}
	if kategori != "" && kategori != "all" {
		query = query.Where("products.kategori = ?", kategori)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch sort {
	case "price_asc", "low":
		query = query.Order("products.harga ASC")
	case "price_desc", "high":
		query = query.Order("products.harga DESC")
	default:
		query = query.Order("products.created_at DESC")
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

func (r *ProductRepository) ListBySeller(sellerID string) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("seller_id = ?", sellerID).Order("created_at DESC").Find(&products).Error
	return products, err
}

func (r *ProductRepository) Save(product *models.Product) error {
	return r.db.Save(product).Error
}

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) Save(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUserID(userID string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) ListPublic() ([]models.User, error) {
	var users []models.User
	err := r.db.Order("created_at ASC").Find(&users).Error
	return users, err
}

type AddressRepository struct {
	db *gorm.DB
}

func NewAddressRepository(db *gorm.DB) *AddressRepository {
	return &AddressRepository{db: db}
}

func (r *AddressRepository) ListByUser(userID string) ([]models.UserAddress, error) {
	var addresses []models.UserAddress
	err := r.db.Where("user_id = ?", userID).Order("is_default DESC, created_at DESC").Find(&addresses).Error
	return addresses, err
}

func (r *AddressRepository) FindByAddressID(addressID string) (*models.UserAddress, error) {
	var address models.UserAddress
	if err := r.db.Where("address_id = ?", addressID).First(&address).Error; err != nil {
		return nil, err
	}
	return &address, nil
}

func (r *AddressRepository) Save(address *models.UserAddress) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if address.IsDefault {
			if err := tx.Model(&models.UserAddress{}).Where("user_id = ?", address.UserID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Save(address).Error
	})
}

type StoreRepository struct {
	db *gorm.DB
}

func NewStoreRepository(db *gorm.DB) *StoreRepository {
	return &StoreRepository{db: db}
}

func (r *StoreRepository) List() ([]models.Store, error) {
	var stores []models.Store
	err := r.db.Order("rating_average DESC, created_at DESC").Find(&stores).Error
	return stores, err
}

func (r *StoreRepository) FindByStoreID(storeID string) (*models.Store, error) {
	var store models.Store
	if err := r.db.Where("store_id = ?", storeID).First(&store).Error; err != nil {
		return nil, err
	}
	return &store, nil
}

func (r *StoreRepository) FindBySellerID(sellerID string) (*models.Store, error) {
	var store models.Store
	if err := r.db.Where("seller_id = ?", sellerID).First(&store).Error; err != nil {
		return nil, err
	}
	return &store, nil
}

func (r *StoreRepository) Save(store *models.Store) error {
	return r.db.Save(store).Error
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

func (r *OrderRepository) ListByUser(userID string) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Items").Where("user_id = ?", userID).Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) ListBySeller(sellerID string) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.Preload("Items").Joins("JOIN order_items ON order_items.order_id_ref = orders.order_id").
		Where("order_items.seller_id = ?", sellerID).
		Group("orders.id").
		Order("orders.created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) SellerOwnsOrder(sellerID, orderID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.OrderItem{}).
		Where("seller_id = ? AND order_id_ref = ?", sellerID, orderID).
		Count(&count).Error
	return count > 0, err
}

func (r *OrderRepository) Save(order *models.Order) error {
	return r.db.Save(order).Error
}

type CartRepository struct {
	db *gorm.DB
}

func NewCartRepository(db *gorm.DB) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) ListByUser(userID string) ([]models.CartItem, error) {
	var items []models.CartItem
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *CartRepository) FindByUserProduct(userID, productID string) (*models.CartItem, error) {
	var item models.CartItem
	if err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *CartRepository) Upsert(userID, productID string, qty int) (*models.CartItem, error) {
	item := models.CartItem{UserID: userID, ProductID: productID, Qty: qty, Selected: true}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "product_id"}},
		DoUpdates: clause.Assignments(map[string]any{"qty": gorm.Expr("qty + ?", qty), "selected": true}),
	}).Create(&item).Error
	if err != nil {
		return nil, err
	}
	var saved models.CartItem
	if err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&saved).Error; err != nil {
		return nil, err
	}
	return &saved, nil
}

func (r *CartRepository) Update(userID, productID string, qty int, selected *bool) (*models.CartItem, error) {
	updates := map[string]any{"qty": qty}
	if selected != nil {
		updates["selected"] = *selected
	}
	if err := r.db.Model(&models.CartItem{}).Where("user_id = ? AND product_id = ?", userID, productID).Updates(updates).Error; err != nil {
		return nil, err
	}
	var item models.CartItem
	if err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *CartRepository) Remove(userID, productID string) error {
	return r.db.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&models.CartItem{}).Error
}

func (r *CartRepository) ClearSelected(userID string) error {
	return r.db.Where("user_id = ? AND selected = ?", userID, true).Delete(&models.CartItem{}).Error
}

type MarketplaceDataRepository struct {
	db *gorm.DB
}

func NewMarketplaceDataRepository(db *gorm.DB) *MarketplaceDataRepository {
	return &MarketplaceDataRepository{db: db}
}

func (r *MarketplaceDataRepository) ListVouchers() ([]models.Voucher, error) {
	var vouchers []models.Voucher
	err := r.db.Where("active = ?", true).Order("created_at DESC").Find(&vouchers).Error
	return vouchers, err
}

func (r *MarketplaceDataRepository) FindVoucher(code string) (*models.Voucher, error) {
	var voucher models.Voucher
	if err := r.db.Where("UPPER(code) = ?", strings.ToUpper(strings.TrimSpace(code))).First(&voucher).Error; err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *MarketplaceDataRepository) ListReviews(productID string) ([]models.Review, error) {
	var reviews []models.Review
	err := r.db.Where("product_id = ?", productID).Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (r *MarketplaceDataRepository) SaveReview(review *models.Review) error {
	return r.db.Create(review).Error
}

func (r *MarketplaceDataRepository) ListDiscussions(productID string) ([]models.ProductDiscussion, error) {
	var discussions []models.ProductDiscussion
	err := r.db.Where("product_id = ?", productID).Order("created_at DESC").Find(&discussions).Error
	return discussions, err
}

func (r *MarketplaceDataRepository) SaveDiscussion(discussion *models.ProductDiscussion) error {
	return r.db.Create(discussion).Error
}

func (r *MarketplaceDataRepository) ListChat(userID string) ([]models.ChatMessage, error) {
	var messages []models.ChatMessage
	err := r.db.Where("sender_id = ? OR receiver_id = ?", userID, userID).Order("created_at ASC").Find(&messages).Error
	return messages, err
}

func (r *MarketplaceDataRepository) SaveChat(message *models.ChatMessage) error {
	return r.db.Create(message).Error
}

func (r *MarketplaceDataRepository) ListNotifications(userID string) ([]models.Notification, error) {
	var notifications []models.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

func (r *MarketplaceDataRepository) SaveNotification(notification *models.Notification) error {
	return r.db.Create(notification).Error
}

func (r *MarketplaceDataRepository) MarkNotificationRead(userID, notificationID string) error {
	return r.db.Model(&models.Notification{}).Where("user_id = ? AND notification_id = ?", userID, notificationID).Update("is_read", true).Error
}

func (r *MarketplaceDataRepository) SaveShipment(shipment *models.Shipment) error {
	return r.db.Save(shipment).Error
}

func (r *MarketplaceDataRepository) FindShipmentByOrderID(orderID string) (*models.Shipment, error) {
	var shipment models.Shipment
	if err := r.db.Where("order_id_ref = ?", orderID).First(&shipment).Error; err != nil {
		return nil, err
	}
	return &shipment, nil
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
