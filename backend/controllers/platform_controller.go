package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

type PlatformController struct {
	service *services.PlatformService
	auth    *services.AuthService
}

func NewPlatformController(service *services.PlatformService, auth *services.AuthService) *PlatformController {
	return &PlatformController{service: service, auth: auth}
}

func (c *PlatformController) Cart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	cart, err := c.service.Cart(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, cart)
}

func (c *PlatformController) AddCart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CartInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	cart, err := c.service.AddCart(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, cart)
}

func (c *PlatformController) UpdateCart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CartInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	input.ProductID = ctx.Params("product_id", input.ProductID)
	cart, err := c.service.UpdateCart(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, cart)
}

func (c *PlatformController) RemoveCart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	cart, err := c.service.RemoveCart(claims.UserID, ctx.Params("product_id"))
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, cart)
}

func (c *PlatformController) SyncCart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CartSyncInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	cart, err := c.service.SyncCart(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, cart)
}

func (c *PlatformController) CalculateCheckout(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CartCheckoutInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	estimate, err := c.service.CalculateCheckout(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, estimate)
}

func (c *PlatformController) CheckoutCart(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.CartCheckoutInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	order, err := c.service.CheckoutCart(claims.UserID, input, ctx.Get("Authorization"))
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, order)
}

func (c *PlatformController) ListOrders(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	orders, err := c.service.ListOrders(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, orders)
}

func (c *PlatformController) ListSellerOrders(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	orders, err := c.service.ListSellerOrders(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, orders)
}

func (c *PlatformController) CancelOrder(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input struct {
		Reason string `json:"reason"`
	}
	_ = ctx.BodyParser(&input)
	order, err := c.service.CancelOrder(claims.UserID, ctx.Params("id"), input.Reason)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, order)
}

func (c *PlatformController) UpdateSellerOrderStatus(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	order, err := c.service.UpdateSellerOrderStatus(claims.UserID, ctx.Params("id"), input.Status)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, order)
}

func (c *PlatformController) OrderTracking(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	tracking, err := c.service.OrderTracking(claims.UserID, ctx.Params("id"))
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, tracking)
}

func (c *PlatformController) ListStores(ctx *fiber.Ctx) error {
	stores, err := c.service.ListStores()
	if err != nil {
		return err
	}
	return ok(ctx, stores)
}

func (c *PlatformController) GetStore(ctx *fiber.Ctx) error {
	store, products, err := c.service.GetStore(ctx.Params("id"))
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, fiber.Map{"store": store, "products": products})
}

func (c *PlatformController) MyStore(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	store, err := c.service.MyStore(claims.UserID)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, store)
}

func (c *PlatformController) ListVouchers(ctx *fiber.Ctx) error {
	vouchers, err := c.service.ListVouchers()
	if err != nil {
		return err
	}
	return ok(ctx, vouchers)
}

func (c *PlatformController) ApplyVoucher(ctx *fiber.Ctx) error {
	subtotal, _ := strconv.ParseInt(ctx.Query("subtotal", "0"), 10, 64)
	preview, err := c.service.ApplyVoucher(ctx.Params("code"), subtotal)
	if err != nil {
		return mapServiceError(err)
	}
	return ok(ctx, preview)
}

func (c *PlatformController) ShippingOptions(ctx *fiber.Ctx) error {
	qty, _ := strconv.Atoi(ctx.Query("qty", "1"))
	return ok(ctx, c.service.ShippingOptions(ctx.Query("product_id"), qty))
}

func (c *PlatformController) ListReviews(ctx *fiber.Ctx) error {
	reviews, err := c.service.ListReviews(ctx.Params("product_id"))
	if err != nil {
		return err
	}
	return ok(ctx, reviews)
}

func (c *PlatformController) CreateReview(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	review, err := c.service.CreateReview(claims.UserID, ctx.Params("product_id"), input.Rating, input.Comment)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, review)
}

func (c *PlatformController) ListDiscussions(ctx *fiber.Ctx) error {
	discussions, err := c.service.ListDiscussions(ctx.Params("product_id"))
	if err != nil {
		return err
	}
	return ok(ctx, discussions)
}

func (c *PlatformController) CreateDiscussion(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input struct {
		Message string `json:"message"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	discussion, err := c.service.CreateDiscussion(claims.UserID, ctx.Params("product_id"), input.Message)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, discussion)
}

func (c *PlatformController) ListChat(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	messages, err := c.service.ListChat(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, messages)
}

func (c *PlatformController) SendChat(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input struct {
		ReceiverID string `json:"receiver_id"`
		ProductID  string `json:"product_id"`
		Body       string `json:"body"`
	}
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	message, err := c.service.SendChat(claims.UserID, input.ReceiverID, input.ProductID, input.Body)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, message)
}

func (c *PlatformController) ListNotifications(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	notifications, err := c.service.ListNotifications(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, notifications)
}

func (c *PlatformController) MarkNotificationRead(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	if err := c.service.MarkNotificationRead(claims.UserID, ctx.Params("id")); err != nil {
		return err
	}
	return ok(ctx, fiber.Map{"notification_id": ctx.Params("id"), "is_read": true})
}
