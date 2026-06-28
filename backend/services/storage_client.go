package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"

	"pasarkita-marketplace-backend/config"
)

// StorageClient adalah abstraction di atas berbagai backend object storage
// (Local/MinIO/S3/R2/Cloudinary). Marketplace hanya mencatat URL publik dari
// hasil Upload; pemindahan byte dan penyimpanan fisik menjadi tanggung jawab
// provider. Konvensi nama mengikuti pola LayananKlien yang sudah ada
// (LogistikKita dan SmartBank): NewStorageClient menerima cfg lalu
// mengembalikan implementasi siap-pakai.
type StorageClient interface {
	// Provider mengembalikan label singkat ("local" | "s3" | "cloudinary")
	// yang dipakai audit log dan frontend untuk menggambarkan sumber aset.
	Provider() string
	// Upload menulis konten dari r ke key dan mengembalikan URL publik absolut.
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (string, error)
	// Delete menghapus aset pada key. Idempotent: tidak error bila aset tidak ada.
	Delete(ctx context.Context, key string) error
}

// NewStorageClient memilih adapter berdasarkan cfg.StorageProvider.
// Nilai yang dikenal: "local" | "mock" (default), "s3" | "minio" | "r2"
// (semua share protokol AWS SigV4), "cloudinary".
func NewStorageClient(cfg config.Config) (StorageClient, error) {
	switch strings.ToLower(strings.TrimSpace(cfg.StorageProvider)) {
	case "", "mock", "local":
		return newLocalStorage(cfg), nil
	case "s3", "minio", "r2":
		return newS3Storage(cfg)
	case "cloudinary":
		return newCloudinaryStorage(cfg)
	default:
		return nil, fmt.Errorf("storage: provider %q tidak dikenali", cfg.StorageProvider)
	}
}

