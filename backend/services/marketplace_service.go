package services

import (
	"errors"
	"fmt"
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
	Kategori string
	Sort     string
	Page     int
	Limit    int
}

type ProductInput struct {
	ProductID   string `json:"product_id"`
	SellerID    string `json:"seller_id"`
	StoreID     string `json:"store_id"`
	NamaProduk  string `json:"nama_produk"`
	Deskripsi   string `json:"deskripsi"`
	Harga       int64  `json:"harga"`
	Stok        int    `json:"stok"`
	Kategori    string `json:"kategori"`
	ImageURL    string `json:"image_url"`
	BeratGram   int    `json:"berat_gram"`
	Kondisi     string `json:"kondisi"`
	Lokasi      string `json:"lokasi"`
	StatusAktif *bool  `json:"status_aktif"`
}

type CheckoutInput struct {
	UserID           string `json:"user_id"`
	ProductID        string `json:"product_id"`
	Qty              int    `json:"qty"`
	AlamatPengiriman string `json:"alamat_pengiriman"`
}

type PaymentIntegrationInput struct {
	OrderID string `json:"order_id"`
}

func (s *MarketplaceService) BrowseProducts(params BrowseParams) ([]models.Product, int64, error) {
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 || params.Limit > 100 {
		params.Limit = 10
	}
	return s.products.Browse(params.Keyword, params.Kategori, params.Sort, params.Page, params.Limit)
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
	product.Stok = input.Stok
	product.Kategori = input.Kategori
	product.ImageURL = input.ImageURL
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

func (s *MarketplaceService) Checkout(input CheckoutInput, authorization string) (*models.Order, error) {
	if strings.TrimSpace(input.UserID) == "" || strings.TrimSpace(input.ProductID) == "" || strings.TrimSpace(input.AlamatPengiriman) == "" {
		return nil, fmt.Errorf("%w: user_id, product_id, dan alamat_pengiriman wajib diisi", ErrBadRequest)
	}
	if input.Qty <= 0 {
		return nil, fmt.Errorf("%w: qty harus lebih dari 0", ErrBadRequest)
	}

	product, err := s.products.FindByProductID(input.ProductID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if !product.StatusAktif {
		return nil, fmt.Errorf("%w: produk nonaktif", ErrBadRequest)
	}
	if product.Stok <= 0 {
		return nil, fmt.Errorf("%w: stok produk habis", ErrBadRequest)
	}
	if input.Qty > product.Stok {
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
		return nil, err
	}

	s.auditLogs.Create(models.AuditLog{
		Method:     "POST",
		Path:       "/marketplace/checkout",
		UserID:     input.UserID,
		StatusCode: 201,
		Message:    "order created without direct saldo mutation",
	})

	return order, nil
}

func (s *MarketplaceService) IntegratePayment(input PaymentIntegrationInput, authorization string) (*models.Order, error) {
	if strings.TrimSpace(input.OrderID) == "" {
		return nil, fmt.Errorf("%w: order_id wajib diisi", ErrBadRequest)
	}

	order, err := s.orders.FindByOrderID(input.OrderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if order.StatusOrder == models.StatusPaid || order.StatusOrder == models.StatusCompleted {
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
		order.StatusOrder = models.StatusPaymentFailed
	} else {
		order.StatusOrder = models.StatusPaymentProcess
	}

	if err := s.orders.Save(order); err != nil {
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

func CalculateMarketplaceFee(subtotal int64) int64 {
	return subtotal * MarketplaceFeePercent / 100
}

func newProductID() string {
	return "PRD" + strconv.FormatInt(time.Now().UnixNano()%1000000, 10)
}

func newOrderID() string {
	return "ORD-" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
