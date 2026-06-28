package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

/*
 * GuestCheckoutService adalah orkestrator yang menyatukan LogistikKita + SmartBank
 * untuk satu alur purchase yang lengkap. Implementasi ini TIDAK menyimpan
 * business logic milik LogistikKita/SmartBank; ia hanya memanggil kedua klien
 * tersebut dan menggabungkan response-nya untuk disimpan sebagai Order.
 */

var (
	ErrGuestInvalidAddress  = errors.New("alamat tujuan harus menyertakan negara, kota, kecamatan, kelurahan, alamat lengkap")
	ErrGuestInvalidCart     = errors.New("minimal satu produk diperlukan untuk checkout")
	ErrGuestItemsUnavailable = errors.New("beberapa produk tidak aktif atau stoknya tidak mencukupi")
	ErrGuestInvalidRate     = errors.New("rate_id tidak valid atau sudah kedaluwarsa, mohon pilih ulang opsi pengiriman")
	ErrGuestPaymentDeclined = errors.New("SmartBank menolak payment intent")
)

type GuestAddressInput struct {
	NamaPenerima  string `json:"nama_penerima"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
	Country       string `json:"country"`
	Kota          string `json:"kota"`
	Kecamatan     string `json:"kecamatan"`
	Kelurahan     string `json:"kelurahan"`
	AlamatLengkap string `json:"alamat_lengkap"`
	KodePos       string `json:"kode_pos"`
}

func (a GuestAddressInput) validate() error {
	if strings.TrimSpace(a.NamaPenerima) == "" {
		return ErrGuestInvalidAddress
	}
	if strings.TrimSpace(a.Email) == "" && strings.TrimSpace(a.Phone) == "" {
		return ErrGuestInvalidAddress
	}
	if strings.TrimSpace(a.Kota) == "" || strings.TrimSpace(a.Kecamatan) == "" || strings.TrimSpace(a.Kelurahan) == "" || strings.TrimSpace(a.AlamatLengkap) == "" {
		return ErrGuestInvalidAddress
	}
	if strings.TrimSpace(a.Country) == "" {
		a.Country = "ID"
	}
	return nil
}

type GuestCheckoutItem struct {
	ProductID string `json:"product_id"`
	Qty       int    `json:"qty"`
	Variant   string `json:"variant,omitempty"`
}

type GuestCheckoutInput struct {
	IsGuest       bool              `json:"is_guest"`
	UserID        string            `json:"user_id,omitempty"`
	Items         []GuestCheckoutItem `json:"items"`
	Address       GuestAddressInput   `json:"address"`
	ShippingRateID string             `json:"shipping_rate_id"`
	PaymentMethod string              `json:"payment_method"`
	VoucherCode   string              `json:"voucher_code,omitempty"`
}

type GuestCheckoutSummary struct {
	OrderID         string `json:"order_id"`
	OrderStatus     string `json:"status"`
	Subtotal        int64  `json:"subtotal"`
	MarketplaceFee  int64  `json:"marketplace_fee"`
	ShippingCost    int64  `json:"shipping_cost"`
	BankFee         int64  `json:"bank_fee"`
	GatewayFee      int64  `json:"gateway_fee"`
	SystemTax       int64  `json:"system_tax"`
	TotalBayar      int64  `json:"total_bayar"`
	RateID          string `json:"shipping_rate_id"`
	Courier         string `json:"courier"`
	Service         string `json:"courier_service"`
	ETA             string `json:"eta_days"`
	PaymentIntentID string `json:"payment_intent_id"`
	PaymentChannel  string `json:"payment_channel"`
	PaymentMethod   string `json:"payment_method_label"`
	VirtualAccount  string `json:"virtual_account,omitempty"`
	PaymentURL      string `json:"payment_url"`
	ExpiresAt       string `json:"payment_expires_at"`
	IntegrationTag  string `json:"integration_tag"`
	WeightGrams     int    `json:"weight_grams"`
}

type GuestCheckoutService struct {
	products *repositories.ProductRepository
	orders   *repositories.OrderRepository
	audit    *repositories.AuditLogRepository
	logistik *LogistikKitaClient
	smart    *SmartBankClient
	db       *gorm.DB
}

func NewGuestCheckoutService(db *gorm.DB, products *repositories.ProductRepository, orders *repositories.OrderRepository, audit *repositories.AuditLogRepository, logistik *LogistikKitaClient, smart *SmartBankClient) *GuestCheckoutService {
	return &GuestCheckoutService{products: products, orders: orders, audit: audit, logistik: logistik, smart: smart, db: db}
}

// PreviewShipping menerima alamat guest dan item cart, lalu meminta LogistikKita
// mengembalikan daftar opsi pengiriman. Ini adalah satu-satunya cara marketplace
// mendapatkan ongkir tanpa kalkulasi internal.
func (s *GuestCheckoutService) PreviewShipping(ctx context.Context, destination ShippingDestination, items []ShippingItem) (*ShippingRateList, error) {
	return s.logistik.GetRates(ctx, ShippingRequest{Destination: destination, Items: items})
}

// CreateCheckout: alur penuh dari submit guest checkout hingga payment intent.
// Tidak ada ledger/balance logic di sini; semuanya didelegasikan.
func (s *GuestCheckoutService) CreateCheckout(ctx context.Context, input GuestCheckoutInput) (*GuestCheckoutSummary, error) {
	if err := input.Address.validate(); err != nil {
		return nil, err
	}
	if len(input.Items) == 0 {
		return nil, ErrGuestInvalidCart
	}
	if strings.TrimSpace(input.ShippingRateID) == "" {
		return nil, ErrGuestInvalidRate
	}
	if strings.TrimSpace(input.PaymentMethod) == "" {
		return nil, errors.New("payment_method wajib diisi")
	}

	// Validasi produk dan stok
	products := make([]models.Product, 0, len(input.Items))
	shippingItems := make([]ShippingItem, 0, len(input.Items))
	paymentItems := make([]SmartBankPaymentItem, 0, len(input.Items))
	subtotal := int64(0)
	shippingTotalGrams := 0

	for _, item := range input.Items {
		if item.Qty <= 0 {
			return nil, fmt.Errorf("qty produk %s tidak valid", item.ProductID)
		}
		product, err := s.products.FindByProductID(item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("produk %s: %w", item.ProductID, err)
		}
		if !product.StatusAktif {
			return nil, fmt.Errorf("%w: %s nonaktif", ErrGuestItemsUnavailable, product.NamaProduk)
		}
		if product.Stok < item.Qty {
			return nil, fmt.Errorf("%w: %s (stok %d, diminta %d)", ErrGuestItemsUnavailable, product.NamaProduk, product.Stok, item.Qty)
		}
		products = append(products, *product)
		lineTotal := product.Harga * int64(item.Qty)
		subtotal += lineTotal
		shippingItems = append(shippingItems, ShippingItem{
			ProductID: product.ProductID,
			Qty:       item.Qty,
			BeratGram: product.BeratGram,
			Harga:     product.Harga,
		})
		shippingTotalGrams += product.BeratGram * item.Qty
		paymentItems = append(paymentItems, SmartBankPaymentItem{
			ProductID: product.ProductID,
			Quantity:  item.Qty,
			Harga:     product.Harga,
			LineTotal: lineTotal,
			SellerID:  product.SellerID,
		})
	}

	marketplaceFee := calculateMarketplaceFeeLocal(subtotal)

	// 1) Ambil rate shipping dari LogistikKita (single source of truth).
	rateList, err := s.logistik.GetRates(ctx, ShippingRequest{
		Destination: ShippingDestination{
			Country:       input.Address.Country,
			Kota:          input.Address.Kota,
			Kecamatan:     input.Address.Kecamatan,
			Kelurahan:     input.Address.Kelurahan,
			AlamatLengkap: input.Address.AlamatLengkap,
			KodePos:       input.Address.KodePos,
		},
		Items: shippingItems,
	})
	if err != nil {
		return nil, fmt.Errorf("gagal meminta ongkir ke LogistikKita: %w", err)
	}

	selected := pickShippingRate(rateList.Rates, input.ShippingRateID)
	if selected == nil {
		return nil, ErrGuestInvalidRate
	}

	// 2) Buat payment intent di SmartBank. SmartBank yang menghitung seluruh
	//    fee (bank fee, gateway fee, system tax) dan mengembalikan total akhir.
	orderID := newOrderIDForGuest()
	payment, err := s.smart.CreatePaymentIntent(ctx, SmartBankPaymentRequest{
		OrderID:         orderID,
		MarketplaceCode: "PASARKITA",
		Source:          "MARKETPLACE",
		Channel:         normalizeMethod(input.PaymentMethod),
		Customer: SmartBankCustomer{
			FullName: input.Address.NamaPenerima,
			Email:    input.Address.Email,
			Phone:    input.Address.Phone,
			Country:  input.Address.Country,
		},
		Items:         paymentItems,
		Subtotal:      subtotal,
		MarketplaceFee: marketplaceFee,
		ShippingCost:  selected.Price,
		Metadata: map[string]string{
			"marketplace_order_id": orderID,
			"shipping_courier":    selected.Courier,
			"shipping_service":    selected.Service,
			"shipping_rate_id":    selected.RateID,
			"guest_email":         input.Address.Email,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGuestPaymentDeclined, err)
	}

	referenceOfAddress := buildAddressSummary(input.Address)

	// 3) Simpan Order dalam satu transaction agar konsisten dengan LogistikKita dan SmartBank.
	now := time.Now()
	order := &models.Order{
		OrderID:          orderID,
		UserID:           input.UserID,
		IsGuest:          input.IsGuest || strings.TrimSpace(input.UserID) == "",
		GuestEmail:       strings.TrimSpace(input.Address.Email),
		GuestName:        strings.TrimSpace(input.Address.NamaPenerima),
		GuestPhone:       strings.TrimSpace(input.Address.Phone),
		Recipient: models.Recipient{
			NamaPenerima:  input.Address.NamaPenerima,
			Email:         input.Address.Email,
			Phone:         input.Address.Phone,
			Country:       input.Address.Country,
			Kota:          input.Address.Kota,
			Kecamatan:     input.Address.Kecamatan,
			Kelurahan:     input.Address.Kelurahan,
			AlamatLengkap: input.Address.AlamatLengkap,
			KodePos:       input.Address.KodePos,
		},
		StatusOrder:       models.StatusPendingPayment,
		Subtotal:          subtotal,
		MarketplaceFee:    marketplaceFee,
		ShippingCost:      selected.Price,
		BankFee:           payment.Breakdown.BankFee,
		GatewayFee:        payment.Breakdown.GatewayFee,
		SystemTax:         payment.Breakdown.SystemTax,
		TotalBayar:        payment.Breakdown.FinalTotal,
		PaymentRequestID:  payment.PaymentIntentID,
		PaymentIntentURL:  firstNonEmpty(payment.PaymentURL, buildLocalPaymentURL(orderID)),
		ShippingRateID:    selected.RateID,
		ShippingCourier:   selected.Courier,
		ShippingService:   selected.Service,
		ShippingETADays:   selected.ETADays,
		PaymentMethod:     input.PaymentMethod,
		VoucherCode:       strings.TrimSpace(input.VoucherCode),
		AlamatPengiriman:  referenceOfAddress,
		IntegrationStatus: payment.Status,
		Items:             toOrderItemsFromProducts(orderID, products, input.Items),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		return tx.Create(order).Error
	}); err != nil {
		return nil, fmt.Errorf("gagal menyimpan order: %w", err)
	}

	s.audit.Create(models.AuditLog{
		Method: "POST", Path: "/marketplace/guest/checkout",
		UserID: input.UserID, StatusCode: 201,
		Message: fmt.Sprintf("guest checkout order=%s subtotal=%d shipping=%d fee=%d final=%d via SmartBankID=%s",
			orderID, subtotal, selected.Price, marketplaceFee, payment.Breakdown.FinalTotal, payment.PaymentIntentID),
	})

	return &GuestCheckoutSummary{
		OrderID:         orderID,
		OrderStatus:     order.StatusOrder,
		Subtotal:        subtotal,
		MarketplaceFee:  marketplaceFee,
		ShippingCost:    selected.Price,
		BankFee:         payment.Breakdown.BankFee,
		GatewayFee:      payment.Breakdown.GatewayFee,
		SystemTax:       payment.Breakdown.SystemTax,
		TotalBayar:      payment.Breakdown.FinalTotal,
		RateID:          selected.RateID,
		Courier:         selected.Courier,
		Service:         selected.Service,
		ETA:             selected.ETADays,
		PaymentIntentID: payment.PaymentIntentID,
		PaymentChannel:  payment.Method,
		PaymentMethod:   payment.MethodLabel,
		VirtualAccount:  payment.VirtualAccount,
		PaymentURL:      order.PaymentIntentURL,
		ExpiresAt:       payment.ExpiresAt,
		IntegrationTag:  "logistikkita+smartbank",
		WeightGrams:     shippingTotalGrams,
	}, nil
}

// GetGuestOrder memfasilitasi lookup order guest tanpa auth menggunakan
// kombinasi order_id + email. Returned order ditambah field shipment status
// terbaru dari LogistikKita.
func (s *GuestCheckoutService) GetGuestOrder(ctx context.Context, orderID, email string) (*models.Order, *ShipmentResult, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if err != nil {
		return nil, nil, err
	}
	if strings.EqualFold(strings.TrimSpace(order.GuestEmail), strings.TrimSpace(email)) == false {
		return nil, nil, fmt.Errorf("email tidak cocok dengan pesanan")
	}
	if order.ShippingWaybill == "" {
		return order, nil, nil
	}
	shipment, err := s.logistik.TrackShipment(ctx, order.ShippingWaybill)
	if err == nil && shipment != nil {
		order.ShipmentStatus = shipment.Status
	}
	return order, shipment, nil
}

// FinalizeShipment dipanggil setelah payment webhook dari SmartBank menandai
// status PAID. Marketplace tidak memvalidasi saldo; status dari SmartBank
// sudah final. Marketplace hanya meneruskan untuk memicu shipment di LogistikKita.
func (s *GuestCheckoutService) FinalizeShipment(ctx context.Context, orderID string) (*ShipmentResult, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if err != nil {
		return nil, err
	}
	destination := ShippingDestination{
		Country:       order.Recipient.Country,
		Kota:          order.Recipient.Kota,
		Kecamatan:     order.Recipient.Kecamatan,
		Kelurahan:     order.Recipient.Kelurahan,
		AlamatLengkap: order.Recipient.AlamatLengkap,
		KodePos:       order.Recipient.KodePos,
	}

	shippingItems := make([]ShippingItem, 0, len(order.Items))
	for _, item := range order.Items {
		shippingItems = append(shippingItems, ShippingItem{
			ProductID: item.ProductID,
			Qty:       item.Qty,
			BeratGram: 500,
			Harga:     item.Harga,
		})
	}

	result, err := s.logistik.CreateShipment(ctx, ShipmentRequest{
		OrderID:     order.OrderID,
		RateID:      order.ShippingRateID,
		Destination: destination,
		Recipient: RecipientPayload{
			NamaPenerima: order.Recipient.NamaPenerima,
			Email:        order.Recipient.Email,
			Phone:        order.Recipient.Phone,
		},
		Items:        shippingItems,
		DeclaredNote: "PasarKita order " + order.OrderID,
	})
	if err != nil {
		return nil, err
	}
	order.ShipmentRef = result.ShipmentRef
	order.ShippingWaybill = result.Waybill
	order.StatusOrder = models.StatusReadyForShipment
	order.ShipmentStatus = result.Status
	order.UpdatedAt = time.Now()
	_ = s.orders.Save(order)
	return result, nil
}

func pickShippingRate(rates []ShippingRate, rateID string) *ShippingRate {
	for index := range rates {
		if rates[index].RateID == rateID {
			return &rates[index]
		}
	}
	return nil
}

func normalizeMethod(method string) string {
	switch strings.ToUpper(strings.TrimSpace(method)) {
	case "VA", "VIRTUAL_ACCOUNT", "VIRTUAL ACCOUNT":
		return "VIRTUAL_ACCOUNT"
	case "EWALLET", "E-WALLET", "E WALLET":
		return "EWALLET"
	case "COD", "BAYAR DI TEMPAT":
		return "COD"
	default:
		return strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(method), " ", "_"))
	}
}

func buildAddressSummary(address GuestAddressInput) string {
	return strings.Join([]string{
		address.AlamatLengkap,
		address.Kelurahan + ", " + address.Kecamatan + ", " + address.Kota,
		address.Country,
	}, " | ")
}

func buildLocalPaymentURL(orderID string) string {
	return "/#/payment/" + orderID
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func toOrderItemsFromProducts(orderID string, products []models.Product, inputs []GuestCheckoutItem) []models.OrderItem {
	items := make([]models.OrderItem, 0, len(products))
	qtyLookup := make(map[string]int, len(inputs))
	variantLookup := make(map[string]string, len(inputs))
	for _, item := range inputs {
		qtyLookup[item.ProductID] = item.Qty
		variantLookup[item.ProductID] = item.Variant
	}
	for _, product := range products {
		qty := qtyLookup[product.ProductID]
		items = append(items, models.OrderItem{
			OrderIDRef: orderID,
			ProductID:  product.ProductID,
			SellerID:   product.SellerID,
			StoreID:    product.StoreID,
			NamaProduk: product.NamaProduk,
			Harga:      product.Harga,
			Qty:        qty,
			Variant:    variantLookup[product.ProductID],
			LineTotal:  product.Harga * int64(qty),
		})
	}
	return items
}

func newOrderIDForGuest() string {
	return "ORD-G-" + time.Now().Format("150405") + "-" + randomish()
}

func randomish() string {
	const charset = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
	n := time.Now().UnixNano()
	out := make([]byte, 6)
	for i := range out {
		out[i] = charset[int(n%int64(len(charset)))]
		n /= int64(len(charset))
	}
	return string(out)
}

// CalculateMarketplaceFee diutilisasi bersama dengan MarketplaceService.go.
// Marketplace hanya menghitung fee layanannya sendiri (2%); fee bank/gateway/pajak
// dihitung oleh SmartBank dan tidak boleh direplikasi di sini. Implementasi
// lokal ini menjadi single-source-of-truth di file ini agar test integrasi
// tetap bisa dijalankan tanpa import marketplace_service.go.
func calculateMarketplaceFeeLocal(subtotal int64) int64 {
	return subtotal * 2 / 100
}
