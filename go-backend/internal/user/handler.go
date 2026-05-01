package user

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Handler struct {
	db *mongo.Database
}

func NewHandler(db *mongo.Database) *Handler {
	return &Handler{db: db}
}

func (h *Handler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	coll := h.db.Collection("health_profiles")
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	var profile bson.M
	err := coll.FindOne(context.Background(), bson.M{"user_id": objID}).Decode(&profile)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"name":         "Bệnh nhân (Chưa cấu hình)",
			"age":          0,
			"location":     "Chưa xác định",
			"bloodType":    "Chưa rõ",
			"conditions":   []string{},
			"contacts":     []interface{}{},
			"lastIncident": "Chưa có dữ liệu",
		})
		return
	}
	c.JSON(http.StatusOK, profile)
}

func (h *Handler) UpdateContacts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var contacts []map[string]interface{}
	if err := c.ShouldBindJSON(&contacts); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	for _, contact := range contacts {
		if id, ok := contact["id"].(string); !ok || id == "" {
			contact["id"] = uuid.New().String()
		}
	}

	coll := h.db.Collection("health_profiles")
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	_, err := coll.UpdateOne(
		context.Background(),
		bson.M{"user_id": objID},
		bson.M{"$set": bson.M{"contacts": contacts}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu danh bạ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Thành công", "contacts": contacts})
}

func (h *Handler) UpdateTelegramID(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var body struct {
		TelegramChatID string `json:"telegram_chat_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	coll := h.db.Collection("health_profiles")
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	_, err := coll.UpdateOne(
		context.Background(),
		bson.M{"user_id": objID},
		bson.M{"$set": bson.M{"telegram_chat_id": body.TelegramChatID}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật Telegram ID"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật Telegram ID thành công"})
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	var body struct {
		Name       string   `json:"name"`
		Age        int      `json:"age"`
		Location   string   `json:"location"`
		BloodType  string   `json:"bloodType"`
		Conditions []string `json:"conditions"`
	}
	if err := h.ShouldBindJSON(c, &body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	coll := h.db.Collection("health_profiles")
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	_, err := coll.UpdateOne(
		context.Background(),
		bson.M{"user_id": objID},
		bson.M{"$set": bson.M{
			"name":       body.Name,
			"age":        body.Age,
			"location":   body.Location,
			"bloodType":  body.BloodType,
			"conditions": body.Conditions,
		}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật hồ sơ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cập nhật hồ sơ thành công"})
}

func (h *Handler) ShouldBindJSON(c *gin.Context, obj interface{}) error {
	return c.ShouldBindJSON(obj)
}
