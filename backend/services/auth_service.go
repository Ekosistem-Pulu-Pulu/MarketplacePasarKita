package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

const jwtIssuer = "pasarkita-marketplace"

type AccountUser struct {
	UserID string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResult struct {
	Token        string      `json:"token"`
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	TokenType    string      `json:"tokenType"`
	ExpiresAt    time.Time   `json:"expiresAt"`
	User         AccountUser `json:"user"`
}

type JWTClaims struct {
	Subject   string `json:"sub"`
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Issuer    string `json:"iss"`
	TokenType string `json:"token_type"`
	JWTID     string `json:"jti"`
	IssuedAt  int64  `json:"iat"`
	Expires   int64  `json:"exp"`
}

type AuthService struct {
	jwtSecret  string
	accessTTL  time.Duration
	refreshTTL time.Duration
	users      *repositories.UserRepository
	refresh    *repositories.RefreshTokenRepository
}

func NewAuthService(jwtSecret string, accessTTL, refreshTTL time.Duration, users *repositories.UserRepository, refresh *repositories.RefreshTokenRepository) *AuthService {
	return &AuthService{jwtSecret: jwtSecret, accessTTL: accessTTL, refreshTTL: refreshTTL, users: users, refresh: refresh}
}

func (s *AuthService) AccountUsers() ([]AccountUser, error) {
	dbUsers, err := s.users.ListPublic()
	if err != nil {
		return nil, err
	}
	users := make([]AccountUser, 0, len(dbUsers))
	for _, user := range dbUsers {
		users = append(users, publicAccountUser(&user))
	}
	return users, nil
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	user, err := s.users.FindByEmail(input.Email)
	if err != nil || user.Status != "ACTIVE" || !models.CheckPassword(user.PasswordHash, input.Password) {
		return nil, ErrInvalidCredentials
	}
	return s.issueSession(user)
}

func (s *AuthService) Register(name, email, password, phone string) (*AuthResult, error) {
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || email == "" || password == "" {
		return nil, fmt.Errorf("%w: nama, email, dan password wajib diisi", ErrBadRequest)
	}
	if len(password) < 12 || len([]byte(password)) > 72 {
		return nil, fmt.Errorf("%w: password harus 12 sampai 72 karakter", ErrBadRequest)
	}
	if _, err := s.users.FindByEmail(email); err == nil {
		return nil, fmt.Errorf("%w: email sudah digunakan", ErrBadRequest)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	passwordHash, err := models.HashPassword(password)
	if err != nil {
		return nil, err
	}
	user := &models.User{
		UserID:       newUserID(),
		Name:         name,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         models.RoleBuyer,
		Phone:        strings.TrimSpace(phone),
		Status:       "ACTIVE",
	}
	if err := s.users.Create(user); err != nil {
		return nil, err
	}
	return s.issueSession(user)
}

func (s *AuthService) Refresh(rawToken string) (*AuthResult, error) {
	if strings.TrimSpace(rawToken) == "" {
		return nil, ErrInvalidToken
	}
	replacementRaw, replacement, err := s.newRefreshToken("")
	if err != nil {
		return nil, err
	}
	current, err := s.refresh.Rotate(hashRefreshToken(rawToken), replacement)
	if err != nil {
		return nil, ErrInvalidToken
	}
	user, err := s.users.FindByUserID(current.UserID)
	if err != nil || user.Status != "ACTIVE" {
		_ = s.refresh.Revoke(replacement.TokenHash)
		return nil, ErrInvalidToken
	}
	return s.issueResult(user, replacementRaw)
}

func (s *AuthService) Logout(rawToken string) error {
	if strings.TrimSpace(rawToken) == "" {
		return ErrInvalidToken
	}
	return s.refresh.Revoke(hashRefreshToken(rawToken))
}

func (s *AuthService) ValidateToken(token string) (*JWTClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, ErrInvalidToken
	}
	var header struct {
		Algorithm string `json:"alg"`
		Type      string `json:"typ"`
	}
	if json.Unmarshal(headerBytes, &header) != nil || header.Algorithm != "HS256" || header.Type != "JWT" {
		return nil, ErrInvalidToken
	}

	signingInput := parts[0] + "." + parts[1]
	expected := s.sign(signingInput)
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return nil, ErrInvalidToken
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidToken
	}
	var claims JWTClaims
	if json.Unmarshal(payload, &claims) != nil {
		return nil, ErrInvalidToken
	}
	now := time.Now().Unix()
	if claims.Issuer != jwtIssuer || claims.TokenType != "access" || claims.Subject == "" || claims.Subject != claims.UserID ||
		claims.Role == "" || claims.JWTID == "" || claims.Expires <= now || claims.IssuedAt > now+60 {
		return nil, ErrInvalidToken
	}
	user, err := s.users.FindByUserID(claims.UserID)
	if err != nil || user.Status != "ACTIVE" || user.Role != claims.Role {
		return nil, ErrInvalidToken
	}
	claims.Name = user.Name
	claims.Email = user.Email
	return &claims, nil
}

func (s *AuthService) issueSession(user *models.User) (*AuthResult, error) {
	raw, refreshToken, err := s.newRefreshToken(user.UserID)
	if err != nil {
		return nil, err
	}
	if err := s.refresh.Create(refreshToken); err != nil {
		return nil, err
	}
	result, err := s.issueResult(user, raw)
	if err != nil {
		_ = s.refresh.Revoke(refreshToken.TokenHash)
	}
	return result, err
}

func (s *AuthService) issueResult(user *models.User, refreshToken string) (*AuthResult, error) {
	now := time.Now()
	expiresAt := now.Add(s.accessTTL)
	jti, err := secureRandomToken(16)
	if err != nil {
		return nil, err
	}
	accessToken, err := s.signJWT(JWTClaims{
		Subject: user.UserID, UserID: user.UserID, Name: user.Name, Email: user.Email,
		Role: user.Role, Issuer: jwtIssuer, TokenType: "access", JWTID: jti,
		IssuedAt: now.Unix(), Expires: expiresAt.Unix(),
	})
	if err != nil {
		return nil, err
	}
	return &AuthResult{
		Token: accessToken, AccessToken: accessToken, RefreshToken: refreshToken,
		TokenType: "Bearer", ExpiresAt: expiresAt, User: publicAccountUser(user),
	}, nil
}

func (s *AuthService) newRefreshToken(userID string) (string, *models.RefreshToken, error) {
	raw, err := secureRandomToken(32)
	if err != nil {
		return "", nil, err
	}
	return raw, &models.RefreshToken{TokenHash: hashRefreshToken(raw), UserID: userID, ExpiresAt: time.Now().Add(s.refreshTTL)}, nil
}

func (s *AuthService) signJWT(claims JWTClaims) (string, error) {
	headerBytes, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		return "", err
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	signingInput := base64.RawURLEncoding.EncodeToString(headerBytes) + "." + base64.RawURLEncoding.EncodeToString(claimsBytes)
	return signingInput + "." + s.sign(signingInput), nil
}

func (s *AuthService) sign(value string) string {
	mac := hmac.New(sha256.New, []byte(s.jwtSecret))
	_, _ = mac.Write([]byte(value))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func secureRandomToken(size int) (string, error) {
	value := make([]byte, size)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func hashRefreshToken(raw string) string {
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:])
}

func publicAccountUser(user *models.User) AccountUser {
	return AccountUser{UserID: user.UserID, Name: user.Name, Email: user.Email, Role: user.Role}
}

func newUserID() string {
	return "USR" + fmt.Sprintf("%d", time.Now().UnixNano()%100000000)
}
