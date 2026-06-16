package alert

import (
	"context"
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"go-backend/internal/cloud"
	"go-backend/internal/metrics"
	"go-backend/internal/model"
	"go-backend/internal/stream"
	"go-backend/internal/telephony"
	"go-backend/internal/ws"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AIResult struct {
	CameraID      primitive.ObjectID
	ModelName     string
	Label         string
	Confidence    float32
	EvidenceImage []byte
}

type Engine struct {
	db        *mongo.Database
	storage   StateStorage
	ResultCh  chan AIResult
	hub       *ws.Hub
	gateway   *telephony.Gateway
	hlsServer *stream.HLSServer
	cloudSync *cloud.SyncManager
}

func NewEngine(db *mongo.Database, hub *ws.Hub, hls *stream.HLSServer) *Engine {
	var storage StateStorage
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		storage = NewRedisStorage(redisURL)
	} else {
		storage = NewMemoryStorage()
	}

	engine := &Engine{
		db:        db,
		storage:   storage,
		ResultCh:  make(chan AIResult, 100),
		hub:       hub,
		gateway:   telephony.NewGateway(db),
		hlsServer: hls,
		cloudSync: cloud.NewSyncManager(),
	}

	// LẮNG NGHE LỆNH TỪ TELEGRAM
	go telephony.StartBotListener(func(senderID, action, data string) {
		ctx := context.Background()
		var targetUserID primitive.ObjectID
		if action == "call" {
			id, err := primitive.ObjectIDFromHex(data)
			if err != nil { return }
			targetUserID = id
		} else {
			camID, err := primitive.ObjectIDFromHex(data)
			if err != nil { return }
			var camera model.Camera
			if err := engine.db.Collection("cameras").FindOne(ctx, bson.M{"_id": camID}).Decode(&camera); err != nil {
				return
			}
			targetUserID = camera.UserID
		}

		ownerChatID := engine.getUserChatID(targetUserID)
		if senderID != ownerChatID && senderID != os.Getenv("TELEGRAM_CHAT_ID") {
			telephony.SendTelegramAlertCustom(senderID, "⚠️ Bạn không có quyền điều khiển hệ thống này.", nil)
			return
		}

		switch action {
		case "call":
			var camera model.Camera
			if err := engine.db.Collection("cameras").FindOne(ctx, bson.M{"user_id": targetUserID}).Decode(&camera); err != nil {
				log.Printf("[Bot] Lỗi tìm camera cho user %s: %v\n", targetUserID.Hex(), err)
				return
			}
			engine.gateway.InitiateAndroidCall(targetUserID, camera.ID, "yêu cầu khẩn cấp", telephony.CallRelative, camera.Name)
		case "pause":
			camID, err := primitive.ObjectIDFromHex(data)
			if err != nil { return }
			state, _ := engine.storage.Get(ctx, camID)
			if state != nil {
				state.AlertPaused = true
				engine.storage.Set(ctx, camID, state)
				telephony.SendTelegramAlertCustom(senderID, "✅ Đã dừng báo động lặp lại.", nil)
			}
		case "guide":
			msg := "🤔 <b>Trợ lý Casos:</b> Bạn có đang ở gần nạn nhân không?"
			buttons := telephony.InlineKeyboardMarkup{
				InlineKeyboard: [][]telephony.InlineButton{
					{{Text: "✅ CÓ, TÔI Ở GẦN", CallbackData: "athome_yes:" + data}},
					{{Text: "❌ KHÔNG, TÔI Ở XA", CallbackData: "athome_no:" + data}},
				},
			}
			telephony.SendTelegramAlertCustom(senderID, msg, buttons)
		case "athome_yes":
			telephony.SendTelegramAlertCustom(senderID, "🚑 <b>HÀNH ĐỘNG:</b> Đến ngay hiện trường, giữ nạn nhân nằm yên, gọi 115.", nil)
		case "athome_no":
			telephony.SendTelegramAlertCustom(senderID, "📡 <b>HÀNH ĐỘNG:</b> Gọi hàng xóm, cung cấp địa chỉ cho 115.", nil)
		}
	})

	return engine
}

func (e *Engine) Start() {
	go func() {
		for result := range e.ResultCh {
			e.Process(result.CameraID, result.ModelName, result.Label, result.Confidence, result.EvidenceImage)
		}
	}()
}

