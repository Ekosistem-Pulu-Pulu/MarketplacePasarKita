package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "Marketplace PasarKita API",
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))

	productRepo := repositories.NewProductRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	auditRepo := repositories.NewAuditLogRepository(db)
	userRepo := repositories.NewUserRepository(db)
	addressRepo := repositories.NewAddressRepository(db)
	storeRepo := repositories.NewStoreRepository(db)
	cartRepo := repositories.NewCartRepository(db)
	marketplaceDataRepo := repositories.NewMarketplaceDataRepository(db)

	integrationService := services.NewIntegrationService(cfg)
	authService := services.NewAuthService(cfg.JWTSecret, userRepo)
	marketplaceService := services.NewMarketplaceService(productRepo, orderRepo, auditRepo, integrationService)
	accountService := services.NewAccountService(userRepo, addressRepo, authService)
	platformService := services.NewPlatformService(productRepo, orderRepo, cartRepo, addressRepo, storeRepo, marketplaceDataRepo, integrationService, auditRepo)
	authController := controllers.NewAuthController(authService)
	marketplaceController := controllers.NewMarketplaceController(marketplaceService)
	accountController := controllers.NewAccountController(accountService, authService)
	platformController := controllers.NewPlatformController(platformService, authService)

	routes.Register(app, cfg, marketplaceController, authController, accountController, platformController, auditRepo)

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
