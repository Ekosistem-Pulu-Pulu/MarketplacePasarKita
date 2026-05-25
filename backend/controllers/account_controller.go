package controllers

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

type AccountController struct {
	service *services.AccountService
	auth    *services.AuthService
}

func NewAccountController(service *services.AccountService, auth *services.AuthService) *AccountController {
	return &AccountController{service: service, auth: auth}
}

func (c *AccountController) Register(ctx *fiber.Ctx) error {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		Phone    string `json:"phone"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	result, err := c.service.Register(input)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, result)
}

func (c *AccountController) Me(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	user, err := c.service.PublicUser(claims.UserID)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, user)
}

func (c *AccountController) UpdateProfile(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.UpdateProfileInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	user, err := c.service.UpdateProfile(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, user)
}

func (c *AccountController) ListAddresses(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	addresses, err := c.service.ListAddresses(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, addresses)
}

func (c *AccountController) SaveAddress(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.AddressInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	address, err := c.service.SaveAddress(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, address)
}

func requireClaims(ctx *fiber.Ctx, auth *services.AuthService) (*services.JWTClaims, error) {
	authHeader := ctx.Get("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader || strings.TrimSpace(token) == "" {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Authorization Bearer token wajib dikirim")
	}
	claims, err := auth.ValidateToken(token)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}
	return claims, nil
}
