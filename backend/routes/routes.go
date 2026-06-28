package routes

import (
	"os"
	"time"

	"github.com/gofiber/contrib/swagger"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/controllers"
	"pasarkita-marketplace-backend/middleware"
	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
	"pasarkita-marketplace-backend/services"
)

func Register(app *fiber.App, cfg config.Config, authService *services.AuthService, marketplace *controllers.MarketplaceController, auth *controllers.AuthController, account *controllers.AccountController, platform *controllers.PlatformController, auditRepo *repositories.AuditLogRepository) {
	if cfg.EnableDocs {
		swaggerPath := "./docs/openapi.yaml"
		if _, err := os.Stat(swaggerPath); os.IsNotExist(err) {
			if _, err2 := os.Stat("./backend/docs/openapi.yaml"); err2 == nil {
				swaggerPath = "./backend/docs/openapi.yaml"
			}
		}
		app.Use(swagger.New(swagger.Config{BasePath: "/", FilePath: swaggerPath, Path: "docs", Title: "PasarKita Marketplace API Docs"}))
	}

	app.Get("/", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{"service": "Marketplace PasarKita", "status": "ok"})
	})
	app.Get("/health", func(ctx *fiber.Ctx) error {
		return ctx.JSON(fiber.Map{"status": "ok", "service": "marketplace"})
	})

	authRequired := middleware.Authenticate(authService)
	authLimiter := limiter.New(limiter.Config{
		Max: cfg.AuthRateLimitMax, Expiration: time.Minute,
		LimitReached: func(ctx *fiber.Ctx) error {
			return fiber.NewError(fiber.StatusTooManyRequests, "terlalu banyak percobaan autentikasi")
		},
	})

	authGroup := app.Group("/auth")
	authGroup.Post("/login", authLimiter, auth.Login)
	authGroup.Post("/refresh", authLimiter, auth.Refresh)
	authGroup.Post("/logout", authLimiter, auth.Logout)
	authGroup.Get("/me", authRequired, auth.Me)
	authGroup.Get("/accounts", authRequired, middleware.RequireRoles(models.RolePlatformAdmin), auth.AccountUsers)

	app.Get("/marketplace/logging", authRequired, middleware.RequireRoles(models.RolePlatformAdmin, models.RoleTechMaintainer), middleware.RequestLogger(auditRepo), func(ctx *fiber.Ctx) error {
		logs, err := auditRepo.Latest(50)
		if err != nil {
			return err
		}
		return ctx.JSON(fiber.Map{"status": "success", "data": logs})
	})

	accountGroup := app.Group("/account")
	accountGroup.Post("/register", authLimiter, account.Register)
	accountGroup.Get("/me", authRequired, middleware.RequestLogger(auditRepo), account.Me)
	accountGroup.Patch("/me", authRequired, middleware.RequestLogger(auditRepo), account.UpdateProfile)
	accountGroup.Get("/addresses", authRequired, middleware.RequireRoles(models.RoleBuyer), middleware.RequestLogger(auditRepo), account.ListAddresses)
	accountGroup.Post("/addresses", authRequired, middleware.RequireRoles(models.RoleBuyer), middleware.RequestLogger(auditRepo), account.SaveAddress)

	public := app.Group("/marketplace")
	public.Get("/browse_produk", marketplace.BrowseProducts)
	public.Get("/categories", platform.Categories)
	public.Get("/products/:id", marketplace.GetProduct)
	public.Get("/biaya_layanan_marketplace", marketplace.GetMarketplaceFee)
	public.Get("/stores", platform.ListStores)
	public.Get("/stores/:id", platform.GetStore)
	public.Get("/vouchers", platform.ListVouchers)
	public.Get("/vouchers/:code/apply", platform.ApplyVoucher)
	public.Get("/shipping/options", platform.ShippingOptions)
	public.Get("/products/:product_id/reviews", platform.ListReviews)
	public.Get("/products/:product_id/discussions", platform.ListDiscussions)

	protected := app.Group("/marketplace", authRequired, middleware.RequestLogger(auditRepo))
	buyer := protected.Group("", middleware.RequireRoles(models.RoleBuyer))
	buyer.Post("/checkout", marketplace.Checkout)
	buyer.Post("/integrasi_pembayaran", marketplace.IntegratePayment)
	buyer.Get("/status_order", marketplace.GetOrderStatus)
	buyer.Get("/cart", platform.Cart)
	buyer.Post("/cart", platform.AddCart)
	buyer.Post("/cart/sync", platform.SyncCart)
	buyer.Patch("/cart/:product_id", platform.UpdateCart)
	buyer.Delete("/cart/:product_id", platform.RemoveCart)
	buyer.Post("/checkout/calculate", platform.CalculateCheckout)
	buyer.Post("/cart/checkout", platform.CheckoutCart)
	buyer.Get("/orders", platform.ListOrders)
	buyer.Patch("/orders/:id/cancel", platform.CancelOrder)
	buyer.Get("/orders/:id/tracking", platform.OrderTracking)
	buyer.Get("/orders/:id", marketplace.GetOrderStatus)
	buyer.Post("/products/:product_id/reviews", platform.CreateReview)
	buyer.Post("/products/:product_id/discussions", platform.CreateDiscussion)

	seller := protected.Group("/seller", middleware.RequireRoles(models.RoleSeller))
	seller.Get("/products", platform.ListSellerProducts)
	seller.Post("/products", platform.SaveSellerProduct)
	seller.Get("/dashboard", platform.SellerDashboard)
	seller.Get("/orders", platform.ListSellerOrders)
	seller.Patch("/orders/:id/status", platform.UpdateSellerOrderStatus)
	seller.Get("/store", platform.MyStore)

	admin := protected.Group("", middleware.RequireRoles(models.RoleCatalogAdmin, models.RolePlatformAdmin))
	admin.Post("/manajemen_produk", marketplace.SaveProduct)
	admin.Patch("/products/:id/status", marketplace.SetProductStatus)

	member := protected.Group("", middleware.RequireRoles(models.RoleBuyer, models.RoleSeller))
	member.Get("/chat", platform.ListChat)
	member.Post("/chat", platform.SendChat)
	member.Get("/notifications", platform.ListNotifications)
	member.Patch("/notifications/:id/read", platform.MarkNotificationRead)
}
