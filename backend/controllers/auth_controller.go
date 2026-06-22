package controllers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

type AuthController struct {
	service *services.AuthService
}

func NewAuthController(service *services.AuthService) *AuthController {
	return &AuthController{service: service}
}

func (c *AuthController) Login(ctx *fiber.Ctx) error {
	var input services.LoginInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}

	result, err := c.service.Login(input)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			return fiber.NewError(fiber.StatusUnauthorized, "email atau password tidak sesuai")
		}
		return err
	}

	return ok(ctx, result)
}

func (c *AuthController) Me(ctx *fiber.Ctx) error {
	authHeader := ctx.Get("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader || strings.TrimSpace(token) == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Authorization Bearer token wajib dikirim")
	}

	claims, err := c.service.ValidateToken(token)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}

	return ok(ctx, fiber.Map{
		"id":    claims.UserID,
		"name":  claims.Name,
		"email": claims.Email,
		"role":  claims.Role,
	})
}

func (c *AuthController) AccountUsers(ctx *fiber.Ctx) error {
	return ok(ctx, c.service.AccountUsers())
}
