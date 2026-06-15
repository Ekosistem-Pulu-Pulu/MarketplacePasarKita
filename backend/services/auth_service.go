package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"pasarkita-marketplace-backend/models"
	"pasarkita-marketplace-backend/repositories"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type DemoUser struct {
	UserID   string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Password string `json:"-"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResult struct {
	Token     string    `json:"token"`
	TokenType string    `json:"tokenType"`
	ExpiresAt time.Time `json:"expiresAt"`
	User      DemoUser  `json:"user"`
}

type JWTClaims struct {
	Subject  string `json:"sub"`
	UserID   string `json:"user_id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Issuer   string `json:"iss"`
	IssuedAt int64  `json:"iat"`
	Expires  int64  `json:"exp"`
}

type AuthService struct {
	jwtSecret string
	userRepo  *repositories.UserRepository
	users     []DemoUser
}

func NewAuthService(jwtSecret string, userRepo *repositories.UserRepository) *AuthService {
	return &AuthService{
		jwtSecret: jwtSecret,
		userRepo:  userRepo,
		users: []DemoUser{
			{UserID: "USR001", Name: "Raka Buyer", Email: "buyer@pasarkita.local", Role: "buyer", Password: "password123"},
			{UserID: "SELLER001", Name: "Toko Sambal Roa", Email: "seller@pasarkita.local", Role: "seller", Password: "password123"},
			{UserID: "CAT001", Name: "Catalog Admin", Email: "catalog@pasarkita.local", Role: "catalog_admin", Password: "password123"},
			{UserID: "CS001", Name: "Customer Support", Email: "support@pasarkita.local", Role: "customer_support", Password: "password123"},
			{UserID: "FIN001", Name: "Finance Ops", Email: "finance@pasarkita.local", Role: "finance_ops", Password: "password123"},
			{UserID: "FUL001", Name: "Fulfillment Ops", Email: "fulfillment@pasarkita.local", Role: "fulfillment_ops", Password: "password123"},
			{UserID: "ADM001", Name: "Platform Admin", Email: "admin@pasarkita.local", Role: "platform_admin", Password: "password123"},
			{UserID: "TECH001", Name: "Tech Maintainer", Email: "tech@pasarkita.local", Role: "tech_maintainer", Password: "password123"},
		},
	}
}

func (s *AuthService) DemoUsers() []DemoUser {
	if s.userRepo != nil {
		dbUsers, err := s.userRepo.ListPublic()
		if err == nil && len(dbUsers) > 0 {
			users := make([]DemoUser, 0, len(dbUsers))
			for _, user := range dbUsers {
				users = append(users, DemoUser{
					UserID: user.UserID,
					Name:   user.Name,
					Email:  user.Email,
					Role:   user.Role,
				})
			}
			return users
		}
	}

	users := make([]DemoUser, len(s.users))
	copy(users, s.users)
	for index := range users {
		users[index].Password = ""
	}
	return users
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	user, ok := s.findByEmail(input.Email)
	if !ok || !s.passwordMatches(user, input.Password) {
		return nil, ErrInvalidCredentials
	}

	now := time.Now()
	expiresAt := now.Add(8 * time.Hour)
	token, err := s.signJWT(JWTClaims{
		Subject:  user.UserID,
		UserID:   user.UserID,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
		Issuer:   "pasarkita-marketplace",
		IssuedAt: now.Unix(),
		Expires:  expiresAt.Unix(),
	})
	if err != nil {
		return nil, err
	}

	user.Password = ""
	return &AuthResult{
		Token:     token,
		TokenType: "Bearer",
		ExpiresAt: expiresAt,
		User:      user,
	}, nil
}

func (s *AuthService) Register(name, email, password, role, phone string) (*AuthResult, error) {
	if s.userRepo == nil {
		return nil, fmt.Errorf("user repository belum tersedia")
	}
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	role = strings.TrimSpace(role)
	if role == "" {
		role = models.RoleBuyer
	}
	if name == "" || email == "" || strings.TrimSpace(password) == "" {
		return nil, fmt.Errorf("%w: nama, email, dan password wajib diisi", ErrBadRequest)
	}
	if _, err := s.userRepo.FindByEmail(email); err == nil {
		return nil, fmt.Errorf("%w: email sudah digunakan", ErrBadRequest)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	user := &models.User{
		UserID:       newUserID(),
		Name:         name,
		Email:        email,
		PasswordHash: models.HashPassword(password, s.jwtSecret),
		Role:         role,
		Phone:        strings.TrimSpace(phone),
		Status:       "ACTIVE",
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return s.Login(LoginInput{Email: email, Password: password})
}

func (s *AuthService) ValidateToken(token string) (*JWTClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("token JWT tidak valid")
	}

	signingInput := parts[0] + "." + parts[1]
	expected := s.sign(signingInput)
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return nil, fmt.Errorf("signature JWT tidak valid")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("payload JWT tidak valid")
	}

	var claims JWTClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("claims JWT tidak valid")
	}

	if claims.Expires < time.Now().Unix() {
		return nil, fmt.Errorf("token JWT expired")
	}

	return &claims, nil
}

func (s *AuthService) findByEmail(email string) (DemoUser, bool) {
	if s.userRepo != nil {
		dbUser, err := s.userRepo.FindByEmail(email)
		if err == nil {
			return DemoUser{
				UserID:   dbUser.UserID,
				Name:     dbUser.Name,
				Email:    dbUser.Email,
				Role:     dbUser.Role,
				Password: dbUser.PasswordHash,
			}, true
		}
	}

	for _, user := range s.users {
		if strings.EqualFold(user.Email, strings.TrimSpace(email)) {
			return user, true
		}
	}
	return DemoUser{}, false
}

func (s *AuthService) passwordMatches(user DemoUser, password string) bool {
	if len(user.Password) == 64 && user.Password == models.HashPassword(password, s.jwtSecret) {
		return true
	}
	return user.Password == password
}

func (s *AuthService) signJWT(claims JWTClaims) (string, error) {
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	signingInput := base64.RawURLEncoding.EncodeToString(headerBytes) + "." +
		base64.RawURLEncoding.EncodeToString(claimsBytes)

	return signingInput + "." + s.sign(signingInput), nil
}

func (s *AuthService) sign(value string) string {
	mac := hmac.New(sha256.New, []byte(s.jwtSecret))
	mac.Write([]byte(value))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func newUserID() string {
	return "USR" + fmt.Sprintf("%d", time.Now().UnixNano()%100000000)
}
