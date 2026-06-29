//go:build ignore

// Deprecated: tidak dipakai lagi oleh middleware.AccessLog yang sekarang
// mengimpor services.JWTClaims secara langsung.
//
// File ini dipertahankan sementara dengan build constraint `ignore` agar
// tidak ikut ter-compile. Untuk menghapus permanen:
//   git rm backend/middleware/jwt_claims_alias.go

package middleware
