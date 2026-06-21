package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func getSecretKey() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// BẮT BUỘC PHẢI CÓ SECRET KEY TRÊN PRODUCTION
		panic("CRITICAL ERROR: JWT_SECRET environment variable is not set! System stopped for security.")
	}
	return []byte(secret)
}

// GenerateToken sinh JWT Token cho một userID cụ thể
func GenerateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"userID": userID,
		"exp":    time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getSecretKey())
}

// ValidateToken parses and validates a JWT token and returns the userID if successful
func ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("phương thức ký không hợp lệ: %v", token.Header["alg"])
		}
		return getSecretKey(), nil
	})
	if err != nil {
		return "", err
	}
	if !token.Valid {
		return "", fmt.Errorf("token invalid")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid claims")
	}
	userID, ok := claims["userID"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("invalid userID in token")
	}
	return userID, nil
}

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// Fallback: allow token via query param for WS and legacy stream requests
		if tokenString == "" {
			path := c.Request.URL.Path
			if path == "/ws" || strings.HasPrefix(path, "/streams/") {
				tokenString = c.Query("token")
			}
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Thiếu JWT Token (Header hoặc Query)"})
			return
		}

		userID, err := ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "JWT Token không hợp lệ: " + err.Error()})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// StreamAuthMiddleware validates JWT for HLS stream endpoints.
// Supports two token patterns:
//
//	Path-based: /streams/token/<jwt>/<camID>/stream.m3u8
//	Query-based: /streams/<camID>/stream.m3u8?token=<jwt>
func StreamAuthMiddleware(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		fullPath := c.Param("filepath") // e.g. /token/<jwt>/<camID>/stream.m3u8 or /<camID>/stream.m3u8

		// 1. Extract JWT token
		var tokenString string
		var cameraPath string // the part after the token (/<camID>/...)

		if strings.HasPrefix(fullPath, "/token/") {
			// Path-based: /token/<jwt>/<camID>/...
			rest := strings.TrimPrefix(fullPath, "/token/")
			parts := strings.SplitN(rest, "/", 2) // [<jwt>, <camID>/...]
			if len(parts) >= 1 {
				tokenString = parts[0]
			}
			if len(parts) == 2 {
				cameraPath = "/" + parts[1]
			}
		} else {
			// Query-based fallback
			tokenString = c.Query("token")
			cameraPath = fullPath
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Stream: thiếu JWT Token"})
			return
		}

		// 2. Validate token
		userID, err := ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Stream: JWT không hợp lệ: " + err.Error()})
			return
		}

		// 3. Extract camera ID from the camera path (first segment)
		parts := strings.SplitN(strings.TrimPrefix(cameraPath, "/"), "/", 2)
		if len(parts) == 0 || parts[0] == "" {
			// No camera ID — allow through (e.g. root path)
			c.Set("userID", userID)
			c.Next()
			return
		}
		camIDStr := parts[0]
		camObjID, err := primitive.ObjectIDFromHex(camIDStr)
		if err != nil {
			// Not a valid ObjectID — allow through
			c.Set("userID", userID)
			c.Next()
			return
		}

		// 4. Verify camera belongs to authenticated user
		userObjID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Stream: userID không hợp lệ"})
			return
		}
		var cam bson.M
		filter := bson.M{
			"_id": camObjID,
			"$or": []bson.M{
				{"user_id": userObjID},
				{"user_id": userID},
			},
		}
		if errFind := db.Collection("cameras").FindOne(context.Background(), filter).Decode(&cam); errFind != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Stream: bạn không có quyền xem camera này"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

