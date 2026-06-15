package models

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"
)

func HashPassword(password, secret string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(password) + ":" + secret))
	return hex.EncodeToString(sum[:])
}

type User struct {
	ID            uint      `gorm:"primaryKey" json:"-"`
	UserID        string    `gorm:"uniqueIndex;size:64;not null" json:"id"`
	Name          string    `gorm:"size:120;not null" json:"name"`
	Email         string    `gorm:"uniqueIndex;size:160;not null" json:"email"`
	PasswordHash  string    `gorm:"size:128;not null" json:"-"`
	Role          string    `gorm:"size:48;not null" json:"role"`
	Phone         string    `gorm:"size:32" json:"phone"`
	EmailVerified bool      `gorm:"not null;default:false" json:"emailVerified"`
	Status        string    `gorm:"size:32;not null;default:ACTIVE" json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type UserAddress struct {
	ID          uint      `gorm:"primaryKey" json:"-"`
	AddressID   string    `gorm:"uniqueIndex;size:48;not null" json:"id"`
	UserID      string    `gorm:"size:64;index;not null" json:"-"`
	Label       string    `gorm:"size:80;not null" json:"label"`
	Recipient   string    `gorm:"size:120;not null" json:"recipient"`
	Phone       string    `gorm:"size:32;not null" json:"phone"`
	AddressLine string    `gorm:"type:text;not null" json:"address"`
	City        string    `gorm:"size:80;not null" json:"city"`
	Province    string    `gorm:"size:80;not null" json:"province"`
	PostalCode  string    `gorm:"size:20" json:"postalCode"`
	IsDefault   bool      `gorm:"not null;default:false" json:"isDefault"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Store struct {
	ID            uint      `gorm:"primaryKey" json:"-"`
	StoreID       string    `gorm:"uniqueIndex;size:48;not null" json:"id"`
	SellerID      string    `gorm:"size:64;index;not null" json:"-"`
	Name          string    `gorm:"size:140;not null" json:"name"`
	Slug          string    `gorm:"uniqueIndex;size:160;not null" json:"-"`
	Description   string    `gorm:"type:text" json:"description"`
	City          string    `gorm:"size:80" json:"-"`
	Province      string    `gorm:"size:80" json:"-"`
	Location      string    `gorm:"size:120" json:"location"`
	LogoURL       string    `gorm:"size:255" json:"logo"`
	RatingAverage float64   `gorm:"not null;default:0" json:"rating"`
	ReviewCount   int       `gorm:"not null;default:0" json:"-"`
	ProductCount  int       `gorm:"not null;default:0" json:"products"`
	Badge         string    `gorm:"size:48" json:"badge"`
	Initials      string    `gorm:"size:8" json:"initials"`
	Status        string    `gorm:"size:32;not null;default:ACTIVE" json:"-"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Product struct {
	ID            uint      `gorm:"primaryKey" json:"-"`
	ProductID     string    `gorm:"uniqueIndex;size:64;not null" json:"id"`
	SellerID      string    `gorm:"size:64;not null" json:"-"`
	StoreID       string    `gorm:"size:48;index" json:"-"`
	NamaProduk    string    `gorm:"size:160;not null" json:"name"`
	Deskripsi     string    `gorm:"type:text;not null" json:"description"`
	Harga         int64     `gorm:"not null" json:"price"`
	OriginalPrice int64     `gorm:"not null;default:0" json:"originalPrice"`
	Discount      int       `gorm:"not null;default:0" json:"discount"`
	Stok          int       `gorm:"not null" json:"stock"`
	CategoryID    string    `gorm:"size:80;index" json:"categoryId"`
	Kategori      string    `gorm:"size:80;not null" json:"category"`
	ImageURL      string    `gorm:"size:255" json:"image"`
	Variants      []string  `gorm:"serializer:json;type:text" json:"variants"`
	Featured      bool      `gorm:"not null;default:false" json:"featured"`
	Highlights    []string  `gorm:"serializer:json;type:text" json:"highlights"`
	BeratGram     int       `gorm:"not null;default:500" json:"weightGram"`
	Kondisi       string    `gorm:"size:32;not null;default:Baru" json:"condition"`
	Lokasi        string    `gorm:"size:120" json:"location"`
	RatingAvg     float64   `gorm:"not null;default:0" json:"rating"`
	ReviewCount   int       `gorm:"not null;default:0" json:"reviewCount"`
	SoldCount     int       `gorm:"not null;default:0" json:"sold"`
	StatusAktif   bool      `gorm:"not null;default:true" json:"active"`
	Store         Store     `gorm:"-" json:"store"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Order struct {
	ID                uint        `gorm:"primaryKey" json:"-"`
	OrderID           string      `gorm:"uniqueIndex;size:48;not null" json:"order_id"`
	UserID            string      `gorm:"size:64;not null" json:"user_id"`
	StatusOrder       string      `gorm:"size:40;not null" json:"status_order"`
	Subtotal          int64       `gorm:"not null" json:"subtotal"`
	MarketplaceFee    int64       `gorm:"not null" json:"marketplace_fee"`
	GatewayFee        int64       `gorm:"not null;default:0" json:"gateway_fee"`
	TotalBayar        int64       `gorm:"not null" json:"total_bayar"`
	PaymentRequestID  string      `gorm:"size:64" json:"payment_request_id"`
	AddressID         string      `gorm:"size:48" json:"address_id"`
	AlamatPengiriman  string      `gorm:"type:text;not null" json:"alamat_pengiriman"`
	ShippingCourier   string      `gorm:"size:40" json:"shipping_courier"`
	ShippingService   string      `gorm:"size:80" json:"shipping_service"`
	ShippingCost      int64       `gorm:"not null;default:0" json:"shipping_cost"`
	VoucherCode       string      `gorm:"size:40" json:"voucher_code"`
	DiscountAmount    int64       `gorm:"not null;default:0" json:"discount_amount"`
	PaymentMethod     string      `gorm:"size:60" json:"payment_method"`
	InvoiceNumber     string      `gorm:"size:80" json:"invoice_number"`
	CancelReason      string      `gorm:"size:255" json:"cancel_reason"`
	IntegrationStatus string      `gorm:"size:40;not null" json:"integration_status"`
	Items             []OrderItem `gorm:"foreignKey:OrderIDRef;references:OrderID" json:"items"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID         uint      `gorm:"primaryKey" json:"-"`
	OrderIDRef string    `gorm:"size:48;index;not null" json:"order_id"`
	ProductID  string    `gorm:"size:32;not null" json:"product_id"`
	SellerID   string    `gorm:"size:64;index" json:"seller_id"`
	StoreID    string    `gorm:"size:48;index" json:"store_id"`
	NamaProduk string    `gorm:"size:160;not null" json:"nama_produk"`
	Harga      int64     `gorm:"not null" json:"harga"`
	Qty        int       `gorm:"not null" json:"qty"`
	Variant    string    `gorm:"size:120" json:"variant"`
	LineTotal  int64     `gorm:"not null" json:"line_total"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type CartItem struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	UserID    string    `gorm:"size:64;uniqueIndex:idx_cart_user_product;not null" json:"user_id"`
	ProductID string    `gorm:"size:32;uniqueIndex:idx_cart_user_product;not null" json:"product_id"`
	Variant   string    `gorm:"size:120" json:"variant"`
	Qty       int       `gorm:"not null" json:"qty"`
	Selected  bool      `gorm:"not null;default:true" json:"selected"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Wishlist struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	UserID    string    `gorm:"size:64;index;not null" json:"user_id"`
	ProductID string    `gorm:"size:32;index;not null" json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Voucher struct {
	ID            uint       `gorm:"primaryKey" json:"-"`
	Code          string     `gorm:"uniqueIndex;size:40;not null" json:"code"`
	Name          string     `gorm:"size:140;not null" json:"name"`
	DiscountType  string     `gorm:"size:24;not null" json:"discount_type"`
	DiscountValue int64      `gorm:"not null" json:"discount_value"`
	MinSpend      int64      `gorm:"not null;default:0" json:"min_spend"`
	MaxDiscount   int64      `gorm:"not null;default:0" json:"max_discount"`
	Active        bool       `gorm:"not null;default:true" json:"active"`
	ExpiredAt     *time.Time `json:"expired_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Review struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	ReviewID  string    `gorm:"uniqueIndex;size:48;not null" json:"review_id"`
	ProductID string    `gorm:"size:32;index;not null" json:"product_id"`
	UserID    string    `gorm:"size:64;index;not null" json:"user_id"`
	Rating    int       `gorm:"not null" json:"rating"`
	Comment   string    `gorm:"type:text" json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProductDiscussion struct {
	ID           uint      `gorm:"primaryKey" json:"-"`
	DiscussionID string    `gorm:"uniqueIndex;size:48;not null" json:"discussion_id"`
	ProductID    string    `gorm:"size:32;index;not null" json:"product_id"`
	UserID       string    `gorm:"size:64;index;not null" json:"user_id"`
	Message      string    `gorm:"type:text;not null" json:"message"`
	Reply        string    `gorm:"type:text" json:"reply"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ChatMessage struct {
	ID             uint       `gorm:"primaryKey" json:"-"`
	MessageID      string     `gorm:"uniqueIndex;size:48;not null" json:"message_id"`
	ConversationID string     `gorm:"size:80;index;not null" json:"conversation_id"`
	SenderID       string     `gorm:"size:64;index;not null" json:"sender_id"`
	ReceiverID     string     `gorm:"size:64;index;not null" json:"receiver_id"`
	ProductID      string     `gorm:"size:32;index" json:"product_id"`
	Body           string     `gorm:"type:text;not null" json:"body"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

type Notification struct {
	ID             uint      `gorm:"primaryKey" json:"-"`
	NotificationID string    `gorm:"uniqueIndex;size:48;not null" json:"notification_id"`
	UserID         string    `gorm:"size:64;index;not null" json:"user_id"`
	Title          string    `gorm:"size:140;not null" json:"title"`
	Body           string    `gorm:"type:text;not null" json:"body"`
	Type           string    `gorm:"size:40;not null" json:"type"`
	IsRead         bool      `gorm:"not null;default:false" json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}

type Shipment struct {
	ID             uint      `gorm:"primaryKey" json:"-"`
	ShipmentID     string    `gorm:"uniqueIndex;size:48;not null" json:"shipment_id"`
	OrderIDRef     string    `gorm:"size:48;index;not null" json:"order_id"`
	Courier        string    `gorm:"size:40;not null" json:"courier"`
	Service        string    `gorm:"size:80;not null" json:"service"`
	TrackingNumber string    `gorm:"size:80" json:"tracking_number"`
	Status         string    `gorm:"size:40;not null" json:"status"`
	ShippingCost   int64     `gorm:"not null;default:0" json:"shipping_cost"`
	EstimatedDays  string    `gorm:"size:40" json:"estimated_days"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Method     string    `gorm:"size:12;not null" json:"method"`
	Path       string    `gorm:"size:255;not null" json:"path"`
	UserID     string    `gorm:"size:64" json:"user_id"`
	StatusCode int       `gorm:"not null" json:"status_code"`
	Message    string    `gorm:"size:255" json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}

const (
	StatusDraft            = "DRAFT"
	StatusPendingPayment   = "PENDING_PAYMENT"
	StatusPaymentProcess   = "PAYMENT_PROCESSING"
	StatusPaid             = "PAID"
	StatusPaymentFailed    = "PAYMENT_FAILED"
	StatusReadyForShipment = "READY_FOR_SHIPMENT"
	StatusShipped          = "SHIPPED"
	StatusCompleted        = "COMPLETED"
	StatusCancelled        = "CANCELLED"
)

const (
	RoleBuyer           = "buyer"
	RoleSeller          = "seller"
	RoleCatalogAdmin    = "catalog_admin"
	RoleCustomerSupport = "customer_support"
	RoleFinanceOps      = "finance_ops"
	RoleFulfillmentOps  = "fulfillment_ops"
	RolePlatformAdmin   = "platform_admin"
	RoleTechMaintainer  = "tech_maintainer"
)
