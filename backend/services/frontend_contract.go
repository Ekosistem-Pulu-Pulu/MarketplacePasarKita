package services

import (
	"time"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

type FrontendAddress struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Recipient string `json:"recipient"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
}

type FrontendOrderItem struct {
	ProductID string         `json:"productId"`
	Qty       int            `json:"qty"`
	Variant   string         `json:"variant"`
	Selected  bool           `json:"selected"`
	Product   models.Product `json:"product"`
}

type FrontendOrderTotals struct {
	Subtotal   int64          `json:"subtotal"`
	Discount   int64          `json:"discount"`
	ServiceFee int64          `json:"serviceFee"`
	Shipping   ShippingChoice `json:"shipping"`
	Payment    PaymentChoice  `json:"payment"`
	Total      int64          `json:"total"`
}

type FrontendOrder struct {
	ID        string              `json:"id"`
	Buyer     string              `json:"buyer"`
	CreatedAt time.Time           `json:"createdAt"`
	UpdatedAt time.Time           `json:"updatedAt"`
	Status    string              `json:"status"`
	Items     []FrontendOrderItem `json:"items"`
	Totals    FrontendOrderTotals `json:"totals"`
	Payment   PaymentChoice       `json:"payment"`
	Shipping  ShippingChoice      `json:"shipping"`
	Address   FrontendAddress     `json:"address"`
}

func paymentChoiceName(id string) string {
	switch id {
	case "cod":
		return "Bayar di Tempat"
	case "ewallet":
		return "E-Wallet"
	default:
		return "Virtual Account"
	}
}

func presentOrder(order *models.Order, products *repositories.ProductRepository) FrontendOrder {
	items := make([]FrontendOrderItem, 0, len(order.Items))
	for _, item := range order.Items {
		product, err := products.FindByProductID(item.ProductID)
		if err != nil {
			product = &models.Product{
				ProductID:  item.ProductID,
				NamaProduk: item.NamaProduk,
				Harga:      item.Harga,
				Stok:       item.Qty,
				Store:      models.Store{StoreID: item.StoreID, Name: "Toko PasarKita", Location: "Indonesia"},
			}
		}
		items = append(items, FrontendOrderItem{
			ProductID: item.ProductID,
			Qty:       item.Qty,
			Variant:   item.Variant,
			Selected:  true,
			Product:   *product,
		})
	}
	payment := PaymentChoice{ID: order.PaymentMethod, Name: paymentChoiceName(order.PaymentMethod), Fee: order.GatewayFee}
	shipping := ShippingChoice{
		ID:      order.ShippingCourier + "-" + order.ShippingService,
		Name:    order.ShippingCourier + " " + order.ShippingService,
		Carrier: order.ShippingCourier,
		Service: order.ShippingService,
		Price:   order.ShippingCost,
	}
	return FrontendOrder{
		ID:        order.OrderID,
		Buyer:     order.UserID,
		CreatedAt: order.CreatedAt,
		UpdatedAt: order.UpdatedAt,
		Status:    frontendOrderStatus(order.StatusOrder),
		Items:     items,
		Totals: FrontendOrderTotals{
			Subtotal:   order.Subtotal,
			Discount:   order.DiscountAmount,
			ServiceFee: order.MarketplaceFee,
			Shipping:   ShippingChoice{Price: order.ShippingCost},
			Payment:    PaymentChoice{Fee: order.GatewayFee},
			Total:      order.TotalBayar,
		},
		Payment:  payment,
		Shipping: shipping,
		Address: FrontendAddress{
			ID:      order.AddressID,
			Label:   "Rumah",
			Address: order.AlamatPengiriman,
		},
	}
}

func presentOrders(orders []models.Order, products *repositories.ProductRepository) []FrontendOrder {
	result := make([]FrontendOrder, 0, len(orders))
	for index := range orders {
		result = append(result, presentOrder(&orders[index], products))
	}
	return result
}

func (s *PlatformService) PresentOrder(order *models.Order) FrontendOrder {
	return presentOrder(order, s.products)
}

func (s *PlatformService) PresentOrders(orders []models.Order) []FrontendOrder {
	return presentOrders(orders, s.products)
}

func (s *MarketplaceService) PresentOrder(order *models.Order) FrontendOrder {
	return presentOrder(order, s.products)
}
