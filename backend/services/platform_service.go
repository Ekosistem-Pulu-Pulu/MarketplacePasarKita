package services

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

type AccountService struct {
	users     *repositories.UserRepository
	addresses *repositories.AddressRepository
	auth      *AuthService
}

func NewAccountService(users *repositories.UserRepository, addresses *repositories.AddressRepository, auth *AuthService) *AccountService {
	return &AccountService{users: users, addresses: addresses, auth: auth}
}

type UpdateProfileInput struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type AddressInput struct {
	AddressID   string `json:"id"`
	Label       string `json:"label"`
	Recipient   string `json:"recipient"`
	Phone       string `json:"phone"`
	AddressLine string `json:"address"`
	City        string `json:"city"`
	Province    string `json:"province"`
	PostalCode  string `json:"postalCode"`
	IsDefault   bool   `json:"isDefault"`
}

func (s *AccountService) PublicUser(userID string) (*models.User, error) {
	user, err := s.users.FindByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return user, err
}

func (s *AccountService) Register(input struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Phone    string `json:"phone"`
}) (*AuthResult, error) {
	allowed := map[string]bool{
		models.RoleBuyer:  true,
		models.RoleSeller: true,
	}
	if input.Role == "" {
		input.Role = models.RoleBuyer
	}
	if !allowed[input.Role] {
		return nil, fmt.Errorf("%w: registrasi publik hanya untuk buyer atau seller", ErrBadRequest)
	}
	return s.auth.Register(input.Name, input.Email, input.Password, input.Role, input.Phone)
}

func (s *AccountService) UpdateProfile(userID string, input UpdateProfileInput) (*models.User, error) {
	user, err := s.users.FindByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Name) != "" {
		user.Name = strings.TrimSpace(input.Name)
	}
	user.Phone = strings.TrimSpace(input.Phone)
	if err := s.users.Save(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AccountService) ListAddresses(userID string) ([]models.UserAddress, error) {
	return s.addresses.ListByUser(userID)
}

func (s *AccountService) SaveAddress(userID string, input AddressInput) (*models.UserAddress, error) {
	if strings.TrimSpace(input.Label) == "" || strings.TrimSpace(input.Recipient) == "" || strings.TrimSpace(input.Phone) == "" || strings.TrimSpace(input.AddressLine) == "" || strings.TrimSpace(input.City) == "" || strings.TrimSpace(input.Province) == "" {
		return nil, fmt.Errorf("%w: label, penerima, phone, alamat, city, dan province wajib diisi", ErrBadRequest)
	}

	var address *models.UserAddress
	var err error
	if input.AddressID != "" {
		address, err = s.addresses.FindByAddressID(input.AddressID)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, err
		}
		if address.UserID != userID {
			return nil, fmt.Errorf("%w: alamat bukan milik user aktif", ErrBadRequest)
		}
	} else {
		address = &models.UserAddress{AddressID: newAddressID(), UserID: userID}
	}

	address.Label = strings.TrimSpace(input.Label)
	address.Recipient = strings.TrimSpace(input.Recipient)
	address.Phone = strings.TrimSpace(input.Phone)
	address.AddressLine = strings.TrimSpace(input.AddressLine)
	address.City = strings.TrimSpace(input.City)
	address.Province = strings.TrimSpace(input.Province)
	address.PostalCode = strings.TrimSpace(input.PostalCode)
	address.IsDefault = input.IsDefault

	if err := s.addresses.Save(address); err != nil {
		return nil, err
	}
	return address, nil
}

type PlatformService struct {
	products    *repositories.ProductRepository
	orders      *repositories.OrderRepository
	cart        *repositories.CartRepository
	addresses   *repositories.AddressRepository
	stores      *repositories.StoreRepository
	data        *repositories.MarketplaceDataRepository
	integration *IntegrationService
	auditLogs   *repositories.AuditLogRepository
}

