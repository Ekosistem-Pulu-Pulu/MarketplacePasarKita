package routes

import (
	"os"

	"github.com/gofiber/contrib/swagger"
	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/controllers"
	"pasarkita-marketplace-backend/middleware"
	"pasarkita-marketplace-backend/repositories"
)

func Register(app *fiber.App, cfg config.Config, marketplace *controllers.MarketplaceController, auth *controllers.AuthController, account *controllers.AccountController, platform *controllers.PlatformController, auditRepo *repositories.AuditLogRepository) {
	// Setup Swagger UI middleware
	swaggerPath := "./docs/openapi.yaml"
	if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
		if _, err2 := os.Stat("./backend/docs/openapi.yaml"); err2 == nil {
			swaggerPath = "./backend/docs/openapi.yaml"
		}
	}

	app.Use(swagger.New(swagger.Config{
		BasePath: "/",
		FilePath: swaggerPath,
		Path:     "docs",
		Title:    "PasarKita Marketplace API Docs",
	}))

	app.Get("/", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{
			"service": "Marketplace PasarKita",
			"role":    "B2C demand generator dalam ekosistem UMKM",
			"rules": []string{
				"Marketplace tidak mengubah saldo langsung",
				"Transaksi finansial dikirim ke SmartBank melalui API Gateway",
				"Fee marketplace 2% dihitung saat checkout",
			},
			"endpoints": []string{
				"GET /marketplace/browse_produk",
				"POST /marketplace/manajemen_produk",
				"POST /marketplace/checkout",
				"POST /marketplace/integrasi_pembayaran",
				"GET /marketplace/status_order?order_id={order_id}",
				"GET /marketplace/biaya_layanan_marketplace?subtotal={subtotal}",
			},
		})
	})

	app.Get("/health", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{"status": "ok", "service": "marketplace"})
	})

	app.Get("/marketplace/logging", func(ctx *fiber.Ctx) error {
		logs, err := auditRepo.Latest(50)
		if err != nil {
			return err
		}
		return ctx.JSON(fiber.Map{"status": "success", "data": logs})
	})

	authGroup := app.Group("/auth")
	authGroup.Post("/login", auth.Login)
	authGroup.Get("/me", auth.Me)
	authGroup.Get("/accounts", auth.AccountUsers)

	accountGroup := app.Group("/account", middleware.OptionalAuth(cfg), middleware.RequestLogger(auditRepo))
	accountGroup.Post("/register", account.Register)
	accountGroup.Get("/me", account.Me)
	accountGroup.Patch("/me", account.UpdateProfile)
	accountGroup.Get("/addresses", account.ListAddresses)
	accountGroup.Post("/addresses", account.SaveAddress)

	marketplaceGroup := app.Group("/marketplace", middleware.OptionalAuth(cfg), middleware.RequestLogger(auditRepo))
	marketplaceGroup.Get("/browse_produk", marketplace.BrowseProducts)
	marketplaceGroup.Get("/categories", platform.Categories)
	marketplaceGroup.Get("/products/:id", marketplace.GetProduct)
	marketplaceGroup.Get("/seller/products", platform.ListSellerProducts)
	marketplaceGroup.Post("/seller/products", platform.SaveSellerProduct)
	marketplaceGroup.Get("/seller/dashboard", platform.SellerDashboard)
	marketplaceGroup.Post("/manajemen_produk", marketplace.SaveProduct)
	marketplaceGroup.Patch("/products/:id/status", marketplace.SetProductStatus)
	marketplaceGroup.Post("/checkout", marketplace.Checkout)
	marketplaceGroup.Post("/integrasi_pembayaran", marketplace.IntegratePayment)
	marketplaceGroup.Get("/status_order", marketplace.GetOrderStatus)
	marketplaceGroup.Get("/biaya_layanan_marketplace", marketplace.GetMarketplaceFee)
	marketplaceGroup.Get("/cart", platform.Cart)
	marketplaceGroup.Post("/cart", platform.AddCart)
	marketplaceGroup.Post("/cart/sync", platform.SyncCart)
	marketplaceGroup.Patch("/cart/:product_id", platform.UpdateCart)
	marketplaceGroup.Delete("/cart/:product_id", platform.RemoveCart)
	marketplaceGroup.Post("/checkout/calculate", platform.CalculateCheckout)
	marketplaceGroup.Post("/cart/checkout", platform.CheckoutCart)
	marketplaceGroup.Get("/orders", platform.ListOrders)
	marketplaceGroup.Patch("/orders/:id/cancel", platform.CancelOrder)
	marketplaceGroup.Get("/orders/:id/tracking", platform.OrderTracking)
	marketplaceGroup.Get("/orders/:id", marketplace.GetOrderStatus)
	marketplaceGroup.Get("/seller/orders", platform.ListSellerOrders)
	marketplaceGroup.Patch("/seller/orders/:id/status", platform.UpdateSellerOrderStatus)
	marketplaceGroup.Get("/stores", platform.ListStores)
	marketplaceGroup.Get("/stores/me", platform.MyStore)
	marketplaceGroup.Get("/stores/:id", platform.GetStore)
	marketplaceGroup.Get("/vouchers", platform.ListVouchers)
	marketplaceGroup.Get("/vouchers/:code/apply", platform.ApplyVoucher)
	marketplaceGroup.Get("/shipping/options", platform.ShippingOptions)
	marketplaceGroup.Get("/products/:product_id/reviews", platform.ListReviews)
	marketplaceGroup.Post("/products/:product_id/reviews", platform.CreateReview)
	marketplaceGroup.Get("/products/:product_id/discussions", platform.ListDiscussions)
	marketplaceGroup.Post("/products/:product_id/discussions", platform.CreateDiscussion)
	marketplaceGroup.Get("/chat", platform.ListChat)
	marketplaceGroup.Post("/chat", platform.SendChat)
	marketplaceGroup.Get("/notifications", platform.ListNotifications)
	marketplaceGroup.Patch("/notifications/:id/read", platform.MarkNotificationRead)
}
