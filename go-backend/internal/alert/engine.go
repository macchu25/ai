package alert

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"go-backend/internal/logger"
	"go-backend/internal/metrics"
	"go-backend/internal/model"
	"go-backend/internal/stream"
	"go-backend/internal/telephony"
	"go-backend/internal/ws"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AIResult struct {
	CameraID   primitive.ObjectID
	Label      string
	Confidence float32
}

type Engine struct {
	db        *mongo.Database
	storage   StateStorage
	ResultCh  chan AIResult
	hub       *ws.Hub
	gateway   *telephony.Gateway
	hlsServer *stream.HLSServer
}

func NewEngine(db *mongo.Database, hub *ws.Hub, hls *stream.HLSServer) *Engine {
	var storage StateStorage
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		storage = NewRedisStorage(redisURL)
		logger.Log.Infof("[AlertEngine] Sử dụng Redis Storage tại %s", redisURL)
	} else {
		storage = NewMemoryStorage()
		logger.Log.Warn("[AlertEngine] REDIS_URL không thiết lập, sử dụng Memory Storage (Không bền bỉ)")
	}

	return &Engine{
		db:        db,
		storage:   storage,
		ResultCh:  make(chan AIResult, 100),
		hub:       hub,
		gateway:   telephony.NewGateway(db),
		hlsServer: hls,
	}
}

func (e *Engine) Start() {
	go func() {
		logger.Log.Info("[AlertEngine] Bắt đầu lắng nghe AI results...")
		for result := range e.ResultCh {
			metrics.InferenceResults.WithLabelValues(result.Label).Inc()
			e.Process(result.CameraID, result.Label, result.Confidence)
		}
	}()
}

func (e *Engine) Process(camID primitive.ObjectID, label string, conf float32) {
	ctx := context.Background()
	state, _ := e.storage.Get(ctx, camID)
	if state == nil {
		state = &CameraState{}
	}

	confThreshold, _ := strconv.ParseFloat(os.Getenv("CONFIDENCE_THRESHOLD"), 32)
	if confThreshold == 0 {
		confThreshold = 0.85
	}

	if float64(conf) > confThreshold && label != "normal" && label != "" {
		if state.SuspectStart.IsZero() {
			state.SuspectStart = time.Now()
			state.LocalAlertSent = false
			logger.Log.Infow("Camera chuyển sang trạng thái THEO DÕI", "camID", camID.Hex(), "label", label)
			metrics.ActiveAlerts.Inc()
		}

		elapsed := time.Since(state.SuspectStart)

		// GIAI ĐOẠN 1: Cảnh báo tại chỗ
		localSeconds, _ := strconv.Atoi(os.Getenv("LOCAL_WARNING_SECONDS"))
		if localSeconds == 0 { localSeconds = 7 }
		
		if elapsed >= time.Duration(localSeconds)*time.Second && !state.LocalAlertSent {
			e.triggerLocalWarning(camID, label, conf)
			state.LocalAlertSent = true
		}

		// GIAI ĐOẠN 2: Gọi người thân
		emergencyMinutes, _ := strconv.Atoi(os.Getenv("EMERGENCY_ALERT_MINUTES"))
		if emergencyMinutes == 0 { emergencyMinutes = 8 }
		
		if elapsed >= time.Duration(emergencyMinutes)*time.Minute {
			if state.LastAlert.IsZero() || time.Since(state.LastAlert) >= 15*time.Minute {
				e.triggerAlert(camID, label, conf)
				state.LastAlert = time.Now()
			}
		}
		e.storage.Set(ctx, camID, state)
	} else {
		if !state.SuspectStart.IsZero() {
			state.SuspectStart = time.Time{}
			state.LocalAlertSent = false
			logger.Log.Infow("Camera trở lại trạng thái NORMAL", "camID", camID.Hex())
			metrics.ActiveAlerts.Dec()
			e.broadcastToOwner(camID, []byte(`{"event":"clear_alert", "camera_id":"` + camID.Hex() + `"}`))
			e.storage.Set(ctx, camID, state)
		}
	}
}

