package services

import (
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

const MarketplaceFeePercent int64 = 2

var (
	ErrBadRequest = errors.New("bad request")
	ErrNotFound   = errors.New("not found")
	ErrForbidden  = errors.New("forbidden")
)

type MarketplaceService struct {
	products    *repositories.ProductRepository
	orders      *repositories.OrderRepository
	auditLogs   *repositories.AuditLogRepository
	integration *IntegrationService
}

func NewMarketplaceService(products *repositories.ProductRepository, orders *repositories.OrderRepository, auditLogs *repositories.AuditLogRepository, integration *IntegrationService) *MarketplaceService {
	return &MarketplaceService{products: products, orders: orders, auditLogs: auditLogs, integration: integration}
}

type BrowseParams struct {
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

type ProductInput struct {
	ProductID     string   `json:"product_id"`
	ID            string   `json:"id"`
	SellerID      string   `json:"seller_id"`
	StoreID       string   `json:"store_id"`
	NamaProduk    string   `json:"nama_produk"`
	Name          string   `json:"name"`
	Deskripsi     string   `json:"deskripsi"`
	Description   string   `json:"description"`
	Harga         int64    `json:"harga"`
	Price         int64    `json:"price"`
	OriginalPrice int64    `json:"originalPrice"`
	Discount      int      `json:"discount"`
	Stok          int      `json:"stok"`
	Stock         int      `json:"stock"`
	Kategori      string   `json:"kategori"`
	Category      string   `json:"category"`
	CategoryID    string   `json:"categoryId"`
	ImageURL      string   `json:"image_url"`
	Image         string   `json:"image"`
	// Images menyimpan semua URL gambar produk terurut; elemen [0] adalah
	// gambar primer dan otomatis disalin ke ImageURL jika ImageURL kosong.
	Images        []string `json:"images"`
	Variants      []string `json:"variants"`
	Featured      bool     `json:"featured"`
	Highlights    []string `json:"highlights"`
	BeratGram     int      `json:"berat_gram"`
	Kondisi       string   `json:"kondisi"`
	Lokasi        string   `json:"lokasi"`
	StatusAktif   *bool    `json:"status_aktif"`
}

type CheckoutInput struct {
	UserID           string `json:"user_id"`
	ProductID        string `json:"product_id"`
	Qty              int    `json:"qty"`
	AlamatPengiriman string `json:"alamat_pengiriman"`
}

type PaymentIntegrationInput struct {
	OrderID string `json:"orderId"`
}

func (s *MarketplaceService) BrowseProducts(params BrowseParams) ([]models.Product, int64, error) {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 || params.Limit > 100 {
		params.Limit = 10
	}
	return s.products.Browse(repositories.ProductBrowseFilter{
		Keyword: params.Keyword, Category: params.Category, Location: params.Location,
		Sort: params.Sort, MinPrice: params.MinPrice, MaxPrice: params.MaxPrice,
		Rating: params.Rating, Promo: params.Promo, Page: params.Page, Limit: params.Limit,
	})
}

func (s *MarketplaceService) GetProduct(productID string) (*models.Product, error) {
	product, err := s.products.FindByProductID(productID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return product, err
}

func (s *MarketplaceService) ListSellerProducts() ([]models.Product, error) {
	return s.products.ListAll()
}

func (s *MarketplaceService) SaveProduct(input ProductInput) (*models.Product, error) {
	input.normalize()
	if strings.TrimSpace(input.SellerID) == "" || strings.TrimSpace(input.NamaProduk) == "" || strings.TrimSpace(input.Kategori) == "" || strings.TrimSpace(input.Deskripsi) == "" {
		return nil, fmt.Errorf("%w: seller_id, nama_produk, kategori, dan deskripsi wajib diisi", ErrBadRequest)
	}
	if input.Harga < 0 || input.Stok < 0 {
		return nil, fmt.Errorf("%w: harga dan stok tidak boleh negatif", ErrBadRequest)
	}

	statusAktif := true
	if input.StatusAktif != nil {
		statusAktif = *input.StatusAktif
	}

	var product *models.Product
	var err error
	if input.ProductID != "" {
		product, err = s.products.FindByProductID(input.ProductID)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, err
		}
	} else {
		product = &models.Product{ProductID: newProductID()}
	}

	product.SellerID = input.SellerID
	product.StoreID = input.StoreID
	product.NamaProduk = input.NamaProduk
	product.Deskripsi = input.Deskripsi
	product.Harga = input.Harga
	product.OriginalPrice = input.OriginalPrice
	product.Discount = input.Discount
	product.Stok = input.Stok
	product.CategoryID = input.CategoryID
	product.Kategori = input.Kategori
	product.ImageURL = input.ImageURL
	if len(product.Images) == 0 {
		product.Images = input.Images
	}
	if product.ImageURL == "" && len(product.Images) > 0 {
		product.ImageURL = product.Images[0]
	}
	product.Variants = input.Variants
	product.Featured = input.Featured
	product.Highlights = input.Highlights
	product.BeratGram = input.BeratGram
	if product.BeratGram <= 0 {
		product.BeratGram = 500
	}
	product.Kondisi = strings.TrimSpace(input.Kondisi)
	if product.Kondisi == "" {
		product.Kondisi = "Baru"
	}
	product.Lokasi = input.Lokasi
	product.StatusAktif = statusAktif

	if err := s.products.Save(product); err != nil {
		return nil, err
	}
	return product, nil
}

func (input *ProductInput) normalize() {
	if input.ProductID == "" {
		input.ProductID = input.ID
	}
	if input.NamaProduk == "" {
		input.NamaProduk = input.Name
	}
	if input.Deskripsi == "" {
		input.Deskripsi = input.Description
	}
	if input.Harga == 0 {
		input.Harga = input.Price
	}
	if input.Stok == 0 {
		input.Stok = input.Stock
	}
	if input.Kategori == "" {
		input.Kategori = input.Category
	}
	if input.CategoryID == "" {
		input.CategoryID = strings.ToLower(strings.ReplaceAll(input.Kategori, " ", "-"))
	}
	if input.ImageURL == "" {
		input.ImageURL = input.Image
	}
	if input.OriginalPrice == 0 {
		input.OriginalPrice = input.Harga
	}
	if len(input.Highlights) == 0 {
		input.Highlights = []string{"Kualitas terkurasi", "Dikirim maksimal 24 jam", "Garansi retur 7 hari", "Kemasan aman"}
	}
}

func (s *MarketplaceService) SetProductStatus(productID string, active bool) (*models.Product, error) {
	product, err := s.products.FindByProductID(productID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	product.StatusAktif = active
	if err := s.products.Save(product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *MarketplaceService) Checkout(userID string, input CheckoutInput, authorization string) (*models.Order, error) {
	if strings.TrimSpace(input.ProductID) == "" || strings.TrimSpace(input.AlamatPengiriman) == "" {
		return nil, fmt.Errorf("%w: product_id dan alamat_pengiriman wajib diisi", ErrBadRequest)
	}
	input.UserID = userID
	if input.Qty <= 0 {
		return nil, fmt.Errorf("%w: qty harus lebih dari 0", ErrBadRequest)
	}

	product, err := s.products.FindByProductID(input.ProductID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		slog.Warn("checkout_rejected",
			slog.String("user_id", userID),
			slog.String("product_id", input.ProductID),
			slog.String("reason", "product_not_found"),
		)
		return nil, ErrNotFound
	}
	if err != nil {
		slog.Error("checkout_error", slog.String("user_id", userID), slog.String("error", err.Error()))
		return nil, err
	}
	if !product.StatusAktif {
		slog.Warn("checkout_rejected",
			slog.String("user_id", userID),
			slog.String("product_id", input.ProductID),
			slog.String("reason", "product_inactive"),
		)
		return nil, fmt.Errorf("%w: produk nonaktif", ErrBadRequest)
	}
	if product.Stok <= 0 {
		slog.Warn("checkout_rejected",
			slog.String("user_id", userID),
			slog.String("product_id", input.ProductID),
			slog.String("reason", "out_of_stock"),
		)
		return nil, fmt.Errorf("%w: stok produk habis", ErrBadRequest)
	}
	if input.Qty > product.Stok {
		slog.Warn("checkout_rejected",
			slog.String("user_id", userID),
			slog.String("product_id", input.ProductID),
			slog.Int("requested_qty", input.Qty),
			slog.Int("available_stok", product.Stok),
			slog.String("reason", "qty_exceeds_stock"),
		)
		return nil, fmt.Errorf("%w: qty melebihi stok tersedia", ErrBadRequest)
	}

	subtotal := product.Harga * int64(input.Qty)
	fee := CalculateMarketplaceFee(subtotal)
	total := subtotal + fee
	orderID := newOrderID()

	payment := s.integration.SendPaymentRequest(PaymentRequest{
		OrderID:          orderID,
		UserID:           input.UserID,
		FromUser:         input.UserID,
		ToUserService:    product.SellerID,
		Amount:           total,
		MarketplaceFee:   fee,
		Metadata:         "Marketplace PasarKita checkout " + product.ProductID,
		AlamatPengiriman: input.AlamatPengiriman,
	}, authorization)

	status := models.StatusPendingPayment
	if payment.Status == "PAYMENT_FAILED" {
		status = models.StatusPaymentFailed
	}
	if payment.Status == "PAYMENT_PROCESSING" {
		status = models.StatusPaymentProcess
	}

	order := &models.Order{
		OrderID:           orderID,
		UserID:            input.UserID,
		StatusOrder:       status,
		Subtotal:          subtotal,
		MarketplaceFee:    fee,
		GatewayFee:        payment.GatewayFee,
		TotalBayar:        total,
		PaymentRequestID:  payment.PaymentRequestID,
		AlamatPengiriman:  input.AlamatPengiriman,
		IntegrationStatus: payment.Status,
		Items: []models.OrderItem{
			{
				OrderIDRef: orderID,
				ProductID:  product.ProductID,
				SellerID:   product.SellerID,
				StoreID:    product.StoreID,
				NamaProduk: product.NamaProduk,
				Harga:      product.Harga,
				Qty:        input.Qty,
				LineTotal:  subtotal,
			},
		},
	}

	if err := s.orders.Create(order); err != nil {
		slog.Error("checkout_error",
			slog.String("user_id", input.UserID),
			slog.String("order_id", orderID),
			slog.String("phase", "orders_create"),
			slog.String("error", err.Error()),
		)
		return nil, err
	}

	s.auditLogs.Create(models.AuditLog{
		Method:     "POST",
		Path:       "/marketplace/checkout",
		UserID:     input.UserID,
		StatusCode: 201,
		Message:    "order created without direct saldo mutation",
	})

	slog.Info("checkout_success",
		slog.String("user_id", input.UserID),
		slog.String("order_id", orderID),
		slog.String("product_id", input.ProductID),
		slog.Int("qty", input.Qty),
		slog.Int64("subtotal", subtotal),
		slog.Int64("marketplace_fee", fee),
		slog.Int64("total", total),
		slog.String("integration_status", payment.Status),
	)
	return order, nil
}

func (s *MarketplaceService) IntegratePayment(userID string, input PaymentIntegrationInput, authorization string) (*models.Order, error) {
	if strings.TrimSpace(input.OrderID) == "" {
		return nil, fmt.Errorf("%w: order_id wajib diisi", ErrBadRequest)
	}

	order, err := s.orders.FindByOrderID(input.OrderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		slog.Warn("payment_rejected",
			slog.String("user_id", userID),
			slog.String("order_id", input.OrderID),
			slog.String("reason", "order_not_found"),
		)
		return nil, ErrNotFound
	}
	if err != nil {
		slog.Error("payment_error", slog.String("user_id", userID), slog.String("error", err.Error()))
		return nil, err
	}
	if order.UserID != userID {
		slog.Warn("payment_rejected",
			slog.String("user_id", userID),
			slog.String("order_id", input.OrderID),
			slog.String("order_owner", order.UserID),
			slog.String("reason", "ownership_mismatch"),
		)
		return nil, fmt.Errorf("%w: order bukan milik user aktif", ErrForbidden)
	}
	if order.StatusOrder == models.StatusPaid || order.StatusOrder == models.StatusCompleted {
		slog.Info("payment_idempotent_noop",
			slog.String("user_id", userID),
			slog.String("order_id", order.OrderID),
			slog.String("status", order.StatusOrder),
		)
		return order, nil
	}

	payment := s.integration.SendPaymentRequest(PaymentRequest{
		OrderID:          order.OrderID,
		UserID:           order.UserID,
		FromUser:         order.UserID,
		ToUserService:    "SELLER",
		Amount:           order.TotalBayar,
		MarketplaceFee:   order.MarketplaceFee,
		Metadata:         "Marketplace PasarKita retry payment " + order.OrderID,
		AlamatPengiriman: order.AlamatPengiriman,
	}, authorization)

	order.PaymentRequestID = payment.PaymentRequestID
	order.GatewayFee = payment.GatewayFee
	order.IntegrationStatus = payment.Status
	if payment.Status == "PAYMENT_FAILED" {
		slog.Warn("payment_failed",
			slog.String("user_id", userID),
			slog.String("order_id", order.OrderID),
			slog.Int64("amount", order.TotalBayar),
		)
		order.StatusOrder = models.StatusPaymentFailed
	} else {
		slog.Info("payment_dispatched",
			slog.String("user_id", userID),
			slog.String("order_id", order.OrderID),
			slog.String("integration_status", payment.Status),
			slog.Int64("amount", order.TotalBayar),
		)
		order.StatusOrder = models.StatusPaymentProcess
	}

	if err := s.orders.Save(order); err != nil {
		slog.Error("payment_error",
			slog.String("user_id", userID),
			slog.String("order_id", order.OrderID),
			slog.String("phase", "orders_save"),
			slog.String("error", err.Error()),
		)
		return nil, err
	}
	return order, nil
}

func (s *MarketplaceService) GetOrder(orderID string) (*models.Order, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return order, err
}

func (s *MarketplaceService) GetOrderForUser(userID, orderID string) (*models.Order, error) {
	order, err := s.GetOrder(orderID)
	if err != nil {
		return nil, err
	}
	if order.UserID != userID {
		return nil, fmt.Errorf("%w: order bukan milik user aktif", ErrForbidden)
	}
	return order, nil
}

func CalculateMarketplaceFee(subtotal int64) int64 {
	return subtotal * MarketplaceFeePercent / 100
}

func newProductID() string {
	return "PRD" + strconv.FormatInt(time.Now().UnixNano()%1000000, 10)
}

func newOrderID() string {
	return "ORD-" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