func (e *Engine) getUserChatID(userID primitive.ObjectID) string {
	var user bson.M
	if err := e.db.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user); err == nil {
		if chatID, ok := user["telegram_chat_id"].(string); ok { return chatID }
	}
	return os.Getenv("TELEGRAM_CHAT_ID")
}

func (e *Engine) getMedicalSummary(userID primitive.ObjectID) string {
	var profile bson.M
	err := e.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
	if err != nil { return "<i>(Chưa có thông tin y tế)</i>" }
	bloodType, _ := profile["blood_type"].(string)
	history, _ := profile["medical_history"].(string)
	if bloodType == "" { bloodType = "Chưa rõ" }
	if history == "" { history = "Không có" }
	return fmt.Sprintf("🩸 <b>Nhóm máu:</b> %s\n💊 <b>Tiền sử:</b> %s", html.EscapeString(bloodType), html.EscapeString(history))
}

func (e *Engine) getMedicalSummaryPlain(userID primitive.ObjectID) string {
	var profile bson.M
	err := e.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
	if err != nil { return "Chưa có thông tin y tế" }
	bloodType, _ := profile["blood_type"].(string)
	history, _ := profile["medical_history"].(string)
	if bloodType == "" { bloodType = "Chưa rõ" }
	if history == "" { history = "Không có" }
	return fmt.Sprintf("Nhóm máu: %s. Tiền sử bệnh: %s.", bloodType, history)
}