func (e *Engine) broadcastToOwner(camID primitive.ObjectID, data []byte) {
	if e.hub == nil {
		return
	}
	var cameraDoc model.Camera
	err := e.db.Collection("cameras").FindOne(context.Background(), primitive.M{"_id": camID}).Decode(&cameraDoc)
	if err != nil || cameraDoc.UserID.IsZero() {
		return
	}
	e.hub.Broadcast <- ws.PrivateMessage{
		UserID: cameraDoc.UserID.Hex(),
		Data:   data,
	}
}

func (e *Engine) triggerLocalWarning(camID primitive.ObjectID, label string, conf float32) {
	logger.Log.Warnw("Cảnh báo tại chỗ kích hoạt", "camID", camID.Hex(), "label", label)
	e.broadcastToOwner(camID, []byte(`{"event":"local_warning", "camera_id":"` + camID.Hex() + `", "label":"` + label + `"}`))
	e.pushFCM(camID.Hex(), label)
	
	// Gửi Telegram cảnh báo nhẹ
	go telephony.SendTelegramAlert(fmt.Sprintf("⚠️ *Cảnh báo nhẹ:* Camera `%s` phát hiện dấu hiệu `%s`. Đang theo dõi sát sao...", camID.Hex(), label))
}

func (e *Engine) triggerAlert(camID primitive.ObjectID, label string, conf float32) {
	logger.Log.Errorw("🚨 Kích hoạt gọi người thân khẩn cấp", "camID", camID.Hex(), "label", label)
	metrics.EmergencyCalls.Inc()
	
	// Gửi Telegram khẩn cấp
	go telephony.SendTelegramAlert(fmt.Sprintf("🚨 *KHẨN CẤP:* Camera `%s` báo động sự cố `%s`! Hệ thống đang thực hiện cuộc gọi cho người thân.", camID.Hex(), label))
	
	// Tạo Event
	event := model.Event{
		CameraID:        camID,
		Type:            label,
		ConfidenceScore: conf,
		Status:          "active",
		DetectedAt:      time.Now(),
	}

	// Tự động tìm chủ sở hữu
	var cameraDoc model.Camera
	err := e.db.Collection("cameras").FindOne(context.Background(), primitive.M{"_id": camID}).Decode(&cameraDoc)
	if err == nil && !cameraDoc.UserID.IsZero() {
		event.UserID = cameraDoc.UserID
	}

	res, err := e.db.Collection("events").InsertOne(context.Background(), event)
	if err != nil {
		logger.Log.Errorf("Lỗi lưu database Event: %v", err)
		return
	}
	eventID := res.InsertedID.(primitive.ObjectID)

	// Tự động trích xuất bằng chứng video (Dọn dẹp nhưng vẫn giữ lại đoạn này)
	if e.hlsServer != nil {
		go e.hlsServer.ArchiveIncident(camID.Hex(), eventID.Hex())
	}

	// Tạo Alert
	alertRecord := model.Alert{
		EventID:      eventID,
		CameraID:     camID,
		Channel:      "system",
		Recipient:    "115 & admins",
		Status:       "sent",
		SentAt:       time.Now(),
	}
	
	if _, err := e.db.Collection("alerts").InsertOne(context.Background(), alertRecord); err != nil {
		logger.Log.Errorf("Lỗi lưu database Alert: %v", err)
	}

	// Đẩy tín hiệu realtime
	e.broadcastToOwner(camID, []byte(`{"event":"alert", "camera_id":"` + camID.Hex() + `", "label":"` + label + `"}`))
	e.pushFCM(camID.Hex(), label)

	// Gọi người thân
	if !event.UserID.IsZero() {
		go e.gateway.InitiateAndroidCall(event.UserID, label, CallRelative)
	}
}

func (e *Engine) callTwilioTTS(camIDHex, label string) {
	logger.Log.Infof("📞 [TWILIO TTS] Đang gọi điện 115 cho sự cố %s...", label)
}

func (e *Engine) pushFCM(camIDHex, label string) {
	logger.Log.Infof("📱 [FCM PUSH] Gửi notification đến mobile: %s", label)
}

// CallTestManual hỗ trợ nút bấm Test trên giao diện Web
func (e *Engine) CallTestManual(userID primitive.ObjectID) {
	logger.Log.Infow("🧪 [TEST] Kích hoạt cuộc gọi thử nghiệm", "userID", userID.Hex())
	e.gateway.InitiateAndroidCall(userID, "đây là một cuộc gọi thử nghiệm", CallRelative)
}
