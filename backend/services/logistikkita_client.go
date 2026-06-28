package services

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"pasarkita-marketplace-backend/config"
)

/*
 * Klien LogistikKita adalah HTTP wrapper untuk aplikasi LogistikKita di
 * ekosistem. Marketplace TIDAK BOLEH menghitung ongkir sendiri; seluruh
 * proses perhitungan biaya dan pemilihan metode pengiriman dilakukan oleh
 * LogistikKita. Marketplace hanya menyimpan `rate_id` yang berlaku sesuai
 * TTL agar dapat dipakai saat checkout dan saat meminta shipment.
 */

// ShippingDestination merepresentasikan alamat tujuan yang dipakai LogistikKita
// untuk menghitung ongkir. Field disusun sesuai prioritas perhitungan yang
// diminta: Kota → Kecamatan → Kelurahan → AlamatLengkap.
type ShippingDestination struct {
	Country       string `json:"country"`
	Kota          string `json:"kota"`
	Kecamatan     string `json:"kecamatan"`
	Kelurahan     string `json:"kelurahan"`
	AlamatLengkap string `json:"alamat_lengkap"`
	KodePos       string `json:"kode_pos,omitempty"`
}

type ShippingRequest struct {
	Destination ShippingDestination `json:"destination"`
	Items       []ShippingItem      `json:"items"`
}

type ShippingItem struct {
	ProductID string `json:"product_id"`
	Qty       int    `json:"qty"`
	BeratGram int    `json:"berat_gram"`
	Harga     int64  `json:"harga"`
}

// ShippingRate adalah opsi pengiriman yang dikembalikan LogistikKita.
// `RateID` adalah identifier yang dapat dipakai untuk melakukan shipment
// nanti dengan harga yang sudah dikunci (TTL tertentu).
type ShippingRate struct {
	RateID       string `json:"rate_id"`
	Courier      string `json:"courier"`
	Service      string `json:"service"`
	Label        string `json:"label"`
	Description  string `json:"description"`
	Price        int64  `json:"price"`
	ETADays      string `json:"eta_days"`
	ValidUntil   string `json:"valid_until"`
	InsuranceFee int64  `json:"insurance_fee,omitempty"`
}

type ShippingRateList struct {
	Destination ShippingDestination `json:"destination"`
	Rates       []ShippingRate      `json:"rates"`
	Cached      bool                `json:"cached"`
}

// ShipmentRequest adalah payload yang dikirim ke LogistikKita untuk memicu
// proses pengiriman setelah pembayaran SmartBank berhasil.
type ShipmentRequest struct {
	OrderID      string              `json:"order_id"`
	RateID       string              `json:"rate_id"`
	Destination  ShippingDestination `json:"destination"`
	Recipient    RecipientPayload    `json:"recipient"`
	Items        []ShippingItem      `json:"items"`
	DeclaredNote string              `json:"declared_note,omitempty"`
}

