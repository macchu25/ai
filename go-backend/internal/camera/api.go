package camera

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"go-backend/internal/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type API struct {
	db      *mongo.Database
	manager *Manager
}

func NewAPI(db *mongo.Database, manager *Manager) *API {
	return &API{db: db, manager: manager}
}

func (a *API) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/cameras", a.GetCameras)
	router.POST("/cameras", a.AddCamera)
	router.DELETE("/cameras/:id", a.DeleteCamera)
}

func (a *API) GetCameras(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không tìm thấy userID"})
		return
	}

	var cams []model.Camera = []model.Camera{}
	cursor, err := a.db.Collection("cameras").Find(context.Background(), bson.M{"user_id": userID})
	if err == nil {
		cursor.All(context.Background(), &cams)
	}
	c.JSON(http.StatusOK, cams)
}

// Xử lý POST (Thêm mới 1 camera hoặc cập nhật nếu trùng ID)
func (a *API) AddCamera(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không tìm thấy userID"})
		return
	}

	var cam model.Camera
	if err := c.ShouldBindJSON(&cam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if cam.ID.IsZero() {
		cam.ID = primitive.NewObjectID()
	}
	
	// Gán camera cho người dùng hiện tại
	objID, _ := primitive.ObjectIDFromHex(userID.(string))
	cam.UserID = objID

	opts := options.Update().SetUpsert(true)
	_, err := a.db.Collection("cameras").UpdateOne(context.Background(), bson.M{"_id": cam.ID}, bson.M{"$set": cam}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	a.manager.StartStream(cam)
	
	c.JSON(http.StatusOK, cam)
}

func (a *API) DeleteCamera(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Không tìm thấy userID"})
		return
	}

	idStr := c.Param("id")
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}
	
	// Xác minh quyền sở hữu trước khi xóa
	res := a.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": id, "user_id": userID})
	if res.Err() != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Bạn không có quyền xóa camera này"})
		return
	}

	a.manager.StopStream(id)
	
	a.db.Collection("cameras").DeleteOne(context.Background(), bson.M{"_id": id})
	c.JSON(http.StatusOK, gin.H{"message": "Đã chặn stream và xóa camera"})
}
