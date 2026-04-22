package main

import (
	"context"
	"log"
	"time"

	"go-backend/internal/alert"
	"go-backend/internal/auth"
	"go-backend/internal/camera"
	"go-backend/internal/stream"
	"go-backend/internal/ws"

	"github.com/google/uuid"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	// Swagger files
	_ "go-backend/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// @title Fall Detection API
// @version 1.0
// @description Hệ thống quản lý REST API + WebSocket backend phục vụ quản lý camera và nhận diện.
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// 1. Kết nối CSDL MongoDB Atlas Cloud
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	uri := "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("Lỗi không thể kết nối tới MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	if err := client.Ping(ctx, nil); err != nil {
		log.Println("Lưu ý: Không thể ping tới MongoDB, có thể MongoDB chưa được start. Lỗi:", err)
	}
	db := client.Database("fall_detection")
	log.Println("✅ Database Init hoàn tất (MongoDB).")

	// 2. Cấu trúc WebSocket Hub (Task 4.4)
	hub := ws.NewHub()
	go hub.Run()
	log.Println("✅ Khởi tạo WebSocket Hub.")

	// 3. Khởi tạo Stream HLS (Task 4.3)
	hlsServer := stream.NewHLSServer()
	log.Println("✅ Khởi tạo HLS Transcode Server.")

	// 4. Khởi tạo Alert Engine (Kèm WebSockets Hub)
	alertEngine := alert.NewEngine(db, hub)
	alertEngine.Start()

	// 5. Khởi tạo Camera Manager Architecture
	camManager := camera.NewManager(db, hlsServer)
	camManager.StartAll()

	// 6. Config Gin & REST API (Task 4.4)
	r := gin.Default()

	// Cấu hình CORS để cho phép NextJS Localhost fetching kèm Token
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Phục vụ giao diện Swagger Docs (swagger/index.html)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Serving file m3u8 và ts ngầm qua router này cho HLS play lại
	r.Static("/streams", hlsServer.OutputDir)

	// WebSocket Route (Không cần auth token JWT để dễ debug, hoặc có tuỳ thiết kế)
	r.GET("/ws", func(c *gin.Context) {
		ws.ServeWs(hub, c)
	})

	camAPI := camera.NewAPI(db, camManager)

	// Route public không cần JWT
	// (Vd: có thể thêm route login trả token)

	// Group route API version 1 có bọc JWT Auth
	v1 := r.Group("/api/v1")
	v1.Use(auth.JWTMiddleware())
	{
		camAPI.RegisterRoutes(v1)

		// API lấy danh sách sự cố thực tế từ MongoDB (Đã phân quyền)
		v1.GET("/incidents", func(c *gin.Context) {
			collection := db.Collection("events")
			
			// Lấy userID từ Token
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Không tìm thấy thông tin người dùng"})
				return
			}
			
			filter := bson.M{"user_id": userID}

			cursor, err := collection.Find(context.Background(), filter)
			if err != nil {
				c.JSON(500, gin.H{"error": "Không thể lấy dữ liệu sự cố"})
				return
			}
			var events []interface{}
			if err = cursor.All(context.Background(), &events); err != nil {
				c.JSON(500, gin.H{"error": "Lỗi parse dữ liệu"})
				return
			}
			c.JSON(200, events)
		})

		// API Social Login - Trả về JWT Token chính thức của hệ thống
		v1.POST("/auth/social-login", func(c *gin.Context) {
			var body struct {
				Email      string `json:"email"`
				Name       string `json:"name"`
				Provider   string `json:"provider"`
				ProviderID string `json:"provider_id"`
			}
			if err := c.ShouldBindJSON(&body); err != nil {
				c.JSON(400, gin.H{"error": "Thông tin không hợp lệ"})
				return
			}

			userColl := db.Collection("users")
			var userDoc struct {
				ID primitive.ObjectID `bson:"_id"`
			}
			
			err := userColl.FindOne(context.Background(), bson.M{"provider_id": body.ProviderID}).Decode(&userDoc)
			var finalID primitive.ObjectID

			if err == mongo.ErrNoDocuments {
				res, _ := userColl.InsertOne(context.Background(), bson.M{
					"name":        body.Name,
					"email":       body.Email,
					"provider":    body.Provider,
					"provider_id": body.ProviderID,
					"created_at":  time.Now(),
				})
				finalID = res.InsertedID.(primitive.ObjectID)
			} else {
				finalID = userDoc.ID
			}

			// Sinh Token JWT thật cho User này
			token, err := auth.GenerateToken(finalID.Hex())
			if err != nil {
				c.JSON(500, gin.H{"error": "Không thể tạo token"})
				return
			}

			c.JSON(200, gin.H{
				"token":   token,
				"user_id": finalID.Hex(),
				"name":    body.Name,
			})
		})

		v1.GET("/users", func(c *gin.Context) {
			c.JSON(200, gin.H{"data": "List users bảo mật"})
		})
		
		// Lấy Hồ sơ y tế của user
		v1.GET("/health-profiles", func(c *gin.Context) {
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Unauthorized"})
				return
			}

			coll := db.Collection("health_profiles")
			var profile bson.M
			err := coll.FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
			if err != nil {
				// Nếu chưa có, trả về template mặc định
				c.JSON(200, gin.H{
					"name": "Bệnh nhân (Chưa cấu hình)",
					"age": 0,
					"location": "Chưa xác định",
					"bloodType": "Chưa rõ",
					"conditions": []string{},
					"contacts": []interface{}{},
					"lastIncident": "Chưa có dữ liệu",
				})
				return
			}
			c.JSON(200, profile)
		})

		// Cập nhật danh bạ khẩn cấp
		v1.PUT("/health-profiles/contacts", func(c *gin.Context) {
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Unauthorized"})
				return
			}
			var contacts []map[string]interface{}
			if err := c.ShouldBindJSON(&contacts); err != nil {
				c.JSON(400, gin.H{"error": "Dữ liệu không hợp lệ"})
				return
			}

			// Gắn UUID ảo vào các contact chưa có id
			for _, contact := range contacts {
				if id, ok := contact["id"].(string); !ok || id == "" {
					contact["id"] = uuid.New().String()
				}
			}

			coll := db.Collection("health_profiles")
			_, err := coll.UpdateOne(
				context.Background(),
				bson.M{"user_id": userID},
				bson.M{"$set": bson.M{"contacts": contacts}},
				options.Update().SetUpsert(true),
			)
			if err != nil {
				c.JSON(500, gin.H{"error": "Không thể lưu danh bạ"})
				return
			}
			c.JSON(200, gin.H{"message": "Thành công", "contacts": contacts})
		})
	}

	// API Nhận diện AI từ Python Hub (Không yêu cầu JWT người dùng để tránh bị block)
	r.POST("/api/v1/ai-result", func(c *gin.Context) {
		var payload struct {
			CameraID   string  `json:"CameraID"`
			Label      string  `json:"Label"`
			Confidence float32 `json:"Confidence"`
		}
		if err := c.ShouldBindJSON(&payload); err == nil {
			camID, _ := primitive.ObjectIDFromHex(payload.CameraID)
			alertEngine.ResultCh <- alert.AIResult{
				CameraID:   camID,
				Label:      payload.Label,
				Confidence: payload.Confidence,
			}
			c.JSON(200, gin.H{"status": "ok"})
		} else {
			c.JSON(400, gin.H{"error": "Invalid format"})
		}
	})

	log.Println("🚀 Go Backend Server hiện đang chạy tại http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Server bị crash: %v", err)
	}
}
