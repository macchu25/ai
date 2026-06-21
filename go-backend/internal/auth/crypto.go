package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"net/url"
	"os"
	"strings"
)

const encPrefix = "enc:"

// deriveKey derives a 32-byte AES-256 key from JWT_SECRET via SHA-256.
func deriveKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("CRITICAL ERROR: JWT_SECRET environment variable is not set!")
	}
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}

// Encrypt encrypts plainText using AES-256-GCM and returns a prefixed base64 ciphertext.
// If the value is already encrypted (starts with "enc:"), it is returned as-is.
func Encrypt(plainText string) (string, error) {
	if plainText == "" {
		return "", nil
	}
	if strings.HasPrefix(plainText, encPrefix) {
		return plainText, nil
	}

	key := deriveKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("crypto: failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plainText), nil)
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	return encPrefix + encoded, nil
}

// Decrypt decrypts a value previously encrypted with Encrypt.
// Values not starting with "enc:" are returned as-is (backward compat).
func Decrypt(cipherText string) (string, error) {
	if cipherText == "" {
		return "", nil
	}
	if !strings.HasPrefix(cipherText, encPrefix) {
		// Plaintext fallback for backward compatibility
		return cipherText, nil
	}

	encoded := strings.TrimPrefix(cipherText, encPrefix)
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to base64 decode: %w", err)
	}

	key := deriveKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("crypto: ciphertext too short")
	}

	nonce, cipherdata := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, cipherdata, nil)
	if err != nil {
		return "", fmt.Errorf("crypto: failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// MaskRTSPURL replaces the password in an rtsp:// or http:// URL with "******".
// If the URL cannot be parsed or has no password, the original string is returned.
func MaskRTSPURL(rawURL string) string {
	if rawURL == "" {
		return ""
	}
	u, err := url.Parse(rawURL)
	if err != nil || u.User == nil {
		return rawURL
	}
	if _, hasPassword := u.User.Password(); !hasPassword {
		return rawURL
	}
	username := u.User.Username()
	u.User = url.UserPassword(username, "******")
	return u.String()
}

// MergeRTSPURL checks whether submittedURL contains the masked password "******".
// If so, it extracts the real password from existingDecryptedURL and substitutes it back.
// This allows frontend to re-submit a URL with a masked password without losing credentials.
func MergeRTSPURL(submittedURL, existingDecryptedURL string) string {
	if !strings.Contains(submittedURL, "******") {
		// No mask → user submitted a real new URL
		return submittedURL
	}
	if existingDecryptedURL == "" {
		// No existing record to restore from
		return submittedURL
	}

	parsedSubmitted, err1 := url.Parse(submittedURL)
	parsedExisting, err2 := url.Parse(existingDecryptedURL)
	if err1 != nil || err2 != nil {
		return submittedURL
	}

	// Restore the real password from the existing record
	if parsedExisting.User != nil {
		if realPassword, ok := parsedExisting.User.Password(); ok {
			username := parsedSubmitted.User.Username()
			parsedSubmitted.User = url.UserPassword(username, realPassword)
			return parsedSubmitted.String()
		}
	}
	return submittedURL
}