func (e *Engine) Process(camID primitive.ObjectID, modelName string, label string, conf float32, imgBytes []byte) {
	ctx := context.Background()

	// KIỂM TRA MODEL CÓ ĐANG ACTIVE KHÔNG
	if modelName != "" {
		var aiModel bson.M
		err := e.db.Collection("ai_models").FindOne(ctx, bson.M{"name": modelName}).Decode(&aiModel)
		if err == nil {
			if status, ok := aiModel["status"].(string); ok && status != "Active" {
				// Model bị tắt, bỏ qua kết quả
				return
			}
		}
	}

	state, _ := e.storage.Get(ctx, camID)
	if state == nil { state = &CameraState{} }

	isAbnormal := false
	alertLabel := label

	if modelName == "Remote Heart Rate Monitor (rPPG)" {
		var hr, rr float64
		// Parse "rPPG: 72.5 BPM | Resp: 16.2 RPM"
		_, err := fmt.Sscanf(label, "rPPG: %f BPM | Resp: %f RPM", &hr, &rr)
		if err == nil {
			// Ngưỡng mặc định cho người bình thường
			hrLowDanger := 50.0
			hrLowWarning := 60.0
			hrHighWarning := 100.0
			hrHighDanger := 120.0

			rrLowDanger := 10.0
			rrLowWarning := 12.0
			rrHighWarning := 20.0
			rrHighDanger := 24.0

			hrCriticalLow := 40.0
			hrCriticalHigh := 140.0
			rrCriticalLow := 6.0
			rrCriticalHigh := 30.0

			isPersonalized := false

			// Tìm camera để lấy UserID
			var camera model.Camera
			errCam := e.db.Collection("cameras").FindOne(ctx, bson.M{"_id": camID}).Decode(&camera)
			if errCam == nil {
				// Tìm hồ sơ sức khỏe của bệnh nhân
				var profile model.HealthProfile
				errProfile := e.db.Collection("health_profiles").FindOne(ctx, bson.M{"user_id": camera.UserID}).Decode(&profile)
				if errProfile == nil {
					// Nếu có thông tin bệnh án, kích hoạt hướng cá nhân hóa
					isPersonalized = true

					// 1. Kiểm tra bệnh lý nền
					hasHeartCondition := false
					hasLungCondition := false
					for _, cond := range profile.Conditions {
						condLower := strings.ToLower(cond)
						if strings.Contains(condLower, "heart") || strings.Contains(condLower, "tim") || strings.Contains(condLower, "mạch") {
							hasHeartCondition = true
						}
						if strings.Contains(condLower, "asthma") || strings.Contains(condLower, "hen") || strings.Contains(condLower, "copd") || strings.Contains(condLower, "phổi") {
							hasLungCondition = true
						}
					}

					// 2. Kiểm tra thuốc điều trị
					hasBetaBlocker := false
					for _, med := range profile.Medications {
						medLower := strings.ToLower(med)
						if strings.Contains(medLower, "beta") || strings.Contains(medLower, "chẹn beta") {
							hasBetaBlocker = true
						}
					}

					// Áp dụng ngưỡng cá nhân hóa
					if hasHeartCondition {
						hrHighWarning = 95.0
						hrHighDanger = 110.0
						rrHighDanger = 22.0
						hrCriticalHigh = 125.0
					}
					if hasLungCondition {
						rrHighWarning = 18.0
						rrHighDanger = 22.0
						rrCriticalHigh = 26.0
					}
					if hasBetaBlocker {
						hrLowWarning = 48.0
						hrLowDanger = 40.0
						hrCriticalLow = 32.0
					}
				}
			}

			// Đánh giá chỉ số sinh tồn dựa trên ngưỡng được thiết lập (Cá nhân hóa hoặc Người thường)
			isHRDanger := hr > 0 && (hr < hrLowDanger || hr > hrHighDanger)
			isHRWarning := hr > 0 && ((hr >= hrLowDanger && hr < hrLowWarning) || (hr > hrHighWarning && hr <= hrHighDanger))
			isRRDanger := rr == 0.0 || (rr > 0 && (rr < rrLowDanger || rr > rrHighDanger))
			isRRWarning := rr > 0 && ((rr >= rrLowDanger && rr < rrLowWarning) || (rr > rrHighWarning && rr <= rrHighDanger))

			isCritical := (hr > 0 && (hr < hrCriticalLow || hr > hrCriticalHigh)) || rr == 0.0 || (rr > 0 && (rr < rrCriticalLow || rr > rrCriticalHigh))

			if isHRDanger || isRRDanger {
				isAbnormal = true
				
				personalStr := "Người thường"
				if isPersonalized {
					personalStr = "Cá nhân hóa"
				}

				if isCritical {
					alertLabel = fmt.Sprintf("CẤP CỨU (%s): Ngừng tim/Suy hô hấp (Nhịp tim %.1f BPM | Nhịp thở %.1f RPM)", personalStr, hr, rr)
				} else {
					alertLabel = fmt.Sprintf("Nguy kịch (%s): Nhịp tim %.1f BPM | Nhịp thở %.1f RPM", personalStr, hr, rr)
				}
			} else if isHRWarning || isRRWarning {
				isAbnormal = true
				personalStr := "Người thường"
				if isPersonalized {
					personalStr = "Cá nhân hóa"
				}
				alertLabel = fmt.Sprintf("Cảnh báo (%s): Nhịp tim %.1f BPM | Nhịp thở %.1f RPM", personalStr, hr, rr)
			} else {
				// Chỉ số bình thường, không kích hoạt báo động khẩn cấp
				// Nhưng ta vẫn có thể cập nhật trạng thái bình thường để xóa cảnh báo trước đó nếu có
				if !state.SuspectStart.IsZero() {
					state.SuspectStart = time.Time{}
					state.AlertPaused = false
					state.LocalAlertSent = false
					metrics.ActiveAlerts.Dec()
					e.broadcastToOwner(camID, []byte(`{"event":"clear_alert", "camera_id":"` + camID.Hex() + `"}`))
					e.storage.Set(ctx, camID, state)
				}
				return
			}
		} else {
			// Nếu parse lỗi, không báo động nhầm
			return
		}
	} else {
		// Các model khác (như Fall Detection hay Facial Pain Detector)
		if label != "normal" && label != "" && float64(conf) > 0.85 {
			isAbnormal = true
		}
	}

	if isAbnormal {
		if state.SuspectStart.IsZero() {
			state.SuspectStart = time.Now()
			state.AlertPaused = false
			metrics.ActiveAlerts.Inc()
		}
		if state.AlertPaused { return }
		
		// Xác định thời gian chờ tối thiểu dựa trên mức độ nguy hiểm
		requiredSeconds := 8.0
		criticalAlertSeconds := 15.0

		if modelName == "Remote Heart Rate Monitor (rPPG)" {
			var hr, rr float64
			_, err := fmt.Sscanf(label, "rPPG: %f BPM | Resp: %f RPM", &hr, &rr)
			if err == nil {
				isCritical := (hr > 0 && (hr < 40 || hr > 140)) || rr == 0.0 || (rr > 0 && (rr < 6 || rr > 30))
				if isCritical {
					requiredSeconds = 3.0
					criticalAlertSeconds = 6.0
				}
			}
		} else {
			// Các mô hình khẩn cấp khác (như Fall Detection)
			requiredSeconds = 3.0
			criticalAlertSeconds = 6.0
		}

		durationAbnormal := time.Since(state.SuspectStart)

		// 1. Sau requiredSeconds giây bất thường liên tục: Gửi tin nhắn Telegram THEO DÕI và còi báo động cục bộ
		if durationAbnormal >= time.Duration(requiredSeconds)*time.Second {
			if !state.LocalAlertSent {
				var camera model.Camera
				if err := e.db.Collection("cameras").FindOne(ctx, bson.M{"_id": camID}).Decode(&camera); err == nil {
					go e.gateway.TriggerLocalAlarm(camera.UserID, camID)
					
					// Gửi Telegram Theo Dõi khi xác nhận bất thường kéo dài
					_, patientName := e.getDetailedInfo(camID, camera.UserID)
					msg := fmt.Sprintf("🔍 <b>[Casos - THEO DÕI]</b>\n👤 <b>Đối tượng:</b> %s\n⚠️ <b>Dấu hiệu bất thường:</b> %s\n⏱️ <i>(Xác nhận sau %.0f giây liên tục)</i>", html.EscapeString(patientName), html.EscapeString(alertLabel), requiredSeconds)
					go telephony.SendTelegramAlertCustom(e.getUserChatID(camera.UserID), msg, nil)
				}
				e.broadcastToOwner(camID, []byte(`{"event":"local_warning", "camera_id":"` + camID.Hex() + `"}`))
				state.LocalAlertSent = true
			}
		}
		
		// 2. Sau criticalAlertSeconds giây bất thường liên tục: Kích hoạt cuộc gọi khẩn cấp Twilio & Alert đỏ & Log vào DB
		if durationAbnormal >= time.Duration(criticalAlertSeconds)*time.Second {
			if state.LastAlert.IsZero() || time.Since(state.LastAlert) >= 3*time.Minute {
				e.triggerAlert(camID, alertLabel, conf, imgBytes)
				state.LastAlert = time.Now()
			}
		}
		e.storage.Set(ctx, camID, state)
	} else {
		if !state.SuspectStart.IsZero() {
			state.SuspectStart = time.Time{}
			state.AlertPaused = false
			state.LocalAlertSent = false
			metrics.ActiveAlerts.Dec()
			e.broadcastToOwner(camID, []byte(`{"event":"clear_alert", "camera_id":"` + camID.Hex() + `"}`))
			e.storage.Set(ctx, camID, state)
		}
	}
}