func NewPlatformService(products *repositories.ProductRepository, orders *repositories.OrderRepository, cart *repositories.CartRepository, addresses *repositories.AddressRepository, stores *repositories.StoreRepository, data *repositories.MarketplaceDataRepository, integration *IntegrationService, auditLogs *repositories.AuditLogRepository) *PlatformService {
	return &PlatformService{products: products, orders: orders, cart: cart, addresses: addresses, stores: stores, data: data, integration: integration, auditLogs: auditLogs}
}

type CartView struct {
	ProductID string         `json:"productId"`
	Qty       int            `json:"qty"`
	Variant   string         `json:"variant"`
	Selected  bool           `json:"selected"`
	Product   models.Product `json:"product"`
}

type CartSummary struct {
	Items    []CartView `json:"items"`
	Subtotal int64      `json:"subtotal"`
	Count    int        `json:"count"`
}

type CartInput struct {
	ProductID string `json:"productId"`
	Qty       int    `json:"qty"`
	Variant   string `json:"variant"`
	Selected  *bool  `json:"selected"`
}

type ShippingChoice struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Carrier string `json:"carrier"`
	Service string `json:"service"`
	Eta     string `json:"eta"`
	Price   int64  `json:"price"`
}

type PaymentChoice struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Fee  int64  `json:"fee"`
}

type CartCheckoutInput struct {
	AddressID   string         `json:"addressId"`
	Shipping    ShippingChoice `json:"shipping"`
	Payment     PaymentChoice  `json:"payment"`
	VoucherCode string         `json:"voucherCode"`
}

type CartSyncInput struct {
	Items []CartInput `json:"items"`
}

type CheckoutEstimate struct {
	Items      []CartView     `json:"items"`
	Subtotal   int64          `json:"subtotal"`
	Discount   int64          `json:"discount"`
	Shipping   ShippingChoice `json:"shipping"`
	Payment    PaymentChoice  `json:"payment"`
	ServiceFee int64          `json:"serviceFee"`
	Total      int64          `json:"total"`
	Count      int            `json:"count"`
}

type VoucherPreview struct {
	Code           string `json:"code"`
	Subtotal       int64  `json:"subtotal"`
	DiscountAmount int64  `json:"discount_amount"`
	Eligible       bool   `json:"eligible"`
	Message        string `json:"message"`
}

func (s *PlatformService) Cart(userID string) (*CartSummary, error) {
	items, err := s.cart.ListByUser(userID)
	if err != nil {
		return nil, err
	}

	summary := &CartSummary{Items: []CartView{}}
	for _, item := range items {
		product, err := s.products.FindByProductID(item.ProductID)
		if err != nil {
			continue
		}
		summary.Items = append(summary.Items, CartView{
			ProductID: item.ProductID,
			Qty:       item.Qty,
			Variant:   item.Variant,
			Selected:  item.Selected,
			Product:   *product,
		})
		summary.Count += item.Qty
		if item.Selected {
			summary.Subtotal += product.Harga * int64(item.Qty)
		}
	}
	return summary, nil
}

