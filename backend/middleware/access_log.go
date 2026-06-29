package middleware

import (
	"log/slog"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"pasarkita-marketplace-backend/services"
)

// skipAccessLog berisi path dan prefix yang dibungkam dari access log.
// /health melayani probe service mesh / load balancer dan dipanggil
// terus-menerus tanpa payload bisnis — tidak relevan untuk diagnosa
// request user. /uploads menyajikan file statis gambar produk yang
// traffic-nya bisa sangat tinggi dan tidak membawa aksi pengguna;
// tidak perlu noise log. Prefix /uploads/ mencakup permintaan untuk
// file individual di bawah direktori tersebut.
var skipAccessLog = map[string]struct{}{
	"/health":  {},
	"/uploads": {},
}

// skipAccessLogPrefix menangkap seluruh subtree /uploads/<file>.
const skipAccessLogPrefix = "/uploads/"

// AccessLog mengembalikan Fiber middleware yang menulis satu entri
// slog per request. Field yang dicatat: request_id (kalau middleware
// requestid sudah terpasang sebelum middleware ini), method, path,
// status, latency_ms, ip, user_agent, dan user_id (kalau klaim JWT
// sudah tersedia di ctx.Locals lewat middleware.Authenticate).
//
// Level log berubah sesuai hasil:
//   - status >= 500: slog.Error
//   - status 400-499: slog.Warn
//   - status 2xx/3xx: slog.Info
//
// Middleware dipanggil paling awal (setelah recover) agar durasi
// mencakup waktu yang dihabiskan di middleware lain (cors, helmet,
// auth, require-roles, dll).
func AccessLog() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		path := ctx.Path()
		if _, skip := skipAccessLog[path]; skip {
			return ctx.Next()
		}
		if strings.HasPrefix(path, "/uploads/") {
			return ctx.Next()
		}

		start := time.Now()
		err := ctx.Next()
		latencyMS := float64(time.Since(start).Microseconds()) / 1000.0

		status := ctx.Response().StatusCode()
		requestID, _ := ctx.Locals("requestid").(string)
		userID := ""
		role := ""
		if claims, ok := ctx.Locals(ClaimsLocal).(*services.JWTClaims); ok && claims != nil {
			userID = claims.UserID
			role = claims.Role
		}

		attrs := []any{
			slog.String("request_id", requestID),
			slog.String("method", ctx.Method()),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Float64("latency_ms", latencyMS),
			slog.String("ip", ctx.IP()),
			slog.String("user_agent", ctx.Get(fiber.HeaderUserAgent)),
		}
		if userID != "" {
			attrs = append(attrs, slog.String("user_id", userID), slog.String("role", role))
		}

		msg := "http_request"
		switch {
		case status >= 500:
			slog.Error(msg, attrs...)
		case status >= 400:
			slog.Warn(msg, attrs...)
		default:
			slog.Info(msg, attrs...)
		}
		return err
	}
}
