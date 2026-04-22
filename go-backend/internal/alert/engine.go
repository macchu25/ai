package alert

import (
	"context"
	"log"
	"sync"
	"time"

	"go-backend/internal/model"
	"go-backend/internal/ws"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AIResult struct {
	CameraID   primitive.ObjectID
	Label      string
	Confidence float32
}

type CameraState struct {
	SuspectStart time.Time
	LastAlert    time.Time
}

type Engine struct {
	db       *mongo.Database
	states   map[primitive.ObjectID]*CameraState
	mutex    sync.RWMutex
	ResultCh chan AIResult
	hub      *ws.Hub
}

func NewEngine(db *mongo.Database, hub *ws.Hub) *Engine {
	return &Engine{
		db:       db,
		states:   make(map[primitive.ObjectID]*CameraState),
		ResultCh: make(chan AIResult, 100),
		hub:      hub,
	}
}

func (e *Engine) Start() {
	go func() {
		log.Println("[AlertEngine] Bắt đầu lắng nghe AI results...")
		for result := range e.ResultCh {
			e.Process(result.CameraID, result.Label, result.Confidence)
		}
	}()
}

func (e *Engine) Process(camID primitive.ObjectID, label string, conf float32) {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	state, exists := e.states[camID]
	if !exists {
		state = &CameraState{}
		e.states[camID] = state
	}

	if conf > 0.85 && label != "normal" && label != "" {
		if state.SuspectStart.IsZero() {
			state.SuspectStart = time.Now()
			log.Printf("[AlertEngine] Camera %s chuyển sang trạng thái SUSPICIOUS (%s, conf: %.2f)\n", camID.Hex(), label, conf)
		}

		elapsed := time.Since(state.SuspectStart)
		if elapsed >= 10*time.Second {
			if state.LastAlert.IsZero() || time.Since(state.LastAlert) >= 5*time.Minute {
				e.triggerAlert(camID, label, conf)
				state.LastAlert = time.Now()
			}
		}
	} else {
		if !state.SuspectStart.IsZero() {
			state.SuspectStart = time.Time{}
			log.Printf("[AlertEngine] Camera %s trở lại trạng thái NORMAL\n", camID.Hex())
		}
	}
}

func (e *Engine) triggerAlert(camID primitive.ObjectID, label string, conf float32) {
	log.Printf("🚨 [ALERT] Phát hiện sự cố %s (Confidence: %.2f) tại Camera %s🚨\n", label, conf, camID.Hex())

	// Tạo Event
	event := model.Event{
		CameraID:        camID,
		Type:            label,
		ConfidenceScore: conf,
		Status:          "active",
		DetectedAt:      time.Now(),
	}

	// Tự động tìm chủ sở hữu của Camera để gán UserID cho Event
	var cameraDoc model.Camera
	err := e.db.Collection("cameras").FindOne(context.Background(), primitive.M{"_id": camID}).Decode(&cameraDoc)
	if err == nil && !cameraDoc.UserID.IsZero() {
		event.UserID = cameraDoc.UserID
	}

	res, err := e.db.Collection("events").InsertOne(context.Background(), event)
	if err != nil {
		log.Printf("[AlertEngine] Lỗi lưu database Event: %v\n", err)
		return
	}
	eventID := res.InsertedID.(primitive.ObjectID)

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
		log.Printf("[AlertEngine] Lỗi lưu database Alert: %v\n", err)
	}

	// Đẩy tín hiệu realtime qua WebSockets cho toàn bộ frontend dashboard
	if e.hub != nil {
		e.hub.Broadcast <- []byte(`{"event":"alert", "camera_id":"` + camID.Hex() + `", "label":"` + label + `"}`)
	}

	e.callTwilioTTS(camID.Hex(), label)
	e.pushFCM(camID.Hex(), label)
}

func (e *Engine) callTwilioTTS(camIDHex, label string) {
	log.Printf("📞 [TWILIO TTS] Đang gọi điện 115 cho sự cố %s...\n", label)
}

func (e *Engine) pushFCM(camIDHex, label string) {
	log.Printf("📱 [FCM PUSH] Gửi notification đến mobile: Sự cố %s\n", label)
}