func (s *PlatformService) AddCart(userID string, input CartInput) (*CartSummary, error) {
	if strings.TrimSpace(input.ProductID) == "" || input.Qty <= 0 {
		return nil, fmt.Errorf("%w: product_id dan qty valid wajib diisi", ErrBadRequest)
	}
	product, err := s.products.FindByProductID(input.ProductID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if !product.StatusAktif || product.Stok <= 0 {
		return nil, fmt.Errorf("%w: produk tidak tersedia", ErrBadRequest)
	}
	currentQty := 0
	if item, err := s.cart.FindByUserProduct(userID, input.ProductID); err == nil {
		currentQty = item.Qty
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if currentQty+input.Qty > product.Stok {
		return nil, fmt.Errorf("%w: stok %s tidak cukup", ErrBadRequest, product.NamaProduk)
	}
	if _, err := s.cart.Upsert(userID, input.ProductID, input.Variant, input.Qty); err != nil {
		return nil, err
	}
	return s.Cart(userID)
}

func (s *PlatformService) UpdateCart(userID string, input CartInput) (*CartSummary, error) {
	if strings.TrimSpace(input.ProductID) == "" {
		return nil, fmt.Errorf("%w: product_id wajib diisi", ErrBadRequest)
	}
	if input.Qty <= 0 {
		if err := s.cart.Remove(userID, input.ProductID); err != nil {
			return nil, err
		}
		return s.Cart(userID)
	}
	product, err := s.products.FindByProductID(input.ProductID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if !product.StatusAktif || product.Stok <= 0 {
		return nil, fmt.Errorf("%w: produk tidak tersedia", ErrBadRequest)
	}
	if input.Qty > product.Stok {
		return nil, fmt.Errorf("%w: stok %s tidak cukup", ErrBadRequest, product.NamaProduk)
	}
	if _, err := s.cart.Update(userID, input.ProductID, input.Qty, input.Selected); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return s.Cart(userID)
}

func (s *PlatformService) RemoveCart(userID, productID string) (*CartSummary, error) {
	if strings.TrimSpace(productID) == "" {
		return nil, fmt.Errorf("%w: product_id wajib diisi", ErrBadRequest)
	}
	if err := s.cart.Remove(userID, productID); err != nil {
		return nil, err
	}
	return s.Cart(userID)
}

func (s *PlatformService) SyncCart(userID string, input CartSyncInput) (*CartSummary, error) {
	for _, item := range input.Items {
		if strings.TrimSpace(item.ProductID) == "" || item.Qty <= 0 {
			continue
		}
		if _, err := s.AddCart(userID, item); err != nil {
			if errors.Is(err, ErrNotFound) || errors.Is(err, ErrBadRequest) {
				continue
			}
			return nil, err
		}
		if item.Selected != nil {
			current, err := s.cart.FindByUserProduct(userID, item.ProductID)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			qty := item.Qty
			if current != nil {
				qty = current.Qty
			}
			if _, err := s.UpdateCart(userID, CartInput{ProductID: item.ProductID, Qty: qty, Selected: item.Selected}); err != nil && !errors.Is(err, ErrNotFound) {
				return nil, err
			}
		}
	}
	return s.Cart(userID)
}

func (s *PlatformService) CheckoutCart(userID string, input CartCheckoutInput, authorization string) (*models.Order, error) {
	cart, err := s.Cart(userID)
	if err != nil {
		return nil, err
	}
	selected := make([]CartView, 0)
	for _, item := range cart.Items {
		if item.Selected {
			selected = append(selected, item)
		}
	}
	if len(selected) == 0 {
		return nil, fmt.Errorf("%w: pilih minimal satu produk di cart", ErrBadRequest)
	}

	address, err := s.addresses.FindByAddressID(input.AddressID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if address.UserID != userID {
		return nil, fmt.Errorf("%w: alamat bukan milik user aktif", ErrBadRequest)
	}

	subtotal := int64(0)
	items := make([]models.OrderItem, 0, len(selected))
	for _, view := range selected {
		if !view.Product.StatusAktif || view.Product.Stok < view.Qty {
			return nil, fmt.Errorf("%w: stok %s tidak cukup", ErrBadRequest, view.Product.NamaProduk)
		}
		lineTotal := view.Product.Harga * int64(view.Qty)
		subtotal += lineTotal
		items = append(items, models.OrderItem{
			ProductID:  view.Product.ProductID,
			SellerID:   view.Product.SellerID,
			StoreID:    view.Product.StoreID,
			NamaProduk: view.Product.NamaProduk,
			Harga:      view.Product.Harga,
			Qty:        view.Qty,
			Variant:    view.Variant,
			LineTotal:  lineTotal,
		})
	}

	shippingCourier := strings.TrimSpace(input.Shipping.Carrier)
	if shippingCourier == "" {
		shippingCourier = "JNE"
	}
	shippingService := strings.TrimSpace(input.Shipping.Service)
	if shippingService == "" {
		shippingService = "REG"
	}
	shippingCost := CalculateShippingCost(shippingCourier, shippingService, selected)
	discount := int64(0)
	if strings.TrimSpace(input.VoucherCode) != "" {
		preview, err := s.ApplyVoucher(input.VoucherCode, subtotal)
		if err != nil {
			return nil, err
		}
		if preview.Eligible {
			discount = preview.DiscountAmount
		}
	}

	fee := CalculateMarketplaceFee(subtotal)
	totalBeforeGateway := subtotal + fee + shippingCost - discount
	gatewayFee := CalculateGatewayFee(totalBeforeGateway)
	total := totalBeforeGateway + gatewayFee
	if total < 0 {
		total = 0
	}
	orderID := newOrderID()
	for index := range items {
		items[index].OrderIDRef = orderID
	}
	addressText := fmt.Sprintf("%s, %s, %s %s", address.AddressLine, address.City, address.Province, address.PostalCode)

	payment := s.integration.SendPaymentRequest(PaymentRequest{
		OrderID:          orderID,
		UserID:           userID,
		FromUser:         userID,
		ToUserService:    "MARKETPLACE_ESCROW",
		Amount:           total,
		MarketplaceFee:   fee,
		Metadata:         "Marketplace PasarKita cart checkout",
		AlamatPengiriman: addressText,
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
		UserID:            userID,
		StatusOrder:       status,
		Subtotal:          subtotal,
		MarketplaceFee:    fee,
		GatewayFee:        gatewayFee,
		TotalBayar:        total,
		PaymentRequestID:  payment.PaymentRequestID,
		AddressID:         address.AddressID,
		AlamatPengiriman:  addressText,
		ShippingCourier:   shippingCourier,
		ShippingService:   shippingService,
		ShippingCost:      shippingCost,
		VoucherCode:       strings.ToUpper(strings.TrimSpace(input.VoucherCode)),
		DiscountAmount:    discount,
		PaymentMethod:     strings.TrimSpace(input.Payment.ID),
		InvoiceNumber:     "INV/" + time.Now().Format("20060102") + "/" + strings.TrimPrefix(orderID, "ORD-"),
		IntegrationStatus: payment.Status,
		Items:             items,
	}

	if err := s.orders.Create(order); err != nil {
		return nil, err
	}
	if err := s.cart.ClearSelected(userID); err != nil {
		return nil, err
	}
	_ = s.data.SaveShipment(&models.Shipment{
		ShipmentID:    newShipmentID(),
		OrderIDRef:    orderID,
		Courier:       shippingCourier,
		Service:       shippingService,
		Status:        "WAITING_PICKUP",
		ShippingCost:  shippingCost,
		EstimatedDays: "2-4 hari",
	})
	_ = s.data.SaveNotification(&models.Notification{
		NotificationID: newNotificationID(),
		UserID:         userID,
		Title:          "Order dibuat",
		Body:           "Order " + orderID + " menunggu proses pembayaran.",
		Type:           "order",
	})
	s.auditLogs.Create(models.AuditLog{Method: "POST", Path: "/marketplace/cart/checkout", UserID: userID, StatusCode: 201, Message: "cart order created"})
	return order, nil
}

func (s *PlatformService) CalculateCheckout(userID string, input CartCheckoutInput) (*CheckoutEstimate, error) {
	cart, err := s.Cart(userID)
	if err != nil {
		return nil, err
	}
	selected := make([]CartView, 0)
	for _, item := range cart.Items {
		if item.Selected {
			selected = append(selected, item)
		}
	}
	if len(selected) == 0 {
		return nil, fmt.Errorf("%w: pilih minimal satu produk di cart", ErrBadRequest)
	}
	if strings.TrimSpace(input.AddressID) != "" {
		address, err := s.addresses.FindByAddressID(input.AddressID)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, err
		}
		if address.UserID != userID {
			return nil, fmt.Errorf("%w: alamat bukan milik user aktif", ErrBadRequest)
		}
	}

	subtotal := int64(0)
	count := 0
	for _, view := range selected {
		if !view.Product.StatusAktif || view.Product.Stok < view.Qty {
			return nil, fmt.Errorf("%w: stok %s tidak cukup", ErrBadRequest, view.Product.NamaProduk)
		}
		subtotal += view.Product.Harga * int64(view.Qty)
		count += view.Qty
	}

	shippingCourier := strings.TrimSpace(input.Shipping.Carrier)
	if shippingCourier == "" {
		shippingCourier = "JNE"
	}
	shippingService := strings.TrimSpace(input.Shipping.Service)
	if shippingService == "" {
		shippingService = "REG"
	}
	shippingCost := CalculateShippingCost(shippingCourier, shippingService, selected)
	discount := int64(0)
	if strings.TrimSpace(input.VoucherCode) != "" {
		preview, err := s.ApplyVoucher(input.VoucherCode, subtotal)
		if err != nil {
			return nil, err
		}
		if preview.Eligible {
			discount = preview.DiscountAmount
		}
	}
	fee := CalculateMarketplaceFee(subtotal)
	totalBeforeGateway := subtotal + fee + shippingCost - discount
	gatewayFee := CalculateGatewayFee(totalBeforeGateway)
	total := totalBeforeGateway + gatewayFee
	if total < 0 {
		total = 0
	}

	return &CheckoutEstimate{
		Items:      selected,
		Subtotal:   subtotal,
		Discount:   discount,
		Shipping:   ShippingChoice{ID: shippingCourier + "-" + shippingService, Name: shippingCourier + " " + shippingService, Carrier: shippingCourier, Service: shippingService, Price: shippingCost},
		Payment:    PaymentChoice{ID: input.Payment.ID, Name: paymentChoiceName(input.Payment.ID), Fee: gatewayFee},
		ServiceFee: fee,
		Total:      total,
		Count:      count,
	}, nil
}

func (s *PlatformService) ListOrders(userID string) ([]models.Order, error) {
	return s.orders.ListByUser(userID)
}

func (s *PlatformService) ListSellerOrders(sellerID string) ([]models.Order, error) {
	return s.orders.ListBySeller(sellerID)
}

func (s *PlatformService) ListSellerProducts(sellerID string) ([]models.Product, error) {
	return s.products.ListBySeller(sellerID)
}

func (s *PlatformService) SaveSellerProduct(sellerID string, input ProductInput) (*models.Product, error) {
	store, err := s.stores.FindBySellerID(sellerID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("%w: toko seller belum tersedia", ErrNotFound)
	}
	if err != nil {
		return nil, err
	}
	input.SellerID = sellerID
	input.StoreID = store.StoreID
	input.Lokasi = store.Location
	input.normalize()
	if strings.TrimSpace(input.NamaProduk) == "" || strings.TrimSpace(input.Kategori) == "" || strings.TrimSpace(input.Deskripsi) == "" {
		return nil, fmt.Errorf("%w: nama, kategori, dan deskripsi produk wajib diisi", ErrBadRequest)
	}
	if input.Harga < 1000 || input.Stok < 0 {
		return nil, fmt.Errorf("%w: harga minimal 1000 dan stok tidak boleh negatif", ErrBadRequest)
	}
	product := &models.Product{ProductID: input.ProductID}
	if product.ProductID == "" {
		product.ProductID = newProductID()
	}
	product.SellerID = sellerID
	product.StoreID = store.StoreID
	product.NamaProduk = input.NamaProduk
	product.Deskripsi = input.Deskripsi
	product.Harga = input.Harga
	product.OriginalPrice = input.OriginalPrice
	product.Discount = input.Discount
	product.Stok = input.Stok
	product.CategoryID = input.CategoryID
	product.Kategori = input.Kategori
	product.ImageURL = input.ImageURL
	product.Variants = input.Variants
	product.Featured = input.Featured
	product.Highlights = input.Highlights
	product.BeratGram = input.BeratGram
	if product.BeratGram <= 0 {
		product.BeratGram = 500
	}
	product.Kondisi = input.Kondisi
	if product.Kondisi == "" {
		product.Kondisi = "Baru"
	}
	product.Lokasi = store.Location
	product.StatusAktif = true
	if err := s.products.Save(product); err != nil {
		return nil, err
	}
	product.Store = *store
	return product, nil
}

func (s *PlatformService) SellerDashboard(sellerID string) (fiberMap, error) {
	products, err := s.products.ListBySeller(sellerID)
	if err != nil {
		return nil, err
	}
	orders, err := s.orders.ListBySeller(sellerID)
	if err != nil {
		return nil, err
	}
	store, _ := s.stores.FindBySellerID(sellerID)
	revenue := int64(0)
	orderViews := make([]fiberMap, 0, len(orders))
	for _, order := range orders {
		revenue += order.TotalBayar
		orderViews = append(orderViews, fiberMap{
			"id": order.OrderID, "buyer": order.UserID, "total": order.TotalBayar,
			"status": frontendOrderStatus(order.StatusOrder), "createdAt": order.CreatedAt,
		})
	}
	rating := float64(0)
	if store != nil {
		rating = store.RatingAverage
	}
	return fiberMap{
		"stats":         fiberMap{"revenue": revenue, "orders": len(orders), "products": len(products), "rating": rating},
		"weeklySales":   []int64{4200000, 5800000, 4600000, 7200000, 6400000, 8800000, revenue},
		"categorySales": []int{48, 24, 18, 10},
		"products":      products,
		"orders":        orderViews,
	}, nil
}

func (s *PlatformService) CancelOrder(userID, orderID, reason string) (*models.Order, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if order.UserID != userID {
		return nil, fmt.Errorf("%w: order bukan milik user aktif", ErrBadRequest)
	}
	if order.StatusOrder == models.StatusCompleted || order.StatusOrder == models.StatusShipped {
		return nil, fmt.Errorf("%w: order tidak bisa dibatalkan pada status ini", ErrBadRequest)
	}
	order.StatusOrder = models.StatusCancelled
	order.CancelReason = strings.TrimSpace(reason)
	if order.CancelReason == "" {
		order.CancelReason = "Dibatalkan oleh pembeli"
	}
	if err := s.orders.Save(order); err != nil {
		return nil, err
	}
	return order, nil
}

func (s *PlatformService) UpdateSellerOrderStatus(sellerID, orderID, status string) (*models.Order, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	owns, err := s.orders.SellerOwnsOrder(sellerID, orderID)
	if err != nil {
		return nil, err
	}
	if !owns {
		return nil, fmt.Errorf("%w: order bukan milik seller aktif", ErrBadRequest)
	}

	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "READY_FOR_SHIPMENT", "PACKED", "SIAP_DIKIRIM":
		order.StatusOrder = models.StatusReadyForShipment
	case "SHIPPED", "DIKIRIM":
		order.StatusOrder = models.StatusShipped
	default:
		return nil, fmt.Errorf("%w: status order tidak valid", ErrBadRequest)
	}
	if err := s.orders.Save(order); err != nil {
		return nil, err
	}
	return order, nil
}

func (s *PlatformService) OrderTracking(userID, orderID string) (fiberMap, error) {
	order, err := s.orders.FindByOrderID(orderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	owns := order.UserID == userID
	if !owns {
		owns, err = s.orders.SellerOwnsOrder(userID, orderID)
		if err != nil {
			return nil, err
		}
	}
	if !owns {
		return nil, fmt.Errorf("%w: order bukan milik user aktif", ErrBadRequest)
	}

	shipment, err := s.data.FindShipmentByOrderID(orderID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return fiberMap{"order_id": orderID, "status": order.StatusOrder}, nil
	}
	if err != nil {
		return nil, err
	}
	return fiberMap{
		"order_id":        orderID,
		"status":          shipment.Status,
		"courier":         shipment.Courier,
		"service":         shipment.Service,
		"tracking_number": shipment.TrackingNumber,
		"shipping_cost":   shipment.ShippingCost,
		"estimated_days":  shipment.EstimatedDays,
	}, nil
}

func (s *PlatformService) ListStores() ([]models.Store, error) {
	return s.stores.List()
}

func (s *PlatformService) Categories() []fiberMap {
	return []fiberMap{
		{"id": "elektronik", "name": "Elektronik", "icon": "smartphone", "color": "#e8f0ff", "description": "Gadget pintar untuk aktivitas harian"},
		{"id": "fashion", "name": "Fashion", "icon": "shirt", "color": "#fff0f5", "description": "Gaya nyaman untuk setiap suasana"},
		{"id": "makanan", "name": "Makanan", "icon": "utensils", "color": "#fff5e5", "description": "Camilan dan bahan pangan pilihan"},
		{"id": "kesehatan", "name": "Kesehatan", "icon": "heart-pulse", "color": "#e9fbf2", "description": "Perawatan diri dan hidup sehat"},
		{"id": "rumah-tangga", "name": "Rumah Tangga", "icon": "house", "color": "#eff8ff", "description": "Solusi praktis untuk rumah"},
		{"id": "aksesoris", "name": "Aksesoris", "icon": "watch", "color": "#f5efff", "description": "Detail kecil penyempurna gaya"},
		{"id": "buku", "name": "Buku", "icon": "book-open", "color": "#fff7df", "description": "Bacaan, jurnal, dan alat tulis"},
		{"id": "olahraga", "name": "Olahraga", "icon": "dumbbell", "color": "#eafaf8", "description": "Perlengkapan untuk tetap aktif"},
	}
}

func (s *PlatformService) GetStore(storeID string) (*models.Store, []models.Product, error) {
	store, err := s.stores.FindByStoreID(storeID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, ErrNotFound
	}
	if err != nil {
		return nil, nil, err
	}
	products, err := s.products.ListBySeller(store.SellerID)
	return store, products, err
}

func (s *PlatformService) MyStore(sellerID string) (*models.Store, error) {
	store, err := s.stores.FindBySellerID(sellerID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return store, err
}

func (s *PlatformService) ListVouchers() ([]models.Voucher, error) {
	return s.data.ListVouchers()
}

func (s *PlatformService) ApplyVoucher(code string, subtotal int64) (*VoucherPreview, error) {
	voucher, err := s.data.FindVoucher(code)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	preview := &VoucherPreview{Code: voucher.Code, Subtotal: subtotal}
	if !voucher.Active || (voucher.ExpiredAt != nil && voucher.ExpiredAt.Before(time.Now())) {
		preview.Message = "Voucher tidak aktif"
		return preview, nil
	}
	if subtotal < voucher.MinSpend {
		preview.Message = "Minimal belanja belum terpenuhi"
		return preview, nil
	}
	discount := voucher.DiscountValue
	if voucher.DiscountType == "PERCENT" {
		discount = subtotal * voucher.DiscountValue / 100
	}
	if voucher.MaxDiscount > 0 && discount > voucher.MaxDiscount {
		discount = voucher.MaxDiscount
	}
	preview.DiscountAmount = discount
	preview.Eligible = true
	preview.Message = "Voucher bisa digunakan"
	return preview, nil
}

func (s *PlatformService) ShippingOptions(_ string, qty int) []fiberMap {
	weightMultiplier := int64(qty)
	if weightMultiplier <= 0 {
		weightMultiplier = 1
	}
	base := int64(9000) + weightMultiplier*1000
	return []fiberMap{
		{"id": "JNE-REG", "name": "JNE REG", "carrier": "JNE", "service": "REG", "price": base, "eta": "2-4 hari"},
		{"id": "JNE-YES", "name": "JNE YES", "carrier": "JNE", "service": "YES", "price": base + 8000, "eta": "1 hari"},
		{"id": "SiCepat-HALU", "name": "SiCepat HALU", "carrier": "SiCepat", "service": "HALU", "price": base - 1000, "eta": "2-5 hari"},
	}
}

func (s *PlatformService) ListReviews(productID string) ([]models.Review, error) {
	return s.data.ListReviews(productID)
}

func (s *PlatformService) CreateReview(userID, productID string, rating int, comment string) (*models.Review, error) {
	if rating < 1 || rating > 5 {
		return nil, fmt.Errorf("%w: rating harus 1 sampai 5", ErrBadRequest)
	}
	review := &models.Review{ReviewID: newReviewID(), ProductID: productID, UserID: userID, Rating: rating, Comment: strings.TrimSpace(comment)}
	if err := s.data.SaveReview(review); err != nil {
		return nil, err
	}
	reviews, _ := s.data.ListReviews(productID)
	total := 0
	for _, item := range reviews {
		total += item.Rating
	}
	if product, err := s.products.FindByProductID(productID); err == nil && len(reviews) > 0 {
		product.ReviewCount = len(reviews)
		product.RatingAvg = float64(total) / float64(len(reviews))
		_ = s.products.Save(product)
	}
	return review, nil
}

func (s *PlatformService) ListDiscussions(productID string) ([]models.ProductDiscussion, error) {
	return s.data.ListDiscussions(productID)
}

func (s *PlatformService) CreateDiscussion(userID, productID, message string) (*models.ProductDiscussion, error) {
	if strings.TrimSpace(message) == "" {
		return nil, fmt.Errorf("%w: message wajib diisi", ErrBadRequest)
	}
	discussion := &models.ProductDiscussion{DiscussionID: newDiscussionID(), ProductID: productID, UserID: userID, Message: strings.TrimSpace(message)}
	if err := s.data.SaveDiscussion(discussion); err != nil {
		return nil, err
	}
	return discussion, nil
}

func (s *PlatformService) ListChat(userID string) ([]models.ChatMessage, error) {
	messages, err := s.data.ListChat(userID)
	if err != nil {
		return nil, err
	}
	sort.Slice(messages, func(i, j int) bool { return messages[i].CreatedAt.Before(messages[j].CreatedAt) })
	return messages, nil
}

func (s *PlatformService) SendChat(senderID, receiverID, productID, body string) (*models.ChatMessage, error) {
	if strings.TrimSpace(receiverID) == "" || strings.TrimSpace(body) == "" {
		return nil, fmt.Errorf("%w: receiver_id dan body wajib diisi", ErrBadRequest)
	}
	conversationParts := []string{senderID, receiverID}
	sort.Strings(conversationParts)
	conversationID := strings.Join(conversationParts, ":")
	message := &models.ChatMessage{MessageID: newMessageID(), ConversationID: conversationID, SenderID: senderID, ReceiverID: receiverID, ProductID: productID, Body: strings.TrimSpace(body)}
	if err := s.data.SaveChat(message); err != nil {
		return nil, err
	}
	_ = s.data.SaveNotification(&models.Notification{NotificationID: newNotificationID(), UserID: receiverID, Title: "Pesan baru", Body: "Ada pesan baru di chat PasarKita.", Type: "chat"})
	return message, nil
}

func (s *PlatformService) ListNotifications(userID string) ([]models.Notification, error) {
	return s.data.ListNotifications(userID)
}

func (s *PlatformService) MarkNotificationRead(userID, notificationID string) error {
	return s.data.MarkNotificationRead(userID, notificationID)
}

type fiberMap map[string]any

func CalculateShippingCost(courier, service string, items []CartView) int64 {
	totalQty := int64(0)
	for _, item := range items {
		totalQty += int64(item.Qty)
	}
	if totalQty <= 0 {
		totalQty = 1
	}
	cost := int64(9000) + totalQty*1000
	if strings.EqualFold(service, "YES") {
		cost += 8000
	}
	if strings.EqualFold(courier, "SiCepat") {
		cost -= 1000
	}
	return cost
}

func frontendOrderStatus(status string) string {
	switch status {
	case models.StatusPaymentProcess, models.StatusPaid:
		return "Pembayaran Diproses"
	case models.StatusReadyForShipment:
		return "Pesanan Dikemas"
	case models.StatusShipped:
		return "Pesanan Dikirim"
	case models.StatusCompleted:
		return "Pesanan Selesai"
	case models.StatusCancelled:
		return "Pesanan Dibatalkan"
	case models.StatusPaymentFailed:
		return "Pembayaran Gagal"
	default:
		return "Menunggu Pembayaran"
	}
}

func newAddressID() string      { return "ADDR-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
func newShipmentID() string     { return "SHP-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
func newNotificationID() string { return "NTF-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
func newReviewID() string       { return "REV-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
func newDiscussionID() string   { return "DSC-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
func newMessageID() string      { return "MSG-" + strconv.FormatInt(time.Now().UnixNano(), 10) }
