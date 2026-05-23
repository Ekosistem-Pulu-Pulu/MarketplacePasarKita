package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"pasarkita-marketplace-backend/config"
)

type PaymentRequest struct {
	OrderID          string `json:"order_id"`
	UserID           string `json:"user_id"`
	FromUser         string `json:"from_user"`
	ToUserService    string `json:"to_user_service"`
	Amount           int64  `json:"amount"`
	MarketplaceFee   int64  `json:"marketplace_fee"`
	Metadata         string `json:"metadata"`
	AlamatPengiriman string `json:"alamat_pengiriman"`
}

type PaymentResult struct {
	PaymentRequestID string `json:"payment_request_id"`
	Status           string `json:"status"`
	GatewayFee       int64  `json:"gateway_fee"`
	Message          string `json:"message"`
}

type IntegrationService struct {
	cfg        config.Config
	httpClient *http.Client
}

func NewIntegrationService(cfg config.Config) *IntegrationService {
	return &IntegrationService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

func (s *IntegrationService) SendPaymentRequest(req PaymentRequest, authorization string) PaymentResult {
	if !s.cfg.EnableGatewayForward {
		return PaymentResult{
			PaymentRequestID: fmt.Sprintf("PAYREQ-%d", time.Now().UnixNano()),
			Status:           "PENDING_PAYMENT",
			GatewayFee:       calculateGatewayFee(req.Amount),
			Message:          "mock payment request created; marketplace does not mutate saldo",
		}
	}

	body, _ := json.Marshal(req)
	url := strings.TrimRight(s.cfg.APIGatewayBaseURL, "/") + "/integrator/smartbank/pembayaran_transaksi"
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return PaymentResult{Status: "PAYMENT_FAILED", Message: err.Error()}
	}

	httpReq.Header.Set("Content-Type", "application/json")
	if authorization != "" {
		httpReq.Header.Set("Authorization", authorization)
	}

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return PaymentResult{Status: "PAYMENT_PROCESSING", Message: "gateway unavailable: " + err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return PaymentResult{Status: "PAYMENT_FAILED", Message: fmt.Sprintf("gateway returned status %d", resp.StatusCode)}
	}

	return PaymentResult{
		PaymentRequestID: fmt.Sprintf("PAYREQ-%d", time.Now().UnixNano()),
		Status:           "PAYMENT_PROCESSING",
		GatewayFee:       calculateGatewayFee(req.Amount),
		Message:          "payment request forwarded to API Gateway",
	}
}

func calculateGatewayFee(amount int64) int64 {
	return amount * 5 / 1000
}