func (e *Engine) triggerAlert(camID primitive.ObjectID, label string, conf float32, imgBytes []byte) {
	var cameraDoc model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": camID}).Decode(&cameraDoc); err != nil {
		log.Printf("[Engine] Lỗi triggerAlert: không tìm thấy camera %s: %v\n", camID.Hex(), err)
		return
	}
	camName, patientName := e.getDetailedInfo(camID, cameraDoc.UserID)
	chatID := e.getUserChatID(cameraDoc.UserID)
	medical := e.getMedicalSummary(cameraDoc.UserID)

	msg := fmt.Sprintf("🚨 <b>[Casos - KHẨN CẤP]</b>\n🆘 <b>SỰ CỐ:</b> %s\n👤 <b>Nạn nhân:</b> %s\n📍 <b>Tại:</b> %s\n📋 <b>HỒ SƠ Y TẾ:</b>\n%s", html.EscapeString(label), html.EscapeString(patientName), html.EscapeString(camName), medical)
	buttons := telephony.InlineKeyboardMarkup{
		InlineKeyboard: [][]telephony.InlineButton{
			{{Text: "📖 HƯỚNG DẪN XỬ LÝ", CallbackData: "guide:" + camID.Hex()}},
			{{Text: "⏹️ TẠM DỪNG BÁO ĐỘNG", CallbackData: "pause:" + camID.Hex()}},
			{{Text: "⚡ GỌI LẠI KHẨN CẤP", CallbackData: "call:" + cameraDoc.UserID.Hex()}},
		},
	}
	go telephony.SendTelegramAlertCustom(chatID, msg, buttons)
	
	evidencePath := "audio/mockup.png"
	caption := "🚨 BẰNG CHỨNG"
	if len(imgBytes) > 0 {
		evidencePath = "audio/evidence_temp.jpg"
		err := os.WriteFile(evidencePath, imgBytes, 0644)
		if err != nil {
			log.Printf("[Engine] Lỗi ghi file ảnh bằng chứng: %v\n", err)
			evidencePath = "audio/mockup.png"
		} else {
			caption = "🚨 BẰNG CHỨNG THỰC TẾ"
		}
	}

	imgData, err := os.ReadFile(evidencePath)
	if err == nil {
		go telephony.SendTelegramPhotoCustom(chatID, caption, imgData, buttons)
	} else {
		log.Printf("[Engine] Không thể đọc ảnh bằng chứng: %v\n", err)
	}
	metrics.EmergencyCalls.Inc()
	go e.gateway.InitiateAndroidCall(cameraDoc.UserID, camID, label, telephony.CallRelative, camName)

	// HYBRID CLOUD: Đẩy bằng chứng lên S3/Firebase
	go func() {
		e.cloudSync.UploadIncidentEvidence(evidencePath)
	}()

	// ─── LƯU INCIDENT VÀO VECTOR DB ───
	go func() {
		incidentText := fmt.Sprintf("Phát hiện sự cố %s tại %s của bệnh nhân %s vào lúc %s.", label, camName, patientName, time.Now().Format("15:04:05 02/01/2006"))
		
		// 1. Lưu vào MongoDB collection 'events'
		event := bson.M{
			"user_id":          cameraDoc.UserID,
			"camera_id":        camID,
			"camera_name":      camName,
			"type":             label,
			"confidence_score": conf,
			"status":           "active",
			"description":      incidentText,
			"detected_at":      time.Now(),
			"created_at":       time.Now(),
		}
		e.db.Collection("events").InsertOne(context.Background(), event)

		// 2. Lưu vào AI Vector DB
		payload := map[string]interface{}{
			"id":       primitive.NewObjectID().Hex(),
			"text":     incidentText,
			"metadata": map[string]string{"user_id": cameraDoc.UserID.Hex(), "type": label},
		}
		pbody, _ := json.Marshal(payload)
		aiBrainURL := os.Getenv("AI_BRAIN_URL")
		if aiBrainURL == "" {
			aiBrainURL = "http://localhost:8001"
		}
		http.Post(aiBrainURL+"/index", "application/json", bytes.NewBuffer(pbody))
	}()
}

