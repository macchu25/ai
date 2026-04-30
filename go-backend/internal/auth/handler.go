package auth

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Handler struct {
	db *mongo.Database
}

func NewHandler(db *mongo.Database) *Handler {
	return &Handler{db: db}
}

func (h *Handler) SocialLogin(c *gin.Context) {
	var body struct {
		Email      string `json:"email"`
		Name       string `json:"name"`
		Provider   string `json:"provider"`
		ProviderID string `json:"provider_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Thông tin không hợp lệ"})
		return
	}

	userColl := h.db.Collection("users")
	var userDoc struct {
		ID primitive.ObjectID `bson:"_id"`
	}

	err := userColl.FindOne(context.Background(), bson.M{"provider_id": body.ProviderID}).Decode(&userDoc)
	var finalID primitive.ObjectID

	if err == mongo.ErrNoDocuments {
		res, err := userColl.InsertOne(context.Background(), bson.M{
			"name":        body.Name,
			"email":       body.Email,
			"provider":    body.Provider,
			"provider_id": body.ProviderID,
			"created_at":  time.Now(),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo người dùng"})
			return
		}
		finalID = res.InsertedID.(primitive.ObjectID)
	} else {
		finalID = userDoc.ID
	}

	// Sinh Token JWT thật cho User này
	token, err := GenerateToken(finalID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể tạo token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"user_id": finalID.Hex(),
		"name":    body.Name,
	})
}
