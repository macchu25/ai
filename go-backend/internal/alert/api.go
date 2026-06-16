package alert

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"go-backend/internal/auth"

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
	
	userID, _ := c.Get("userID")
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session không hợp lệ"})
		return
	}
	objID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID người dùng không hợp lệ"})
		return
	}
	filter := bson.M{"user_id": objID}

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy dữ liệu sự cố"})
		return
	}
	var events []bson.M
	if err = cursor.All(context.Background(), &events); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi parse dữ liệu"})
		return
	}
	c.JSON(http.StatusOK, events)
}

func (a *API) AIChat(c *gin.Context) {
	var payload struct {
		Query string `json:"query"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	// Gọi đến AI Python service
	pbody, _ := json.Marshal(map[string]string{"query": payload.Query})
	aiBrainURL := os.Getenv("AI_BRAIN_URL")
	if aiBrainURL == "" {
		aiBrainURL = "http://localhost:8001"
	}
	resp, err := http.Post(aiBrainURL+"/chat", "application/json", bytes.NewBuffer(pbody))
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service hiện không khả dụng"})
		return
	}
	defer resp.Body.Close()

	var result gin.H
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		c.JSON(http.StatusOK, result)
	} else {
		c.JSON(http.StatusOK, gin.H{
			"answer": "Hệ thống AI đang xử lý dữ liệu. Vui lòng thử lại sau.",
		})
	}
}

func (a *API) TestCall(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session không hợp lệ"})
		return
	}
	objID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID người dùng không hợp lệ"})
		return
	}
	
	var payload struct {
		Phone string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}
	
	a.engine.CallTestManual(objID, payload.Phone)
	c.JSON(http.StatusOK, gin.H{"message": "Đã kích hoạt cuộc gọi thử nghiệm"})
}




func (a *API) AIResult(c *gin.Context) {
	// Security check: Verify Internal API Key
	apiKey := c.GetHeader("X-API-Key")
	expectedKey := os.Getenv("INTERNAL_API_KEY")
	// BẮT BUỘC PHẢI CÓ KEY ĐỂ TRÁNH FAKE INCIDENT
	if expectedKey == "" || apiKey != expectedKey {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid or Missing API Key"})
		return
	}

	var payload struct {
		CameraID      string  `json:"CameraID"`
		ModelName     string  `json:"ModelName"`
		Label         string  `json:"Label"`
		Confidence    float32 `json:"Confidence"`
		EvidenceImage string  `json:"EvidenceImage,omitempty"`
	}
	if err := c.ShouldBindJSON(&payload); err == nil {
		camID, err := primitive.ObjectIDFromHex(payload.CameraID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID Camera không hợp lệ"})
			return
		}

		var imgBytes []byte
		if payload.EvidenceImage != "" {
			var errDec error
			imgBytes, errDec = base64.StdEncoding.DecodeString(payload.EvidenceImage)
			if errDec != nil {
				log.Printf("[API] Lỗi giải mã ảnh bằng chứng Base64: %v\n", errDec)
			}
		}

		a.engine.ResultCh <- AIResult{
			CameraID:      camID,
			ModelName:     payload.ModelName,
			Label:         payload.Label,
			Confidence:    payload.Confidence,
			EvidenceImage: imgBytes,
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Định dạng dữ liệu không hợp lệ"})
	}
}

func (a *API) SimulateAI(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session không hợp lệ"})
		return
	}
	userObjID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID người dùng không hợp lệ"})
		return
	}

	camIDStr := c.Param("id")
	camID, err := primitive.ObjectIDFromHex(camIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Camera không hợp lệ"})
		return
	}

	// Verify ownership of the camera
	var camera bson.M
	camColl := a.db.Collection("cameras")
	err = camColl.FindOne(context.Background(), bson.M{"_id": camID, "user_id": userObjID}).Decode(&camera)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền truy cập camera này hoặc camera không tồn tại"})
		return
	}

	var payload struct {
		Label      string  `json:"label"`
		Confidence float32 `json:"confidence"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	a.engine.ResultCh <- AIResult{
		CameraID:   camID,
		ModelName:  "Fall Detection Engine (Simulation)",
		Label:      payload.Label,
		Confidence: payload.Confidence,
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Đã gửi dữ liệu giả lập AI"})
}

func (a *API) GetAIModels(c *gin.Context) {
	// Cho phép truy cập qua JWT hoặc X-API-Key (cho script Python)
	apiKey := c.GetHeader("X-API-Key")
	expectedKey := os.Getenv("INTERNAL_API_KEY")
	
	_, hasJWT := c.Get("userID")
	if !hasJWT {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString := parts[1]
				if _, err := auth.ValidateToken(tokenString); err == nil {
					hasJWT = true
				}
			}
		}
	}
	
	if !hasJWT && (expectedKey == "" || apiKey != expectedKey) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	collection := a.db.Collection("ai_models")
	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lấy danh sách model"})
		return
	}
	var models []bson.M
	if err = cursor.All(context.Background(), &models); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Lỗi parse dữ liệu"})
		return
	}

	defaultModels := []bson.M{
		{
			"name":      "Fall Detection Engine",
			"version":   "2.1.0",
			"type":      "CNN-LSTM + MediaPipe",
			"status":    "Active",
			"precision": "85.0%",
			"latency":   "25ms",
		},
		{
			"name":      "Human Pose Estimation",
			"version":   "1.4.2",
			"type":      "MediaPipe",
			"status":    "Active",
			"precision": "94.2%",
			"latency":   "24ms",
		},
		{
			"name":      "YOLO Furniture Detector",
			"version":   "1.0.0",
			"type":      "YOLOv11-Nano",
			"status":    "Idle",
			"precision": "92.0%",
			"latency":   "15ms",
		},
		{
			"name":      "Remote Heart Rate Monitor (rPPG)",
			"version":   "1.0.0",
			"type":      "DeepPhys Spatial-Temporal CNN",
			"status":    "Idle",
			"precision": "90.1%",
			"latency":   "18ms",
		},
		{
			"name":      "Facial Pain Detector",
			"version":   "1.0.0",
			"type":      "CNN-LSTM Pain Expression Classifier",
			"status":    "Idle",
			"precision": "88.5%",
			"latency":   "20ms",
		},
	}

	hasInserted := false
	for _, dm := range defaultModels {
		var existing bson.M
		err := collection.FindOne(context.Background(), bson.M{"name": dm["name"]}).Decode(&existing)
		if err == mongo.ErrNoDocuments {
			collection.InsertOne(context.Background(), dm)
			hasInserted = true
		}
	}

	if hasInserted {
		// Reload models list after seeding missing defaults
		cursor, err = collection.Find(context.Background(), bson.M{})
		if err == nil {
			cursor.All(context.Background(), &models)
		}
	}

	c.JSON(http.StatusOK, models)
}

func (a *API) ToggleAIModel(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	collection := a.db.Collection("ai_models")
	var model bson.M
	if err := collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&model); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Không tìm thấy model"})
		return
	}

	newStatus := "Active"
	if model["status"] == "Active" {
		newStatus = "Idle"
	}

	_, err = collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"status": newStatus}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể cập nhật trạng thái"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "new_status": newStatus})
}
