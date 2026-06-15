package models

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestProductJSONMatchesFrontendContract(t *testing.T) {
	product := Product{
		ProductID:     "wireless-earbuds",
		NamaProduk:    "Wireless Earbuds",
		CategoryID:    "elektronik",
		Kategori:      "Elektronik",
		Harga:         299000,
		OriginalPrice: 349000,
		Discount:      14,
		Variants:      []string{"Hitam", "Putih"},
		Store:         Store{StoreID: "nusa-tech", Name: "Nusa Techspace", Location: "Bandung"},
	}

	payload, err := json.Marshal(product)
	if err != nil {
		t.Fatal(err)
	}
	body := string(payload)
	for _, key := range []string{`"id"`, `"name"`, `"categoryId"`, `"discount"`, `"variants"`, `"store"`} {
		if !strings.Contains(body, key) {
			t.Fatalf("frontend key %s tidak ditemukan pada %s", key, body)
		}
	}
	for _, legacyKey := range []string{`"product_id"`, `"nama_produk"`, `"harga"`} {
		if strings.Contains(body, legacyKey) {
			t.Fatalf("legacy key %s masih muncul pada %s", legacyKey, body)
		}
	}
}

func TestAccountJSONMatchesFrontendContract(t *testing.T) {
	payload, err := json.Marshal(struct {
		User    User        `json:"user"`
		Address UserAddress `json:"address"`
	}{
		User:    User{UserID: "USR001", Name: "Raka"},
		Address: UserAddress{AddressID: "addr-home", AddressLine: "Jl. Merdeka", PostalCode: "40162", IsDefault: true},
	})
	if err != nil {
		t.Fatal(err)
	}
	body := string(payload)
	for _, key := range []string{`"id"`, `"address"`, `"postalCode"`, `"isDefault"`} {
		if !strings.Contains(body, key) {
			t.Fatalf("frontend key %s tidak ditemukan pada %s", key, body)
		}
	}
	for _, legacyKey := range []string{`"user_id"`, `"address_id"`, `"address_line"`, `"postal_code"`, `"is_default"`} {
		if strings.Contains(body, legacyKey) {
			t.Fatalf("legacy key %s masih muncul pada %s", legacyKey, body)
		}
	}
}
