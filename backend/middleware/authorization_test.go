package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/services"
)

func TestRequireRoles(t *testing.T) {
	tests := []struct {
		name       string
		claims     *services.JWTClaims
		wantStatus int
	}{
		{name: "seller allowed", claims: &services.JWTClaims{Role: models.RoleSeller}, wantStatus: fiber.StatusNoContent},
		{name: "buyer forbidden", claims: &services.JWTClaims{Role: models.RoleBuyer}, wantStatus: fiber.StatusForbidden},
		{name: "missing authentication", wantStatus: fiber.StatusUnauthorized},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			app := fiber.New()
			app.Get("/seller", func(ctx *fiber.Ctx) error {
				if test.claims != nil {
					ctx.Locals(ClaimsLocal, test.claims)
				}
				return ctx.Next()
			}, RequireRoles(models.RoleSeller), func(ctx *fiber.Ctx) error {
				return ctx.SendStatus(fiber.StatusNoContent)
			})
			response, err := app.Test(httptest.NewRequest("GET", "/seller", nil))
			if err != nil {
				t.Fatalf("app.Test() error = %v", err)
			}
			if response.StatusCode != test.wantStatus {
				t.Fatalf("status = %d, want %d", response.StatusCode, test.wantStatus)
			}
		})
	}
}
