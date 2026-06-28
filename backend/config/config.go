package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppPort              string
	AppEnv               string
	DBHost               string
	DBPort               string
	DBUser               string
	DBPassword           string
	DBName               string
	APIGatewayBaseURL       string
	EnableGatewayForward    bool
	LogistikKitaBaseURL     string
	EnableLogistikKitaFwd   bool
	SmartBankBaseURL        string
	EnableSmartBankFwd      bool
	LogistikKitaSecret      string
	SmartBankSecret         string
	GuestCheckoutRateTTL    time.Duration

	// Storage abstraction: pilih backend lewat STORAGE_PROVIDER.
	// Nilai dikenal: "" | "mock" | "local" | "s3" | "minio" | "r2" | "cloudinary".
	StorageProvider   string
	StorageBaseURL    string // service endpoint (S3/MinIO/R2/Cloudinary API)
	StoragePublicURL  string // CDN/base URL untuk browser
	StorageBucket     string
	StorageRegion     string
	StorageAccessKey  string
	StorageSecretKey  string
	StorageLocalRoot  string // direktori tulis untuk mode mock/local
	StorageCloudName  string // khusus Cloudinary

	JWTSecret               string
	AccessTokenTTL       time.Duration
	RefreshTokenTTL      time.Duration
	CORSAllowedOrigins   string
	RateLimitMax         int
	RateLimitWindow      time.Duration
	AuthRateLimitMax     int
	EnableDocs           bool
	SeedDatabase         bool
	SeedUserPassword     string
}

func Load() Config {
	return Config{
		AppPort:              getEnv("APP_PORT", "3002"),
		AppEnv:               getEnv("APP_ENV", "development"),
		DBHost:               getEnv("DB_HOST", "127.0.0.1"),
		DBPort:               getEnv("DB_PORT", "3306"),
		DBUser:               getEnv("DB_USER", "root"),
		DBPassword:           getStringEnv("DB_PASSWORD", ""),
		DBName:               getEnv("DB_NAME", "pasarkita_marketplace"),
		APIGatewayBaseURL:       getEnv("API_GATEWAY_BASE_URL", "http://localhost:3000"),
		EnableGatewayForward:    getEnv("ENABLE_GATEWAY_FORWARD", "false") == "true",
		LogistikKitaBaseURL:     getEnv("LOGISTIKKITA_BASE_URL", "http://localhost:3010"),
		EnableLogistikKitaFwd:   getEnv("ENABLE_LOGISTIKKITA_FORWARD", "false") == "true",
		SmartBankBaseURL:        getEnv("SMARTBANK_BASE_URL", "http://localhost:3020"),
		EnableSmartBankFwd:      getEnv("ENABLE_SMARTBANK_FORWARD", "false") == "true",
		LogistikKitaSecret:      getStringEnv("LOGISTIKKITA_SHARED_SECRET", ""),
		SmartBankSecret:         getStringEnv("SMARTBANK_SHARED_SECRET", ""),
		GuestCheckoutRateTTL:    getDurationEnv("GUEST_RATE_TTL", 15*time.Minute),
		JWTSecret:               getStringEnv("JWT_SECRET", ""),
		AccessTokenTTL:       getDurationEnv("ACCESS_TOKEN_TTL", 15*time.Minute),
		RefreshTokenTTL:      getDurationEnv("REFRESH_TOKEN_TTL", 7*24*time.Hour),
		CORSAllowedOrigins:   getStringEnv("CORS_ALLOWED_ORIGINS", ""),
		RateLimitMax:         getIntEnv("RATE_LIMIT_MAX", 120),
		RateLimitWindow:      getDurationEnv("RATE_LIMIT_WINDOW", time.Minute),
		AuthRateLimitMax:     getIntEnv("AUTH_RATE_LIMIT_MAX", 10),
		EnableDocs:           getBoolEnv("ENABLE_DOCS", false),
		SeedDatabase:         getBoolEnv("SEED_DATABASE", false),
		SeedUserPassword:     getStringEnv("SEED_USER_PASSWORD", ""),
		StorageProvider:      getEnv("STORAGE_PROVIDER", "mock"), // mock | s3 | minio | r2 | cloudinary | local
		StorageBaseURL:       getEnv("STORAGE_BASE_URL", ""),
		StoragePublicURL:     getEnv("STORAGE_PUBLIC_URL", ""),
		StorageBucket:        getStringEnv("STORAGE_BUCKET", ""),
		StorageRegion:        getEnv("STORAGE_REGION", "us-east-1"),
		StorageAccessKey:     getStringEnv("STORAGE_ACCESS_KEY", ""),
		StorageSecretKey:     getStringEnv("STORAGE_SECRET_KEY", ""),
		StorageLocalRoot:     getEnv("STORAGE_LOCAL_ROOT", "./uploads"),
		StorageCloudName:     getEnv("STORAGE_CLOUD_NAME", ""),
	}
}

func (c Config) Validate() error {
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET wajib diisi minimal 32 karakter")
	}
	if strings.TrimSpace(c.CORSAllowedOrigins) == "" || strings.Contains(c.CORSAllowedOrigins, "*") {
		return fmt.Errorf("CORS_ALLOWED_ORIGINS wajib berisi origin eksplisit dan tidak boleh memakai wildcard")
	}
	if c.AccessTokenTTL <= 0 || c.RefreshTokenTTL <= c.AccessTokenTTL {
		return fmt.Errorf("ACCESS_TOKEN_TTL harus positif dan REFRESH_TOKEN_TTL harus lebih panjang")
	}
	if c.RateLimitMax <= 0 || c.AuthRateLimitMax <= 0 || c.RateLimitWindow <= 0 {
		return fmt.Errorf("konfigurasi rate limiter tidak valid")
	}
	if c.SeedDatabase && len(c.SeedUserPassword) < 12 {
		return fmt.Errorf("SEED_USER_PASSWORD minimal 12 karakter saat SEED_DATABASE=true")
	}
	return nil
}

func (c Config) DSN() string {
	return c.DBUser + ":" + c.DBPassword + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/" + c.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getStringEnv(key string, fallback string) string {
	value := getEnv(key, fallback)
	return strings.Trim(value, `"'`)
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return -1
	}
	return parsed
}

func getIntEnv(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return -1
	}
	return parsed
}

func getBoolEnv(key string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	return err == nil && parsed
}
