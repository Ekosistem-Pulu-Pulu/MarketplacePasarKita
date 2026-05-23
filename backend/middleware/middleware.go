package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/config"
	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

func ErrorHandler(ctx *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "internal server error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return ctx.Status(code).JSON(fiber.Map{
		"status":  "error",
		"message": message,
	})
}

func OptionalAuth(cfg config.Config) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		authHeader := ctx.Get("Authorization")
		if !cfg.RequireAuth {
			if authHeader != "" {
				ctx.Locals("authorization", authHeader)
			}
			return ctx.Next()
		}

		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return fiber.NewError(fiber.StatusUnauthorized, "Authorization Bearer token wajib dikirim")
		}

		ctx.Locals("authorization", authHeader)
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
				message = err.Error()
			}
		}

		auditRepo.Create(models.AuditLog{
			Method:     ctx.Method(),
			Path:       ctx.Path(),
			UserID:     ctx.Query("user_id"),
			StatusCode: statusCode,
			Message:    message,
		})
		return err
	}
}
