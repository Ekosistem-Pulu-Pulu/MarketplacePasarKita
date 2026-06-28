package controllers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

/*
 * GuestController melayani endpoint publik untuk Guest Checkout. Tidak ada
 * middleware auth di sini; order ownership diverifikasi via kombinasi
 * order_id + email. Service-layer memanggil klien LogistikKita untuk
 * pengiriman dan klien SmartBank untuk pembayaran.
 */

type GuestController struct {
	guest *services.GuestCheckoutService
}

func NewGuestController(guest *services.GuestCheckoutService) *GuestController {
	return &GuestController{guest: guest}
}

type previewShippingRequest struct {
	Country       string                              `json:"country"`
	Kota          string                              `json:"kota"`
	Kecamatan     string                              `json:"kecamatan"`
	Kelurahan     string                              `json:"kelurahan"`
	AlamatLengkap string                              `json:"alamat_lengkap"`
	KodePos       string                              `json:"kode_pos,omitempty"`
	Items         []services.ShippingItem             `json:"items"`
}

func (c *GuestController) PreviewShippingRates(ctx *fiber.Ctx) error {
	var req previewShippingRequest
	if err := ctx.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	if strings.TrimSpace(req.Kota) == "" || strings.TrimSpace(req.Kecamatan) == "" || strings.TrimSpace(req.Kelurahan) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "kota, kecamatan, dan kelurahan wajib diisi")
	}
	if len(req.Items) == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "minimal satu produk diperlukan")
	}
	if req.Country == "" {
		req.Country = "ID"
	}

	rateList, err := c.guest.PreviewShipping(ctx.UserContext(), services.ShippingDestination{
		Country:       req.Country,
		Kota:          req.Kota,
		Kecamatan:     req.Kecamatan,
		Kelurahan:     req.Kelurahan,
		AlamatLengkap: req.AlamatLengkap,
		KodePos:       req.KodePos,
	}, req.Items)
	if err != nil {
		return mapGuestError(err)
	}
	return ok(ctx, rateList)
}

func (c *GuestController) CreateGuestCheckout(ctx *fiber.Ctx) error {
	var input services.GuestCheckoutInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	input.IsGuest = true

	summary, err := c.guest.CreateCheckout(ctx.UserContext(), input)
	if err != nil {
		return mapGuestError(err)
	}
	return ok(ctx, summary)
}

// CreateAuthenticatedCheckout tidak lagi dipasang di routes.go — endpoint
// untuk user yang sudah login tetap memakai MarketplaceController.Checkout
// pada flow lama agar tidak menggandakan permukaan API. Definisi ini
// sengaja dihapus untuk menghindari duplikasi endpoint dan potensi bug
// auth-handling yang tidak konsisten.

func (c *GuestController) GetGuestOrder(ctx *fiber.Ctx) error {
	orderID := ctx.Params("id")
	email := strings.TrimSpace(ctx.Query("email"))
	if orderID == "" {
		orderID = strings.TrimSpace(ctx.Query("order_id"))
	}
	if orderID == "" || email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "order_id dan email wajib diisi")
	}

	order, shipment, err := c.guest.GetGuestOrder(ctx.UserContext(), orderID, email)
	if err != nil {
		return mapGuestError(err)
	}

	payload := fiber.Map{
		"order": order,
	}
	if shipment != nil {
		payload["shipment"] = shipment
	}
	return ok(ctx, payload)
}

func (c *GuestController) GetPaymentStatus(ctx *fiber.Ctx) error {
	paymentIntentID := strings.TrimSpace(ctx.Params("id"))
	if paymentIntentID == "" {
		paymentIntentID = strings.TrimSpace(ctx.Query("payment_intent_id"))
	}
	if paymentIntentID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "payment_intent_id wajib diisi")
	}
	return ok(ctx, fiber.Map{"payment_intent_id": paymentIntentID, "hint": "status final selalu dipull dari SmartBank"})
}

func (c *GuestController) FinalizeShipment(ctx *fiber.Ctx) error {
	orderID := strings.TrimSpace(ctx.Params("id"))
	if orderID == "" {
		return fiber.NewError(fiber.StatusBadRequest, "order_id wajib diisi")
	}
	res, err := c.guest.FinalizeShipment(ctx.UserContext(), orderID)
	if err != nil {
		return mapGuestError(err)
	}
	return ok(ctx, res)
}

// ComputeMarketplaceFee adalah thin accessor untuk marketplace 2% fee
// (legacy endpoint sudah ada di MarketplaceController.GetMarketplaceFee dan
// mengekspos info ini juga untuk konsistensi dokumentasi thin-client).
func (c *GuestController) ComputeMarketplaceFee(ctx *fiber.Ctx) error {
	subtotal, err := strconv.ParseInt(ctx.Query("subtotal", "0"), 10, 64)
	if err != nil || subtotal < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "subtotal tidak valid")
	}
	fee := services.CalculateMarketplaceFee(subtotal)
	return ok(ctx, fiber.Map{
		"subtotal":         subtotal,
		"fee_percent":      int64(2),
		"marketplace_fee":  fee,
		"warning":          "fee bank, gateway, dan pajak dihitung oleh SmartBank bukan marketplace",
		"thin_client_role": "marketplace TIDAK menghitung ongkir, bank fee, gateway fee, atau pajak",
	})
}

func mapGuestError(err error) error {
	if err == nil {
		return nil
	}
	switch {
	case errors.Is(err, services.ErrGuestInvalidAddress),
		errors.Is(err, services.ErrGuestInvalidCart),
		errors.Is(err, services.ErrGuestItemsUnavailable),
		errors.Is(err, services.ErrGuestInvalidRate),
		errors.Is(err, services.ErrGuestPaymentDeclined):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	default:
		return err
	}
}
