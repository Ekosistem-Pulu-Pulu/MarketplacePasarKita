package controllers

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

type MarketplaceController struct {
	service *services.MarketplaceService
	auth    *services.AuthService
}

func NewMarketplaceController(service *services.MarketplaceService, auth *services.AuthService) *MarketplaceController {
	return &MarketplaceController{service: service, auth: auth}
}

func (c *MarketplaceController) BrowseProducts(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "10"))
	minPrice, _ := strconv.ParseInt(ctx.Query("minPrice", "0"), 10, 64)
	maxPrice, _ := strconv.ParseInt(ctx.Query("maxPrice", "0"), 10, 64)
	rating, _ := strconv.ParseFloat(ctx.Query("rating", "0"), 64)

	products, total, err := c.service.BrowseProducts(services.BrowseParams{
		Keyword:  ctx.Query("keyword"),
		Category: ctx.Query("category", ctx.Query("kategori")),
		Location: ctx.Query("location"),
		Sort:     ctx.Query("sort"),
		MinPrice: minPrice,
		MaxPrice: maxPrice,
		Rating:   rating,
		Promo:    ctx.Query("promo") != "",
		Page:     page,
		Limit:    limit,
	})
	if err != nil {
		return err
	}

	return ok(ctx, fiber.Map{
		"items": products,
		"meta": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (c *MarketplaceController) GetProduct(ctx *fiber.Ctx) error {
	product, err := c.service.GetProduct(ctx.Params("id"))
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, product)
}

func (c *MarketplaceController) ListSellerProducts(ctx *fiber.Ctx) error {
	products, err := c.service.ListSellerProducts()
	if err != nil {
		return err
	}
	return ok(ctx, products)
}

func (c *MarketplaceController) SaveProduct(ctx *fiber.Ctx) error {
	var input services.ProductInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}

	product, err := c.service.SaveProduct(input)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, product)
}

func (c *MarketplaceController) SetProductStatus(ctx *fiber.Ctx) error {
	var input struct {
		StatusAktif bool `json:"status_aktif"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}

	product, err := c.service.SetProductStatus(ctx.Params("id"), input.StatusAktif)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, product)
}

func (c *MarketplaceController) Checkout(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CheckoutInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}

	order, err := c.service.Checkout(claims.UserID, input, ctx.Get("Authorization"))
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, c.service.PresentOrder(order))
}

func (c *MarketplaceController) IntegratePayment(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.PaymentIntegrationInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}

	order, err := c.service.IntegratePayment(claims.UserID, input, ctx.Get("Authorization"))
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, c.service.PresentOrder(order))
}

func (c *MarketplaceController) GetOrderStatus(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	orderID := ctx.Query("order_id")
	if orderID == "" {
		orderID = ctx.Params("id")
	}
	if orderID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "order_id wajib diisi")
	}

	order, err := c.service.GetOrderForUser(claims.UserID, orderID)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, c.service.PresentOrder(order))
}

func (c *MarketplaceController) GetMarketplaceFee(ctx *fiber.Ctx) error {
	subtotal, err := strconv.ParseInt(ctx.Query("subtotal", "0"), 10, 64)
	if err != nil || subtotal < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "subtotal tidak valid")
	}

	fee := services.CalculateMarketplaceFee(subtotal)
	return ok(ctx, fiber.Map{
		"subtotal":          subtotal,
		"fee_percent":       services.MarketplaceFeePercent,
		"marketplace_fee":   fee,
		"total_with_fee":    subtotal + fee,
		"calculation_basis": "marketplace_fee = 2% x subtotal",
	})
}

func ok(ctx *fiber.Ctx, data any) error {
	return ctx.JSON(fiber.Map{"status": "success", "data": data})
}

func created(ctx *fiber.Ctx, data any) error {
	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "success", "data": data})
}

func mapServiceError(err error) error {
	if errors.Is(err, services.ErrBadRequest) {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if errors.Is(err, services.ErrNotFound) {
		return fiber.NewError(fiber.StatusNotFound, "data tidak ditemukan")
	}
	if errors.Is(err, services.ErrForbidden) {
		return fiber.NewError(fiber.StatusForbidden, "akses ke data tersebut ditolak")
	}
	return err
}