type RecipientPayload struct {
	NamaPenerima string `json:"nama_penerima"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
}

type ShipmentResult struct {
	ShipmentRef   string `json:"shipment_ref"`
	Waybill       string `json:"waybill"`
	Courier       string `json:"courier"`
	Service       string `json:"service"`
	Status        string `json:"status"`
	ETA           string `json:"eta_days"`
	ShippingCost  int64  `json:"shipping_cost"`
	PaymentCharge string `json:"payment_charge_status,omitempty"`
}

type LogistikKitaClient struct {
	cfg        config.Config
	httpClient *http.Client
}

func NewLogistikKitaClient(cfg config.Config) *LogistikKitaClient {
	return &LogistikKitaClient{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 8 * time.Second},
	}
}

// GetRates meminta daftar opsi pengiriman berdasarkan alamat tujuan dan berat item.
// Ini adalah satu-satunya cara Marketplace mendapatkan ongkir.
func (c *LogistikKitaClient) GetRates(ctx context.Context, req ShippingRequest) (*ShippingRateList, error) {
	if req.Destination.Kota == "" || req.Destination.Kecamatan == "" || req.Destination.Kelurahan == "" {
		return nil, errors.New("LogistikKita: tujuan harus menyertakan kota, kecamatan, dan kelurahan")
	}
	if len(req.Items) == 0 {
		return nil, errors.New("LogistikKita: minimal satu produk diperlukan")
	}

	if !c.cfg.EnableLogistikKitaFwd {
		return mockLogistikRates(req, c.cfg.GuestCheckoutRateTTL), nil
	}

	body, _ := json.Marshal(req)
	url := strings.TrimRight(c.cfg.LogistikKitaBaseURL, "/") + "/api/shipping/rates"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	if c.cfg.LogistikKitaSecret != "" {
		httpReq.Header.Set("X-LogistikKita-Signature", c.signBody(body))
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("LogistikKita unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("LogistikKita mengembalikan status %d", resp.StatusCode)
	}

	var out ShippingRateList
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("LogistikKita response invalid: %w", err)
	}
	return &out, nil
}

// CreateShipment memicu pengiriman barang setelah pembayaran berhasil. Marketplace
// menyimpan shipment_ref dan waybill untuk ditampilkan di halaman status order.
func (c *LogistikKitaClient) CreateShipment(ctx context.Context, req ShipmentRequest) (*ShipmentResult, error) {
	if req.RateID == "" {
		return nil, errors.New("LogistikKita: rate_id wajib diisi untuk memicu shipment")
	}
	if !c.cfg.EnableLogistikKitaFwd {
		return mockLogistikShipment(req), nil
	}

	body, _ := json.Marshal(req)
	url := strings.TrimRight(c.cfg.LogistikKitaBaseURL, "/") + "/api/shipping/shipments"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if c.cfg.LogistikKitaSecret != "" {
		httpReq.Header.Set("X-LogistikKita-Signature", c.signBody(body))
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("LogistikKita unreachable saat shipment: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("LogistikKita menolak shipment: status %d", resp.StatusCode)
	}
	var out ShipmentResult
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

// TrackShipment mengambil status terkini dari LogistikKita. Digunakan saat user
// membuka halaman detail order untuk polling status pengiriman.
func (c *LogistikKitaClient) TrackShipment(ctx context.Context, waybill string) (*ShipmentResult, error) {
	if !c.cfg.EnableLogistikKitaFwd {
		return &ShipmentResult{
			Waybill: waybill,
			Status:  "IN_TRANSIT",
			ETA:     "2-4 hari",
		}, nil
	}
	url := fmt.Sprintf("%s/api/shipping/tracking/%s", strings.TrimRight(c.cfg.LogistikKitaBaseURL, "/"), waybill)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	if c.cfg.LogistikKitaSecret != "" {
		httpReq.Header.Set("X-LogistikKita-Signature", c.signBody(nil))
	}
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("LogistikKita tracking gagal: status %d", resp.StatusCode)
	}
	var out ShipmentResult
	return &out, json.NewDecoder(resp.Body).Decode(&out)
}

func (c *LogistikKitaClient) signBody(body []byte) string {
	mac := hmac.New(sha256.New, []byte(c.cfg.LogistikKitaSecret))
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

// mockLogistikRates menyusun tarif ongkir deterministik. Prioritas perhitungan
// adalah Kota → Kecamatan → Kelurahan (sesuai spesifikasi user). Marketplace
// tidak memiliki business logic perhitungan sendiri; mock ini meniru response
// LogistikKita untuk mode pengembangan tanpa service nyata.
func mockLogistikRates(req ShippingRequest, ttl time.Duration) *ShippingRateList {
	key := req.Destination.Kota + "|" + req.Destination.Kecamatan + "|" + req.Destination.Kelurahan
	hash := sha256.Sum256([]byte(key))
	baseSeed := int64(hash[0])%3 + int64(hash[1])%5

	totalWeight := 0
	for _, item := range req.Items {
		totalWeight += item.BeratGram * item.Qty
	}
	if totalWeight <= 0 {
		totalWeight = 500
	}

	couriers := []struct {
		Courier string
		Service string
		Label   string
		Desc    string
		Eta     string
		Factor  int64
	}{
		{"SiCepat", "HALU", "SiCepat HALU", "Pickup sendiri, sampai tujuan", "2-5 hari", 10},
		{"JNE", "REG", "JNE REG", "Layanan reguler dengan jangkauan luas", "3-6 hari", 9},
		{"JNE", "YES", "JNE YES", "Yakin Esok Sampai", "1 hari", 17},
		{"AnterAja", "NEXT", "AnterAja Next Day", "Pengiriman prioritas 1 hari", "1 hari", 22},
	}

	expires := time.Now().Add(ttl).UTC().Format(time.RFC3339)
	rates := make([]ShippingRate, 0, len(couriers))
	for index, courier := range couriers {
		basePrice := int64(totalWeight) * courier.Factor / 10
		floor := int64(5000 + int(hash[index])%15*1000)
		price := basePrice + floor
		// Tambahkan variasi kecil supaya harga berbeda walau kota sama
		price += baseSeed * 500
		if courier.Service == "REG" {
			price += 2500
		}
		rates = append(rates, ShippingRate{
			RateID:      fmt.Sprintf("LK-RATE-%x-%d", hash[:4], index),
			Courier:     courier.Courier,
			Service:     courier.Service,
			Label:       courier.Label,
			Description: courier.Desc,
			Price:       price,
			ETADays:     courier.Eta,
			ValidUntil:  expires,
		})
	}

	return &ShippingRateList{
		Destination: req.Destination,
		Rates:       rates,
		Cached:      false,
	}
}

func mockLogistikShipment(req ShipmentRequest) *ShipmentResult {
	mac := sha256.New()
	mac.Write([]byte(req.RateID + req.OrderID))
	sum := hex.EncodeToString(mac.Sum(nil))
	return &ShipmentResult{
		ShipmentRef:  "SHIP-" + sum[:10],
		Waybill:      sum[:14],
		Courier:      "SiCepat",
		Service:      "HALU",
		Status:       "SCHEDULED_PICKUP",
		ETA:          "2-4 hari",
		ShippingCost: 0, // harga tetap mengikuti rate lock
	}
}
