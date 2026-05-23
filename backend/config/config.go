package config

import "os"
import "strings"

type Config struct {
	AppPort              string
	AppEnv               string
	DBHost               string
	DBPort               string
	DBUser               string
	DBPassword           string
	DBName               string
	APIGatewayBaseURL    string
	EnableGatewayForward bool
	RequireAuth          bool
	JWTSecret            string
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
		APIGatewayBaseURL:    getEnv("API_GATEWAY_BASE_URL", "http://localhost:3000"),
		EnableGatewayForward: getEnv("ENABLE_GATEWAY_FORWARD", "false") == "true",
		RequireAuth:          getEnv("REQUIRE_AUTH", "false") == "true",
		JWTSecret:            getEnv("JWT_SECRET", "dev-secret"),
	}
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
