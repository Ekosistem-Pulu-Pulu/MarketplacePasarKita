package middleware

import (
	"log/slog"
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
	"pasarkita-marketplace-backend/services"
)

const ClaimsLocal = "auth_claims"

func ErrorHandler(ctx *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "internal server error"
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}
	return ctx.Status(code).JSON(fiber.Map{"status": "error", "message": message})
}

func Authenticate(auth *services.AuthService) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		fields := strings.Fields(ctx.Get("Authorization"))
		if len(fields) != 2 || !strings.EqualFold(fields[0], "Bearer") {
			slog.Warn("auth_failed",
				slog.String("reason", "missing_or_invalid_authorization_header"),
				slog.String("path", ctx.Path()),
				slog.String("ip", ctx.IP()),
			)
			return fiber.NewError(fiber.StatusUnauthorized, "autentikasi diperlukan")
		}
		claims, err := auth.ValidateToken(fields[1])
		if err != nil {
			slog.Warn("auth_failed",
				slog.String("reason", "invalid_or_expired_token"),
				slog.String("path", ctx.Path()),
				slog.String("ip", ctx.IP()),
				slog.String("error", err.Error()),
			)
			return fiber.NewError(fiber.StatusUnauthorized, "access token tidak valid atau kedaluwarsa")
		}
		ctx.Locals(ClaimsLocal, claims)
		return ctx.Next()
	}
}

func RequireRoles(roles ...string) fiber.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(ctx *fiber.Ctx) error {
		claims, ok := ctx.Locals(ClaimsLocal).(*services.JWTClaims)
		if !ok || claims == nil {
			return fiber.NewError(fiber.StatusUnauthorized, "autentikasi diperlukan")
		}
		if _, ok := allowed[claims.Role]; !ok {
			// Catat attempt 403 dengan klaim yang disajikan agar admin bisa
			// mengaudit lonjakan akses ke endpoint role-restricted.
			slog.Warn("forbidden_access",
				slog.String("user_id", claims.UserID),
				slog.String("role", claims.Role),
				slog.String("path", ctx.Path()),
				slog.String("method", ctx.Method()),
				slog.Any("required_roles", roles),
				slog.String("ip", ctx.IP()),
			)
			return fiber.NewError(fiber.StatusForbidden, "role tidak memiliki akses ke endpoint ini")
		}
		return ctx.Next()
	}
}

func RequestLogger(auditRepo *repositories.AuditLogRepository) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		err := ctx.Next()
		statusCode := ctx.Response().StatusCode()
		message := "request completed"
		if err != nil {
			if fiberErr, ok := err.(*fiber.Error); ok {
				statusCode = fiberErr.Code
				message = fiberErr.Message
			} else {
				statusCode = fiber.StatusInternalServerError
				message = "internal server error"
			}
		}
		userID := ""
		if claims, ok := ctx.Locals(ClaimsLocal).(*services.JWTClaims); ok && claims != nil {
			userID = claims.UserID
		}
		auditRepo.Create(models.AuditLog{Method: ctx.Method(), Path: ctx.Path(), UserID: userID, StatusCode: statusCode, Message: message})
		return err
	}
}
