package controllers

import (
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

type PlatformController struct {
	service *services.PlatformService
	auth    *services.AuthService
	storage services.StorageClient
}

func NewPlatformController(service *services.PlatformService, auth *services.AuthService, storage services.StorageClient) *PlatformController {
	return &PlatformController{service: service, auth: auth, storage: storage}
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
	return created(ctx, c.service.PresentOrder(order))
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
	return ok(ctx, c.service.PresentOrders(orders))
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
	return ok(ctx, c.service.PresentOrders(orders))
}

func (c *PlatformController) ListSellerProducts(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	products, err := c.service.ListSellerProducts(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, products)
}

func (c *PlatformController) SaveSellerProduct(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	var input services.ProductInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload JSON tidak valid")
	}
	product, err := c.service.SaveSellerProduct(claims.UserID, input)
	if err != nil {
		return mapServiceError(err)
	}
	return created(ctx, product)
}

// UploadImage menerima multipart file dari seller/admin-katalog dan
// mengembalikan URL publik hasil simpan ke backend StorageClient yang aktif
// (Local / S3 / MinIO / R2 / Cloudinary). Hasil URL disimpan seller di
// field `images` saat membuat produk.
//
// Validasi keamanan:
//   - Ukuran file 1 byte – 4MB (Fiber BodyLimit middleware mengangkat
//     batas request menjadi 8MB agar error reaching handler tetap ramah).
//   - MIME dideteksi ulang dari 512 byte pertama file (http.DetectContentType)
//     sehingga header Content-Type dari klien tidak dipercaya.
//   - Key dihasilkan oleh NewUploadKey yang menolak pola path-traversal.
func (c *PlatformController) UploadImage(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	file, err := ctx.FormFile("file")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "field 'file' wajib diisi sebagai multipart")
	}
	if file.Size == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "file kosong")
	}
	const maxSize int64 = 4 * 1024 * 1024 // 4 MB
	if file.Size > maxSize {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "ukuran gambar melebihi 4MB")
	}

	src, err := file.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "gagal membaca upload")
	}
	defer src.Close()

	// Sniff magic bytes — jangan percaya Content-Type dari klien.
	head := make([]byte, 512)
	n, _ := io.ReadFull(src, head)
	detected := strings.ToLower(http.DetectContentType(head[:n]))
	allowed := map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true}
	if !allowed[detected] {
		return fiber.NewError(fiber.StatusUnsupportedMediaType, "file bukan gambar yang valid (MIME terdeteksi: "+detected+")")
	}
	// Kembalikan stream ke awal agar seluruh byte terkirim ke provider.
	// multipart.File sudah meng-embed io.Seeker lewat interface-nya.
	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "gagal memposisikan ulang stream upload")
	}

	folder := strings.TrimSpace(ctx.FormValue("folder"))
	if folder == "" {
		folder = "products"
	}
	key, err := services.NewUploadKey(claims.UserID, folder, file.Filename)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	publicURL, err := c.storage.Upload(ctx.UserContext(), key, src, file.Size, detected)
	if err != nil {
		return mapServiceError(err)
	}
	res := services.UploadResult{
		Key:         key,
		URL:         publicURL,
		Provider:    c.storage.Provider(),
		ContentType: detected,
		Size:        file.Size,
		Ext:         filepath.Ext(file.Filename),
	}
	return created(ctx, res)
}

func (c *PlatformController) SellerDashboard(ctx *fiber.Ctx) error {
	claims, err := requireClaims(ctx, c.auth)
	if err != nil {
		return err
	}
	dashboard, err := c.service.SellerDashboard(claims.UserID)
	if err != nil {
		return err
	}
	return ok(ctx, dashboard)
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
	return ok(ctx, c.service.PresentOrder(order))
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
	return ok(ctx, c.service.PresentOrder(order))
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

func (c *PlatformController) Categories(ctx *fiber.Ctx) error {
	return ok(ctx, c.service.Categories())
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