// UploadResult adalah payload balikan dari endpoint upload agar FE bisa
// langsung menempelkan URL ke form produk tanpa menyimpan kembali ke tabel
// product_images terpisah.
type UploadResult struct {
	Key         string `json:"key"`
	URL         string `json:"url"`
	Provider    string `json:"provider"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
	Ext         string `json:"ext,omitempty"`
}

// =================== Local / Mock ===================

type localStorage struct {
	rootDir string
	baseURL string
}

func newLocalStorage(cfg config.Config) *localStorage {
	root := strings.TrimSpace(cfg.StorageLocalRoot)
	if root == "" {
		root = "./uploads"
	}
	public := strings.TrimRight(cfg.StoragePublicURL, "/")
	if public == "" {
		public = "http://localhost:" + cfg.AppPort
	}
	return &localStorage{rootDir: root, baseURL: public}
}

func (l *localStorage) Provider() string { return "local" }

func (l *localStorage) Upload(_ context.Context, key string, r io.Reader, _ int64, _ string) (string, error) {
	full := filepath.Join(l.rootDir, key)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	f, err := os.OpenFile(full, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		_ = os.Remove(full)
		return "", err
	}
	return l.baseURL + "/" + strings.TrimLeft(key, "/"), nil
}

func (l *localStorage) Delete(_ context.Context, key string) error {
	err := os.Remove(filepath.Join(l.rootDir, key))
	if err != nil && errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

// =================== AWS SigV4 (S3 / MinIO / R2) ===================
// Implementasi AWS Signature V4 diserahkan di sini (PUT/DELETE) agar tidak
// menambah dependency aws-sdk-go-v2. MinIO, AWS S3, dan Cloudflare R2
// semuanya menerima signature yang sama sehingga satu adapter menutupi tiga
// provider.

type s3Storage struct {
	bucket    string
	region    string
	serviceURL string
	publicURL string
	accessKey string
	secretKey string
	client    *http.Client
}

func newS3Storage(cfg config.Config) (*s3Storage, error) {
	if cfg.StorageBucket == "" || cfg.StorageAccessKey == "" || cfg.StorageSecretKey == "" {
		return nil, fmt.Errorf("storage S3: bucket, access key, dan secret key wajib diisi")
	}
	region := cfg.StorageRegion
	if region == "" {
		region = "us-east-1"
	}
	serviceURL := strings.TrimRight(cfg.StorageBaseURL, "/")
	if serviceURL == "" {
		serviceURL = "https://s3." + region + ".amazonaws.com"
	}
	publicURL := strings.TrimRight(cfg.StoragePublicURL, "/")
	if publicURL == "" {
		publicURL = serviceURL + "/" + cfg.StorageBucket
	}
	return &s3Storage{
		bucket:    cfg.StorageBucket,
		region:    region,
		serviceURL: serviceURL,
		publicURL: publicURL,
		accessKey: cfg.StorageAccessKey,
		secretKey: cfg.StorageSecretKey,
		client:    &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func (s *s3Storage) Provider() string { return "s3" }

func (s *s3Storage) Upload(ctx context.Context, key string, r io.Reader, _ int64, contentType string) (string, error) {
	body, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	url := s.serviceURL + "/" + s.bucket + "/" + key
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-amz-acl", "public-read")
	if err := s.signRequest(req, body); err != nil {
		return "", err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage S3 unreachable: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage S3: PUT gagal %d: %s", resp.StatusCode, string(b))
	}
	return s.publicURL + "/" + key, nil
}

func (s *s3Storage) Delete(ctx context.Context, key string) error {
	url := s.serviceURL + "/" + s.bucket + "/" + key
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return err
	}
	if err := s.signRequest(req, nil); err != nil {
		return err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("storage S3 unreachable saat delete: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 && resp.StatusCode != http.StatusNotFound {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("storage S3: DELETE gagal %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

// signRequest mengisi header AWS V4 (Authorization + x-amz-*). Algoritma:
// canonical request → string to sign → signing key (HMAC berjenjang) → signature.
func (s *s3Storage) signRequest(req *http.Request, body []byte) error {
	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")

	var payloadHash string
	if body != nil {
		sum := sha256.Sum256(body)
		payloadHash = hex.EncodeToString(sum[:])
	} else {
		sum := sha256.Sum256([]byte(""))
		payloadHash = hex.EncodeToString(sum[:])
	}
	req.Header.Set("x-amz-content-sha256", payloadHash)
	req.Header.Set("x-amz-date", amzDate)

	host := req.URL.Host
	canonicalURI := req.URL.Path
	if canonicalURI == "" {
		canonicalURI = "/"
	}
	canonicalHeaders := "host:" + host + "\n" +
		"x-amz-acl:" + req.Header.Get("x-amz-acl") + "\n" +
		"x-amz-content-sha256:" + payloadHash + "\n" +
		"x-amz-date:" + amzDate + "\n"
	signedHeaders := "host;x-amz-acl;x-amz-content-sha256;x-amz-date"

	canonicalRequest := req.Method + "\n" +
		canonicalURI + "\n" +
		req.URL.RawQuery + "\n" +
		canonicalHeaders + "\n" +
		signedHeaders + "\n" +
		payloadHash

	algorithm := "AWS4-HMAC-SHA256"
	credentialScope := dateStamp + "/" + s.region + "/s3/aws4_request"
	stringToSign := algorithm + "\n" +
		amzDate + "\n" +
		credentialScope + "\n" +
		hex.EncodeToString(sha256Digest([]byte(canonicalRequest)))

	kDate := hmacSHA256([]byte("AWS4"+s.secretKey), dateStamp)
	kRegion := hmacSHA256(kDate, s.region)
	kService := hmacSHA256(kRegion, "s3")
	kSigning := hmacSHA256(kService, "aws4_request")
	signature := hex.EncodeToString(hmacSHA256(kSigning, stringToSign))

	authorization := algorithm + " Credential=" + s.accessKey + "/" + credentialScope +
		", SignedHeaders=" + signedHeaders + ", Signature=" + signature
	req.Header.Set("Authorization", authorization)
	return nil
}

func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

func sha256Digest(data []byte) []byte {
	sum := sha256.Sum256(data)
	return sum[:]
}

// =================== Cloudinary ===================

type cloudinaryStorage struct {
	cloudName string
	apiKey    string
	apiSecret string
	uploadURL string
	publicURL string
	client    *http.Client
}

func newCloudinaryStorage(cfg config.Config) (*cloudinaryStorage, error) {
	if cfg.StorageCloudName == "" || cfg.StorageAccessKey == "" || cfg.StorageSecretKey == "" {
		return nil, fmt.Errorf("storage Cloudinary: cloud_name, api_key, dan api_secret wajib diisi")
	}
	uploadURL := strings.TrimRight(cfg.StorageBaseURL, "/")
	if uploadURL == "" {
		uploadURL = fmt.Sprintf("https://api.cloudinary.com/v1_1/%s", cfg.StorageCloudName)
	}
	publicURL := strings.TrimRight(cfg.StoragePublicURL, "/")
	if publicURL == "" {
		publicURL = uploadURL
	}
	return &cloudinaryStorage{
		cloudName: cfg.StorageCloudName,
		apiKey:    cfg.StorageAccessKey,
		apiSecret: cfg.StorageSecretKey,
		uploadURL: uploadURL,
		publicURL: publicURL,
		client:    &http.Client{Timeout: 30 * time.Second},
	}, nil
}

func (c *cloudinaryStorage) Provider() string { return "cloudinary" }

func (c *cloudinaryStorage) Upload(ctx context.Context, key string, r io.Reader, _ int64, contentType string) (string, error) {
	body, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	folder := folderFromKey(key)
	params := map[string]string{"folder": folder, "timestamp": timestamp}
	signature := cloudinarySignature(params, c.apiSecret)

	form := &bytes.Buffer{}
	fw := multipart.NewWriter(form)
	if err := fw.WriteField("folder", folder); err != nil {
		return "", err
	}
	if err := fw.WriteField("api_key", c.apiKey); err != nil {
		return "", err
	}
	if err := fw.WriteField("timestamp", timestamp); err != nil {
		return "", err
	}
	if err := fw.WriteField("signature", signature); err != nil {
		return "", err
	}
	filePart, err := fw.CreateFormFile("file", filepath.Base(key))
	if err != nil {
		return "", err
	}
	if _, err := filePart.Write(body); err != nil {
		return "", err
	}
	_ = fw.Close()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.uploadURL+"/image/upload", form)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", fw.FormDataContentType())
	if contentType != "" {
		req.Header.Set("X-Upload-Content-Type", contentType)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage Cloudinary unreachable: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage Cloudinary: upload gagal %d: %s", resp.StatusCode, string(b))
	}
	var result struct {
		SecureURL string `json:"secure_url"`
		URL       string `json:"url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	if result.SecureURL != "" {
		return result.SecureURL, nil
	}
	if result.URL != "" {
		return result.URL, nil
	}
	return "", errors.New("storage Cloudinary: response tidak mengandung url")
}

