package repositories

import (
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"pasarkita-marketplace-backend/models"
)

type ProductRepository struct {
	db *gorm.DB
}

type ProductBrowseFilter struct {
	Keyword  string
	Category string
	Location string
	Sort     string
	MinPrice int64
	MaxPrice int64
	Rating   float64
	Promo    bool
	Page     int
	Limit    int
}

func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Browse(filter ProductBrowseFilter) ([]models.Product, int64, error) {
	var products []models.Product
	var total int64

	query := r.db.Model(&models.Product{}).
		Joins("LEFT JOIN stores ON stores.store_id = products.store_id").
		Where("products.status_aktif = ? AND products.stok > 0", true)

	if filter.Keyword != "" {
		like := "%" + strings.ToLower(filter.Keyword) + "%"
		query = query.Where(
			"LOWER(products.nama_produk) LIKE ? OR LOWER(products.deskripsi) LIKE ? OR LOWER(products.kategori) LIKE ? OR LOWER(stores.name) LIKE ?",
			like, like, like, like,
		)
	}
	if filter.Category != "" && filter.Category != "all" {
		query = query.Where("products.category_id = ? OR products.kategori = ?", filter.Category, filter.Category)
	}
	if filter.Location != "" {
		query = query.Where("products.lokasi = ? OR stores.location = ?", filter.Location, filter.Location)
	}
	if filter.MinPrice > 0 {
		query = query.Where("products.harga >= ?", filter.MinPrice)
	}
	if filter.MaxPrice > 0 {
		query = query.Where("products.harga <= ?", filter.MaxPrice)
	}
	if filter.Rating > 0 {
		query = query.Where("products.rating_avg >= ?", filter.Rating)
	}
	if filter.Promo {
		query = query.Where("products.discount > 0")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch filter.Sort {
	case "price_asc", "low":
		query = query.Order("products.harga ASC")
	case "price_desc", "high":
		query = query.Order("products.harga DESC")
	case "rating", "rating_desc":
		query = query.Order("products.rating_avg DESC")
	case "sold", "sold_desc", "best-selling":
		query = query.Order("products.sold_count DESC")
	default:
		query = query.Order("products.featured DESC, products.rating_avg DESC, products.sold_count DESC")
	}

	offset := (filter.Page - 1) * filter.Limit
	if err := query.Offset(offset).Limit(filter.Limit).Find(&products).Error; err != nil {
		return nil, 0, err
	}
	if err := r.hydrateStores(products); err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (r *ProductRepository) FindByProductID(productID string) (*models.Product, error) {
	var product models.Product
	if err := r.db.Where("product_id = ?", productID).First(&product).Error; err != nil {
		return nil, err
	}
	var store models.Store
	if product.StoreID != "" {
		if err := r.db.Where("store_id = ?", product.StoreID).First(&store).Error; err != nil && err != gorm.ErrRecordNotFound {
			return nil, err
		}
		product.Store = store
	}
	return &product, nil
}

func (r *ProductRepository) ListAll() ([]models.Product, error) {
	var products []models.Product
	if err := r.db.Order("created_at DESC").Find(&products).Error; err != nil {
		return nil, err
	}
	return products, r.hydrateStores(products)
}

func (r *ProductRepository) ListBySeller(sellerID string) ([]models.Product, error) {
	var products []models.Product
	if err := r.db.Where("seller_id = ? AND status_aktif = ?", sellerID, true).Order("created_at DESC").Find(&products).Error; err != nil {
		return nil, err
	}
	return products, r.hydrateStores(products)
}

func (r *ProductRepository) Save(product *models.Product) error {
	return r.db.Save(product).Error
}

func (r *ProductRepository) hydrateStores(products []models.Product) error {
	if len(products) == 0 {
		return nil
	}
	storeIDs := make([]string, 0)
	seen := map[string]bool{}
	for _, product := range products {
		if product.StoreID != "" && !seen[product.StoreID] {
			storeIDs = append(storeIDs, product.StoreID)
			seen[product.StoreID] = true
		}
	}
	if len(storeIDs) == 0 {
		return nil
	}
	var stores []models.Store
	if err := r.db.Where("store_id IN ?", storeIDs).Find(&stores).Error; err != nil {
		return err
	}
	byID := make(map[string]models.Store, len(stores))
	for _, store := range stores {
		byID[store.StoreID] = store
	}
	for index := range products {
		products[index].Store = byID[products[index].StoreID]
	}
	return nil
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

type RefreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

func (r *RefreshTokenRepository) Create(token *models.RefreshToken) error {
	return r.db.Create(token).Error
}

// Rotate consumes exactly one active refresh token and creates its replacement
// atomically. Concurrent reuse of the same token therefore fails closed.
func (r *RefreshTokenRepository) Rotate(tokenHash string, replacement *models.RefreshToken) (*models.RefreshToken, error) {
	var current models.RefreshToken
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", tokenHash, time.Now()).
			First(&current).Error; err != nil {
			return err
		}
		now := time.Now()
		if err := tx.Model(&current).Update("revoked_at", &now).Error; err != nil {
			return err
		}
		replacement.UserID = current.UserID
		return tx.Create(replacement).Error
	})
	return &current, err
}

func (r *RefreshTokenRepository) Revoke(tokenHash string) error {
	now := time.Now()
	return r.db.Model(&models.RefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("revoked_at", &now).Error
}

func (r *RefreshTokenRepository) RevokeAllForUser(userID string) error {
	now := time.Now()
	return r.db.Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", &now).Error
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
	err := r.db.Where("status = ?", "ACTIVE").Order("rating_average DESC, created_at DESC").Find(&stores).Error
	return stores, err
}

func (r *StoreRepository) FindByStoreID(storeID string) (*models.Store, error) {
	var store models.Store
	if err := r.db.Where("store_id = ? AND status = ?", storeID, "ACTIVE").First(&store).Error; err != nil {
		return nil, err
	}
	return &store, nil
}

func (r *StoreRepository) FindBySellerID(sellerID string) (*models.Store, error) {
	var store models.Store
	if err := r.db.Where("seller_id = ? AND status = ?", sellerID, "ACTIVE").First(&store).Error; err != nil {
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

func (r *OrderRepository) SellerOwnsEntireOrder(sellerID, orderID string) (bool, error) {
	var totalItems int64
	var sellerItems int64
	if err := r.db.Model(&models.OrderItem{}).Where("order_id_ref = ?", orderID).Count(&totalItems).Error; err != nil {
		return false, err
	}
	if err := r.db.Model(&models.OrderItem{}).Where("seller_id = ? AND order_id_ref = ?", sellerID, orderID).Count(&sellerItems).Error; err != nil {
		return false, err
	}
	return totalItems > 0 && totalItems == sellerItems, nil
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

func (r *CartRepository) Upsert(userID, productID, variant string, qty int) (*models.CartItem, error) {
	item := models.CartItem{UserID: userID, ProductID: productID, Variant: variant, Qty: qty, Selected: true}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "product_id"}},
		DoUpdates: clause.Assignments(map[string]any{"qty": gorm.Expr("qty + ?", qty), "variant": variant, "selected": true}),
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
