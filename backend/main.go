package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/controllers"
	"pasarkita-marketplace-backend/database"
	"pasarkita-marketplace-backend/middleware"
	"pasarkita-marketplace-backend/repositories"
	"pasarkita-marketplace-backend/routes"
	"pasarkita-marketplace-backend/services"
)

func main() {
	loadEnv()

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("invalid security configuration: %v", err)
	}
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	if cfg.SeedDatabase {
		if err := database.SeedDatabase(db, cfg.SeedUserPassword); err != nil {
			log.Fatalf("database seeding failed: %v", err)
		}
	}

	app := fiber.New(fiber.Config{
		AppName:      "Marketplace PasarKita API",
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "0",
		ContentSecurityPolicy:     "default-src 'none'; frame-ancestors 'none'",
		CrossOriginResourcePolicy: "same-site",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.CORSAllowedOrigins,
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
	authService := services.NewAuthService(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL, userRepo, refreshTokenRepo)
	marketplaceService := services.NewMarketplaceService(productRepo, orderRepo, auditRepo, integrationService)
	accountService := services.NewAccountService(userRepo, addressRepo, authService)
	platformService := services.NewPlatformService(productRepo, orderRepo, cartRepo, addressRepo, storeRepo, marketplaceDataRepo, integrationService, auditRepo)
	authController := controllers.NewAuthController(authService)
	marketplaceController := controllers.NewMarketplaceController(marketplaceService, authService)
	accountController := controllers.NewAccountController(accountService, authService)
	platformController := controllers.NewPlatformController(platformService, authService)

	routes.Register(app, cfg, authService, marketplaceController, authController, accountController, platformController, auditRepo)

	log.Printf("Marketplace PasarKita API running on :%s", cfg.AppPort)
	log.Fatal(app.Listen(":" + cfg.AppPort))
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
