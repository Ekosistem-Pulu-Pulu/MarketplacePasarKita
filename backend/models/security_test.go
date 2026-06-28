package models

import "testing"

func TestPasswordHashUsesSaltedBcrypt(t *testing.T) {
	password := "a-secure-test-password"
	first, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	second, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if first == second {
		t.Fatal("bcrypt hashes must use distinct salts")
	}
	if !CheckPassword(first, password) {
		t.Fatal("valid password was rejected")
	}
	if CheckPassword(first, "wrong-password") {
		t.Fatal("invalid password was accepted")
	}
}
