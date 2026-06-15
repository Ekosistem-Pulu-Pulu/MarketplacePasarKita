package services

import (
	"encoding/json"
	"strings"
	"testing"

	"pasarkita-marketplace-backend/models"
)

func TestProductInputNormalizesFrontendPayload(t *testing.T) {
	input := ProductInput{
		ID:          "smart-lamp",
		Name:        "Smart Lamp",
		Description: "Lampu pintar untuk rumah.",
		Price:       149000,
		Stock:       24,
		Category:    "Rumah Tangga",
		Image:       "https://example.com/lamp.jpg",
	}

	input.normalize()

	if input.ProductID != input.ID || input.NamaProduk != input.Name || input.Harga != input.Price || input.Stok != input.Stock {
		t.Fatalf("payload frontend tidak dinormalisasi: %+v", input)
	}
	if input.CategoryID != "rumah-tangga" || input.ImageURL != input.Image {
		t.Fatalf("kategori atau gambar tidak dinormalisasi: %+v", input)
	}
}

func TestCheckoutInputUsesFrontendPayload(t *testing.T) {
	var input CartCheckoutInput
	payload := []byte(`{"addressId":"addr-home","shipping":{"carrier":"JNE","service":"REG"},"payment":{"id":"virtual-account"},"voucherCode":""}`)
	if err := json.Unmarshal(payload, &input); err != nil {
		t.Fatal(err)
	}
	if input.AddressID != "addr-home" || input.Shipping.Carrier != "JNE" || input.Payment.ID != "virtual-account" {
		t.Fatalf("payload frontend tidak terbaca: %+v", input)
	}
}

func TestFrontendOrderDoesNotExposeLegacyKeys(t *testing.T) {
	order := FrontendOrder{
		ID:     "PK-2026-000001",
		Status: "Menunggu Pembayaran",
		Items: []FrontendOrderItem{{
			ProductID: "earbuds-tws-aero",
			Qty:       1,
			Product:   models.Product{ProductID: "earbuds-tws-aero", NamaProduk: "Earbuds TWS"},
		}},
		Totals: FrontendOrderTotals{Total: 329000},
	}
	payload, err := json.Marshal(order)
	if err != nil {
		t.Fatal(err)
	}
	body := string(payload)
	for _, key := range []string{`"id"`, `"status"`, `"productId"`, `"totals"`, `"total"`} {
		if !strings.Contains(body, key) {
			t.Fatalf("frontend key %s tidak ditemukan pada %s", key, body)
		}
	}
	for _, legacyKey := range []string{`"order_id"`, `"status_order"`, `"product_id"`, `"total_bayar"`} {
		if strings.Contains(body, legacyKey) {
			t.Fatalf("legacy key %s masih muncul pada %s", legacyKey, body)
		}
	}
}

func TestFrontendOrderStatus(t *testing.T) {
	cases := map[string]string{
		models.StatusPendingPayment:   "Menunggu Pembayaran",
		models.StatusPaymentProcess:   "Pembayaran Diproses",
		models.StatusReadyForShipment: "Pesanan Dikemas",
		models.StatusShipped:          "Pesanan Dikirim",
		models.StatusCompleted:        "Pesanan Selesai",
	}
	for status, expected := range cases {
		if actual := frontendOrderStatus(status); actual != expected {
			t.Fatalf("status %s: ingin %q, mendapat %q", status, expected, actual)
		}
	}
}