func (e *Engine) getDetailedInfo(camID, userID primitive.ObjectID) (string, string) {
	camName := camID.Hex()
	var camera model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": camID}).Decode(&camera); err != nil {
		log.Printf("[Engine] Lỗi getDetailedInfo cho camera %s: %v\n", camID.Hex(), err)
	}
	if camera.Name != "" { camName = camera.Name }
	patientName := "Người thân"
	var profile bson.M
	if err := e.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile); err == nil {
		if name, ok := profile["name"].(string); ok { patientName = name }
	}
	return camName, patientName
}

func (e *Engine) broadcastToOwner(camID primitive.ObjectID, data []byte) {
	if e.hub == nil { return }
	var cameraDoc model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": camID}).Decode(&cameraDoc); err != nil {
		return
	}
	if !cameraDoc.UserID.IsZero() {
		e.hub.Broadcast <- ws.PrivateMessage{UserID: cameraDoc.UserID.Hex(), Data: data}
	}
}

func (e *Engine) CallTestManual(userID primitive.ObjectID, specificPhone string) {
	var camera model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&camera); err != nil {
		log.Printf("[Engine] Lỗi CallTestManual: không có camera cho user %s: %v\n", userID.Hex(), err)
		return
	}
	camName, patientName := e.getDetailedInfo(camera.ID, userID)
	msg := fmt.Sprintf("🚨 <b>[Casos - TEST]</b>\n👤 <b>Nạn nhân:</b> %s\n📍 <b>Tại:</b> %s", patientName, camName)
	buttons := telephony.InlineKeyboardMarkup{
		InlineKeyboard: [][]telephony.InlineButton{
			{{Text: "📖 HƯỚNG DẪN XỬ LÝ", CallbackData: "guide:" + camera.ID.Hex()}},
			{{Text: "⏹️ TẠM DỪNG TEST", CallbackData: "pause:" + camera.ID.Hex()}},
			{{Text: "⚡ GỌI TEST LẠI", CallbackData: "call:" + userID.Hex()}},
		},
	}
	go telephony.SendTelegramAlertCustom(e.getUserChatID(userID), msg, buttons)
	e.gateway.InitiateAndroidCall(userID, camera.ID, "đang bị ngã", telephony.CallRelative, camName, specificPhone)
}
