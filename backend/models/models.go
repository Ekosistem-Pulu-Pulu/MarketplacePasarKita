package models

import "time"

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"-"`
	ProductID   string    `gorm:"uniqueIndex;size:32;not null" json:"product_id"`
	SellerID    string    `gorm:"size:64;not null" json:"seller_id"`
	NamaProduk  string    `gorm:"size:160;not null" json:"nama_produk"`
	Deskripsi   string    `gorm:"type:text;not null" json:"deskripsi"`
	Harga       int64     `gorm:"not null" json:"harga"`
	Stok        int       `gorm:"not null" json:"stok"`
	Kategori    string    `gorm:"size:80;not null" json:"kategori"`
	StatusAktif bool      `gorm:"not null;default:true" json:"status_aktif"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
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
	AlamatPengiriman  string      `gorm:"type:text;not null" json:"alamat_pengiriman"`
	IntegrationStatus string      `gorm:"size:40;not null" json:"integration_status"`
	Items             []OrderItem `gorm:"foreignKey:OrderIDRef;references:OrderID" json:"items"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

type OrderItem struct {
	ID         uint      `gorm:"primaryKey" json:"-"`
	OrderIDRef string    `gorm:"size:48;index;not null" json:"order_id"`
	ProductID  string    `gorm:"size:32;not null" json:"product_id"`
	NamaProduk string    `gorm:"size:160;not null" json:"nama_produk"`
	Harga      int64     `gorm:"not null" json:"harga"`
	Qty        int       `gorm:"not null" json:"qty"`
	LineTotal  int64     `gorm:"not null" json:"line_total"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
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
