// Package logger mengatur slog default untuk PasarKita backend.
//
// Pemakaian slog stdlib (Go 1.21+) sengaja dipilih: zero dependency,
// format output JSON untuk produksi (siap di-ingest log aggregator)
// dan text human-friendly untuk development. Default logger di-set
// lewat slog.SetDefault sehingga service dan middleware bisa langsung
// memanggil slog.Info / slog.Warn / slog.Error tanpa harus menerima
// dependency lewat constructor (mengurangi invasivitas refactor dan
// sesuai dengan constraints proyek sekolah).
//
// Inisialisasi terjadi di main.go sebelum fiber.New agar middleware
// AccessLog sudah bisa menulis ke handler yang benar sejak request
// pertama. Pattern penggantian log.Fatalf Go stdlib dilakukan melalui
// helper Fatal() yang memanggil slog.Error lalu os.Exit(1) — slog
// tidak menyediakan Fatal secara built-in.
package logger

import (
	"log/slog"
	"os"
	"strings"
)

// Init mengkonfigurasi slog default berdasarkan APP_ENV.
// "production" → JSON handler cocok untuk log aggregator.
// selainnya     → text handler yang lebih mudah dibaca manusia saat
// debug. Output selalu ke stderr (stderr lebih cocok untuk log
// dibanding stdout yang biasa dipakai untuk app output).
func Init(appEnv string) {
	level := slog.LevelInfo
	handlerOpts := &slog.HandlerOptions{Level: level}

	var handler slog.Handler
	if strings.EqualFold(strings.TrimSpace(appEnv), "production") {
		handler = slog.NewJSONHandler(os.Stderr, handlerOpts)
	} else {
		handler = slog.NewTextHandler(os.Stderr, handlerOpts)
	}
	slog.SetDefault(slog.New(handler))
}

// Fatal mencatat pesan error terstruktur lalu keluar dari proses.
// Digunakan sebagai pengganti log.Fatalf agar:
//   - pesan diag masuk slog dengan field terstruktur,
//   - keluar deterministik lewat os.Exit(1) yang tidak di-wrap recover.
func Fatal(msg string, args ...any) {
	slog.Error(msg, args...)
	os.Exit(1)
}
