package main

import (
	"log/slog"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/joho/godotenv"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/controllers"
	"pasarkita-marketplace-backend/database"
	"pasarkita-marketplace-backend/middleware"
	"pasarkita-marketplace-backend/pkg/logger"
	"pasarkita-marketplace-backend/repositories"
	"pasarkita-marketplace-backend/routes"
	"pasarkita-marketplace-backend/services"
)

func main() {
	loadEnv()

	cfg := config.Load()
	logger.Init(cfg.AppEnv)
	if err := cfg.Validate(); err != nil {
		logger.Fatal("invalid security configuration", "error", err)
	}
	db, err := database.Connect(cfg)
	if err != nil {
		logger.Fatal("database connection failed", "error", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		logger.Fatal("database migration failed", "error", err)
	}

	if cfg.SeedDatabase {
		if err := database.SeedDatabase(db, cfg.SeedUserPassword); err != nil {
			logger.Fatal("database seeding failed", "error", err)
		}
	}

	app := fiber.New(fiber.Config{
		AppName:      "Marketplace PasarKita API",
		ErrorHandler: middleware.ErrorHandler,
		// Naikkan BodyLimit default (4MB) menjadi 8MB supaya upload
		// gambar produk (maks 4MB) mencapai handler untuk error yang
		// ramah, bukan opaque 413 dari Fiber.
		BodyLimit: 8 * 1024 * 1024,
	})

	app.Use(recover.New())
	// requestid dipasang paling awal agar setiap entri log yang ditulis
	// downstream (AccessLog, Authenticate, RequireRoles, service) bisa
	// dikorelasikan lewat ID yang sama.
	app.Use(requestid.New())
	// AccessLog menangkap method/path/status/latency per request dan
	// menulisnya lewat slog default yang di-init di atas.
	app.Use(middleware.AccessLog())
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "0",
		ContentSecurityPolicy:     "default-src 'none'; frame-ancestors 'none'",
		CrossOriginResourcePolicy: "same-site",
	}))
	app.Use(cors.New(cors.Config{
		// ExpandedCORSOrigins menambahkan pasangan loopback
		// (localhost:<port> <-> 127.0.0.1:<port>) secara otomatis sehingga
		// Vite default di 127.0.0.1:5173 tidak lagi ditolak. Ekspansi
		// eksplisit & deterministic; wildcard tetap ditolak oleh Validate().
		AllowOrigins: cfg.ExpandedCORSOrigins(),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		MaxAge:       600,
	}))
	app.Use(limiter.New(limiter.Config{
		Max:        cfg.RateLimitMax,
		Expiration: cfg.RateLimitWindow,
		LimitReached: func(ctx *fiber.Ctx) error {
			return fiber.NewError(fiber.StatusTooManyRequests, "rate limit terlampaui")
		},
	}))

	productRepo := repositories.NewProductRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	auditRepo := repositories.NewAuditLogRepository(db)
	userRepo := repositories.NewUserRepository(db)
	refreshTokenRepo := repositories.NewRefreshTokenRepository(db)
	addressRepo := repositories.NewAddressRepository(db)
	storeRepo := repositories.NewStoreRepository(db)
	cartRepo := repositories.NewCartRepository(db)
	marketplaceDataRepo := repositories.NewMarketplaceDataRepository(db)

	integrationService := services.NewIntegrationService(cfg)
	logistikKitaClient := services.NewLogistikKitaClient(cfg)
	smartBankClient := services.NewSmartBankClient(cfg)
	storageClient, err := services.NewStorageClient(cfg)
	if err != nil {
		logger.Fatal("storage client init failed", "error", err)
	}
	authService := services.NewAuthService(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL, userRepo, refreshTokenRepo)
	marketplaceService := services.NewMarketplaceService(productRepo, orderRepo, auditRepo, integrationService)
	accountService := services.NewAccountService(userRepo, addressRepo, authService)
	platformService := services.NewPlatformService(productRepo, orderRepo, cartRepo, addressRepo, storeRepo, marketplaceDataRepo, integrationService, auditRepo)
	guestCheckoutService := services.NewGuestCheckoutService(db, productRepo, orderRepo, auditRepo, logistikKitaClient, smartBankClient)
	authController := controllers.NewAuthController(authService)
	marketplaceController := controllers.NewMarketplaceController(marketplaceService, authService)
	accountController := controllers.NewAccountController(accountService, authService)
	platformController := controllers.NewPlatformController(platformService, authService, storageClient)
	guestController := controllers.NewGuestController(guestCheckoutService)

	// Sajikan aset hasil upload mock/local agar FE bisa memuat gambar
	// tanpa CDN selama pengembangan tidak ada service storage nyata.
	app.Static("/uploads", cfg.StorageLocalRoot)

	routes.Register(app, cfg, authService, marketplaceController, authController, accountController, platformController, guestController, auditRepo)

	slog.Info("backend_listening", "port", cfg.AppPort, "env", cfg.AppEnv)
	if err := app.Listen(":" + cfg.AppPort); err != nil {
		logger.Fatal("listen_failed", "error", err, "port", cfg.AppPort)
	}
}

func loadEnv() {
	cwd, err := os.Getwd()
	if err != nil {
		_ = godotenv.Overload()
		return
	}

	for dir := cwd; ; dir = filepath.Dir(dir) {
		candidates := []string{
			filepath.Join(dir, ".env"),
			filepath.Join(dir, "backend", ".env"),
		}

		for _, candidate := range candidates {
			if _, statErr := os.Stat(candidate); statErr == nil {
				_ = godotenv.Overload(candidate)
				return
			}
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return
		}
	}
}