func (c *cloudinaryStorage) Delete(ctx context.Context, key string) error {
	if c.apiKey == "" || c.apiSecret == "" {
		return nil
	}
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	publicID := strings.TrimSuffix(filepath.Base(key), filepath.Ext(key))
	params := map[string]string{"public_id": publicID, "timestamp": timestamp}
	signature := cloudinarySignature(params, c.apiSecret)

	form := &bytes.Buffer{}
	fw := multipart.NewWriter(form)
	_ = fw.WriteField("public_id", publicID)
	_ = fw.WriteField("timestamp", timestamp)
	_ = fw.WriteField("api_key", c.apiKey)
	_ = fw.WriteField("signature", signature)
	_ = fw.Close()

	url := c.publicURL + "/image/destroy"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, form)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", fw.FormDataContentType())
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("storage Cloudinary: destroy gagal %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func folderFromKey(key string) string {
	parts := strings.SplitN(key, "/", 2)
	if len(parts) < 2 {
		return ""
	}
	return strings.TrimRight(parts[0], "/")
}

// cloudinarySignature mengikuti rumus resmi: param disortir alfabetik, lalu
// digabung key=value&key=value... dan diakhiri api_secret, lalu di-hash SHA1.
func cloudinarySignature(params map[string]string, secret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var sb strings.Builder
	for _, k := range keys {
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(params[k])
		sb.WriteString("&")
	}
	sb.WriteString(secret)
	sum := sha1.Sum([]byte(sb.String()))
	return hex.EncodeToString(sum[:])
}

// uploadKeyAllowed membatasi folder hanya ke alfanumerik/dash/underscore dan
// satu level slash; pola "..", absolute path, atau karakter lain ditolak
// untuk mencegah path traversal pada Storage namespace bersama.
var uploadKeyAllowed = regexp.MustCompile(`^[a-zA-Z0-9_\-]+(/[a-zA-Z0-9_\-]+)*$`)

// NewUploadKey membentuk key deterministik dengan struktur
// <folder>/<sellerID>/<uuid>.<ext>. Folder divalidasi ketat terhadap pola
// uploadKeyAllowed; backslash, "..", atau path absolut akan menghasilkan
// error agar key tidak pernah keluar dari namespace yang dimaksud.
//
// Seller namespace (<sellerID> di tengah key) dimanfaatkan DeleteByOwner
// untuk membatasi delete ke aset milik caller.
func NewUploadKey(sellerID, folder, originalName string) (string, error) {
	if folder == "" {
		folder = "products"
	}
	if strings.Contains(folder, "\\") || strings.Contains(folder, "..") || strings.HasPrefix(folder, "/") || filepath.IsAbs(folder) {
		return "", fmt.Errorf("storage: folder %q tidak valid", folder)
	}
	if !uploadKeyAllowed.MatchString(folder) {
		return "", fmt.Errorf("storage: folder hanya boleh alfanumerik, dash, dan underscore (mis. 'products')")
	}
	if strings.TrimSpace(sellerID) == "" {
		return "", errors.New("storage: sellerID kosong")
	}
	cleanName := filepath.Base(strings.TrimSpace(originalName))
	if cleanName == "" || cleanName == "." || cleanName == "/" {
		return "", errors.New("storage: nama file tidak valid")
	}
	ext := strings.ToLower(filepath.Ext(cleanName))
	if ext == "" {
		ext = ".bin"
	}
	return folder + "/" + strings.TrimSpace(sellerID) + "/" + uuid.NewString() + ext, nil
}

// DeleteByOwner menolak menghapus key yang tidak memiliki prefiks
// folder/<ownerID>/ sehingga satu seller tidak dapat menghapus aset seller
// lain pada bucket yang dipakai bersama. Endpoint administratif yang butuh
// menghapus sembarang key boleh langsung memanggil Delete pada StorageClient.
func DeleteByOwner(ctx context.Context, s StorageClient, folder, ownerID, key string) error {
	expected := strings.TrimRight(folder, "/") + "/" + strings.TrimSpace(ownerID) + "/"
	if !strings.HasPrefix(key, expected) {
		return fmt.Errorf("storage: key %q bukan milik owner %s", key, ownerID)
	}
	return s.Delete(ctx, key)
}
