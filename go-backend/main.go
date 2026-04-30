package main

import (
	"context"
	"log"
	"os"
	"time"

	"go-backend/internal/alert"
	"go-backend/internal/auth"
	"go-backend/internal/camera"
	"go-backend/internal/logger"
	"go-backend/internal/stream"
	"go-backend/internal/user"
	"go-backend/internal/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	// Swagger files
	_ "go-backend/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// 0. Initialize Logger
	logger.Init()
	defer logger.Log.Sync()

	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		logger.Log.Warn("Lưu ý: Không tìm thấy file .env, sẽ sử dụng biến môi trường hệ thống.")
	}

	// 2. Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		logger.Log.Fatal("Lỗi: MONGODB_URI không được thiết lập trong .env")
	}
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		logger.Log.Fatalf("Lỗi không thể kết nối tới MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	if err := client.Ping(ctx, nil); err != nil {
		logger.Log.Warn("Lưu ý: Không thể ping tới MongoDB. Lỗi:", err)
	}
	db := client.Database("fall_detection")
	logger.Log.Info("✅ Database Init hoàn tất.")

	// 3. Initialize Core Modules
	hub := ws.NewHub()
	go hub.Run()

	hlsServer := stream.NewHLSServer()
	alertEngine := alert.NewEngine(db, hub, hlsServer)
	alertEngine.Start()

	camManager := camera.NewManager(db, hlsServer)
	camManager.StartAll()

	// 4. Setup HTTP Server
	r := gin.Default()
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(corsConfig))

	// 5. Register Routes
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.Static("/audio", "./audio")
	r.GET("/ws", auth.JWTMiddleware(), func(c *gin.Context) { ws.ServeWs(hub, c) })

	// Secure Streams with JWT
	streamGroup := r.Group("/streams")
	streamGroup.Use(auth.JWTMiddleware())
	streamGroup.StaticFS("/", gin.Dir(hlsServer.OutputDir, false))

	// Handlers
	authHandler := auth.NewHandler(db)
	userHandler := user.NewHandler(db)
	camAPI := camera.NewAPI(db, camManager)
	alertAPI := alert.NewAPI(db, alertEngine)

	// API Routes
	api := r.Group("/api/v1")
	{
		api.POST("/auth/social-login", authHandler.SocialLogin)
		api.POST("/ai-result", alertAPI.AIResult)
		api.GET("/answer", alertAPI.Answer)

		private := api.Group("/")
		private.Use(auth.JWTMiddleware())
		{
			camAPI.RegisterRoutes(private)
			private.GET("/incidents", alertAPI.GetIncidents)
			private.POST("/test-call", alertAPI.TestCall)
			private.GET("/health-profiles", userHandler.GetProfile)
			private.PUT("/health-profiles", userHandler.UpdateProfile)
			private.PUT("/health-profiles/contacts", userHandler.UpdateContacts)
		}
	}

	logger.Log.Info("🚀 Cardiac Alert Server hiện đang chạy...")
	if err := r.Run(":8080"); err != nil {
		logger.Log.Fatalf("Server bị crash: %v", err)
	}
}
