package alert

import (
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type API struct {
	db     *mongo.Database
	engine *Engine
}

func NewAPI(db *mongo.Database, engine *Engine) *API {
	return &API{db: db, engine: engine}
}

func (a *API) GetIncidents(c *gin.Context) {
	collection := a.db.Collection("events")
	
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không tìm thấy thông tin người dùng"})
		return
	}
	
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	filter := bson.M{"user_id": objID}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy dữ liệu sự cố"})
		return
	}
	var events []interface{}
	if err = cursor.All(context.Background(), &events); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi parse dữ liệu"})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (a *API) TestCall(c *gin.Context) {
	userID, _ := c.Get("userID")
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	
	a.engine.CallTestManual(objID)
	c.JSON(http.StatusOK, gin.H{"message": "Đã kích hoạt cuộc gọi thử nghiệm"})
}

func (a *API) AIResult(c *gin.Context) {
	// Security check: Verify Internal API Key
	apiKey := c.GetHeader("X-API-Key")
	expectedKey := os.Getenv("INTERNAL_API_KEY")
	if expectedKey != "" && apiKey != expectedKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid API Key"})
		return
	}

	var payload struct {
		CameraID   string  `json:"CameraID"`
		Label      string  `json:"Label"`
		Confidence float32 `json:"Confidence"`
	}
	if err := c.ShouldBindJSON(&payload); err == nil {
		camID, err := primitive.ObjectIDFromHex(payload.CameraID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID Camera không hợp lệ"})
			return
		}
		a.engine.ResultCh <- AIResult{
			CameraID:   camID,
			Label:      payload.Label,
			Confidence: payload.Confidence,
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng dữ liệu không hợp lệ"})
	}
}

func (a *API) Answer(c *gin.Context) {
	scco := []gin.H{
		{
			"action": "talk",
			"text":   "Chào bạn, đây là thông báo khẩn cấp từ hệ thống Cardiac Alert. Người thân của bạn đang gặp sự cố, vui lòng kiểm tra ngay lập tức.",
			"voice":  "female",
			"speed":  0,
		},
	}
	c.JSON(http.StatusOK, scco)
}
