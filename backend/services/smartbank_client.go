package services

import (
	"bytes"
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
 * Klien SmartBank adalah HTTP wrapper untuk pusat transaksi keuangan di
 * ekosistem. Marketplace TIDAK BOLEH memproses pembayaran, memvalidasi saldo,
 * atau menghitung fee internal bank/gateway/pajak sendiri. Semua logic itu
 * berada di SmartBank. Marketplace hanya meneruskan nominal belanja dan fee
 * marketplace (2%) yang menjadi revenue-nya.
 */

const (
	SmartBankPercentBankFee     int64 = 1
	SmartBankPercentGatewayFee int64 = 5 // 0.5%
	SmartBankPercentTax        int64 = 2
)

// SmartBankPaymentItem dikirim sebagai bagian dari payment intent agar SmartBank
// bisa mencatat ledger per item. Marketplace tidak menyimpan ledger di sisi-nya.
type SmartBankPaymentItem struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Harga     int64  `json:"harga"`
	LineTotal int64  `json:"line_total"`
	SellerID  string `json:"seller_id"`
}

type SmartBankCustomer struct {
	FullName string `json:"nama_lengkap"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Country  string `json:"country"`
}

type SmartBankPaymentRequest struct {
	OrderID         string                 `json:"order_id"`
	MarketplaceCode string                 `json:"marketplace_code"`
	Source          string                 `json:"source"` // MARKETPLACE
	Channel         string                 `json:"payment_method"`
	Customer        SmartBankCustomer      `json:"customer"`
	Items           []SmartBankPaymentItem `json:"items"`
	Subtotal        int64                  `json:"subtotal"`
	MarketplaceFee  int64                  `json:"marketplace_fee"`
	ShippingCost    int64                  `json:"shipping_cost"`
	Metadata        map[string]string      `json:"metadata"`
	ReturnURL       string                 `json:"return_url,omitempty"`
}

type SmartBankPaymentBreakdown struct {
	Subtotal       int64  `json:"subtotal"`
	MarketplaceFee int64  `json:"marketplace_fee"`
	ShippingCost   int64  `json:"shipping_cost"`
	BankFee        int64  `json:"bank_fee"`
	GatewayFee     int64  `json:"gateway_fee"`
	SystemTax      int64  `json:"system_tax"`
	FinalTotal     int64  `json:"final_total"`
	Currency       string `json:"currency"`
}

type SmartBankPaymentResult struct {
	PaymentIntentID string                  `json:"payment_intent_id"`
	Status          string                  `json:"status"`
	Method          string                  `json:"payment_method"`
	MethodLabel     string                  `json:"payment_method_label"`
	VirtualAccount  string                  `json:"virtual_account,omitempty"`
	EWalletQR       string                  `json:"ewallet_qr,omitempty"`
	Instructions    string                  `json:"instructions,omitempty"`
	ExpiresAt       string                  `json:"expires_at"`
	Breakdown       SmartBankPaymentBreakdown `json:"breakdown"`
	PaymentURL      string                  `json:"payment_url,omitempty"`
}

type SmartBankStatus struct {
	PaymentIntentID string                  `json:"payment_intent_id"`
	Status          string                  `json:"status"`
	PaidAt          *time.Time              `json:"paid_at,omitempty"`
	FailureReason   string                  `json:"failure_reason,omitempty"`
	Breakdown       SmartBankPaymentBreakdown `json:"breakdown"`
}

type SmartBankClient struct {
	cfg        config.Config
	httpClient *http.Client
}

func NewSmartBankClient(cfg config.Config) *SmartBankClient {
	return &SmartBankClient{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 8 * time.Second},
	}
}

// CreatePaymentIntent membuat payment intent di SmartBank. Response berisi
// seluruh fee breakdown (bank fee, gateway fee, system tax) yang dihitung oleh
// SmartBank. Marketplace TIDAK BOLEH menghitung sendiri fee tersebut.
func (c *SmartBankClient) CreatePaymentIntent(ctx context.Context, req SmartBankPaymentRequest) (*SmartBankPaymentResult, error) {
	if req.OrderID == "" {
		return nil, errors.New("SmartBank: order_id wajib diisi")
	}
	if req.Subtotal <= 0 {
		return nil, errors.New("SmartBank: subtotal tidak valid")
	}
	if req.Customer.Email == "" && req.Customer.Phone == "" {
		return nil, errors.New("SmartBank: customer email atau phone wajib diisi")
	}

	if !c.cfg.EnableSmartBankFwd {
		return mockSmartBankPayment(req), nil
	}

	body, _ := json.Marshal(req)
	url := strings.TrimRight(c.cfg.SmartBankBaseURL, "/") + "/api/payment/intents"
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if c.cfg.SmartBankSecret != "" {
		httpReq.Header.Set("X-SmartBank-Signature", c.signBody(body))
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("SmartBank unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("SmartBank menolak payment intent: status %d", resp.StatusCode)
	}
	var out SmartBankPaymentResult
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("SmartBank response invalid: %w", err)
	}
	return &out, nil
}

// GetPaymentStatus untuk polling status pembayaran (misalnya oleh FE setelah redirect).
func (c *SmartBankClient) GetPaymentStatus(ctx context.Context, paymentIntentID string) (*SmartBankStatus, error) {
	if !c.cfg.EnableSmartBankFwd {
		return &SmartBankStatus{
			PaymentIntentID: paymentIntentID,
			Status:          "PENDING_PAYMENT",
		}, nil
	}
	url := fmt.Sprintf("%s/api/payment/intents/%s", strings.TrimRight(c.cfg.SmartBankBaseURL, "/"), paymentIntentID)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	if c.cfg.SmartBankSecret != "" {
		httpReq.Header.Set("X-SmartBank-Signature", c.signBody(nil))
	}
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("SmartBank status gagal: status %d", resp.StatusCode)
	}
	var out SmartBankStatus
	return &out, json.NewDecoder(resp.Body).Decode(&out)
}

func (c *SmartBankClient) signBody(body []byte) string {
	mac := hmac.New(sha256.New, []byte(c.cfg.SmartBankSecret))
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

// mockSmartBankPayment meniru response SmartBank: fee breakdown dihitung
// oleh mock sehingga marketplace tetap menerima angka final_total tunggal.
// Marketplace tidak boleh menyimpan atau mereplikasi lagi nilai fee ini.
func mockSmartBankPayment(req SmartBankPaymentRequest) *SmartBankPaymentResult {
	subtotal := req.Subtotal
	marketplace := req.MarketplaceFee
	shipping := req.ShippingCost
	bankFee := computeSmartBankFee(subtotal+marketplace+shipping, SmartBankPercentBankFee, 100)
	gatewayFee := computeSmartBankFee(subtotal+marketplace+shipping, SmartBankPercentGatewayFee, 1000)
	taxBase := subtotal + marketplace + shipping + bankFee + gatewayFee
	tax := computeSmartBankFee(taxBase, SmartBankPercentTax, 100)
	finalTotal := subtotal + marketplace + shipping + bankFee + gatewayFee + tax

	method := strings.ToUpper(strings.TrimSpace(req.Channel))
	if method == "" {
		method = "VIRTUAL_ACCOUNT"
	}
	mac := sha256.New()
	mac.Write([]byte(req.OrderID + ":" + req.Customer.Email + ":" + req.Customer.Phone))
	hash := hex.EncodeToString(mac.Sum(nil))

	result := &SmartBankPaymentResult{
		PaymentIntentID: "SBI-" + hash[:12],
		Status:          "PENDING_PAYMENT",
		Method:          method,
		MethodLabel:     methodLabel(method),
		Instructions:    methodInstructions(method),
		Breakdown: SmartBankPaymentBreakdown{
			Subtotal:       subtotal,
			MarketplaceFee: marketplace,
			ShippingCost:   shipping,
			BankFee:        bankFee,
			GatewayFee:     gatewayFee,
			SystemTax:      tax,
			FinalTotal:     finalTotal,
			Currency:       "IDR",
		},
	}
	switch method {
	case "VIRTUAL_ACCOUNT":
		result.VirtualAccount = "8808" + hash[:10]
	case "EWALLET":
		result.EWalletQR = "data:image/svg+xml;base64," + hash[:24]
	case "COD":
		result.Status = "AWAITING_DELIVERY"
		result.Instructions = "Bayar tunai saat kurir mengantar pesanan."
	}
	result.ExpiresAt = time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)
	return result
}

func computeSmartBankFee(base int64, percentNumerator, percentDenominator int64) int64 {
	if base <= 0 {
		return 0
	}
	return base * percentNumerator / percentDenominator
}

func methodLabel(method string) string {
	switch method {
	case "VIRTUAL_ACCOUNT", "VA":
		return "Virtual Account"
	case "EWALLET":
		return "E-Wallet"
	case "COD":
		return "Bayar di Tempat"
	default:
		return method
	}
}

func methodInstructions(method string) string {
	switch method {
	case "VIRTUAL_ACCOUNT":
		return "Transfer ke nomor Virtual Account yang tertera sebelum jatuh tempo."
	case "EWALLET":
		return "Buka aplikasi E-Wallet kamu, pilih menu bayar lalu masukkan kode pembayaran."
	case "COD":
		return "Bayar tunai kepada kurir saat barang diterima."
	default:
		return ""
	}
}
