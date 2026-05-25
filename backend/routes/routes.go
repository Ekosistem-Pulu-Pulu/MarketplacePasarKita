package routes

import (
	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/controllers"
	"pasarkita-marketplace-backend/middleware"
	"pasarkita-marketplace-backend/repositories"
)

func Register(app *fiber.App, cfg config.Config, marketplace *controllers.MarketplaceController, auth *controllers.AuthController, auditRepo *repositories.AuditLogRepository) {
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
	authGroup.Get("/demo-users", auth.DemoUsers)

	marketplaceGroup := app.Group("/marketplace", middleware.OptionalAuth(cfg), middleware.RequestLogger(auditRepo))
	marketplaceGroup.Get("/browse_produk", marketplace.BrowseProducts)
	marketplaceGroup.Get("/products/:id", marketplace.GetProduct)
	marketplaceGroup.Get("/seller/products", marketplace.ListSellerProducts)
	marketplaceGroup.Post("/manajemen_produk", marketplace.SaveProduct)
	marketplaceGroup.Patch("/products/:id/status", marketplace.SetProductStatus)
	marketplaceGroup.Post("/checkout", marketplace.Checkout)
	marketplaceGroup.Post("/integrasi_pembayaran", marketplace.IntegratePayment)
	marketplaceGroup.Get("/status_order", marketplace.GetOrderStatus)
	marketplaceGroup.Get("/orders/:id", marketplace.GetOrderStatus)
	marketplaceGroup.Get("/biaya_layanan_marketplace", marketplace.GetMarketplaceFee)
}
