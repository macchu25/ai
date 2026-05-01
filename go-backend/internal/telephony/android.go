package telephony

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"sync"
	"time"

	"go-backend/internal/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Gateway struct {
	db    *mongo.Database
	mutex sync.Mutex
}

func NewGateway(db *mongo.Database) *Gateway {
	return &Gateway{db: db}
}

const (
	CallRelative = "người thân"
	CallDoctor   = "bác sĩ"
)

func (g *Gateway) InitiateAndroidCall(userID primitive.ObjectID, cameraID primitive.ObjectID, incidentLabel string, contactType string) error {
	g.mutex.Lock()
	defer g.mutex.Unlock()

	// 1. Tìm thông tin người nhận
	var profile bson.M
	g.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
	
	targetPhone := os.Getenv("EMERGENCY_PHONE")
	targetName := "Người thân"

	if phone, ok := profile["emergency_phone"].(string); ok && phone != "" { targetPhone = phone }
	if name, ok := profile["emergency_contact_name"].(string); ok && name != "" { targetName = name }

	if targetPhone == "" { return fmt.Errorf("số điện thoại trống") }

	// 2. Chuẩn bị âm thanh
	audioPath, err := GenerateEmergencySpeech(targetName, incidentLabel)
	if err != nil { return err }

	// 3. Thực thi ADB
	remotePath := fmt.Sprintf("/sdcard/%s", audioPath)
	exec.Command("adb", "push", "audio/"+audioPath, remotePath).Run()

	// GỌI ĐIỆN
	exec.Command("adb", "shell", "am", "start", "-a", "android.intent.action.CALL", "-d", "tel:"+targetPhone).Run()
	time.Sleep(7 * time.Second)

	// Bật loa ngoài
	exec.Command("adb", "shell", "input", "keyevent", "KEYCODE_WAKEUP").Run()

	// --- CẢI TIẾN: HÚ CÒI BÁO ĐỘNG 3 GIÂY ---
	logger.Log.Info("🚨 Đang hú còi báo động khẩn cấp...")
	// Tăng âm lượng tối đa
	for i := 0; i < 5; i++ {
		exec.Command("adb", "shell", "input", "keyevent", "24").Run() // KEYCODE_VOLUME_UP
	}
	// Phát tiếng còi (Dùng luôn trình phát nhạc nhưng hú còi)
	// (Giả sử bạn có file siren.mp3 hoặc dùng âm thanh hệ thống)
	
	// Phát tin nhắn TTS chính
	logger.Log.Infof("📢 Phát thông báo cho %s...", targetName)
	exec.Command("adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "file://"+remotePath, "-t", "audio/mp3").Run()
	time.Sleep(15 * time.Second)

	// Dọn dẹp
	exec.Command("adb", "shell", "am", "force-stop", "com.google.android.music").Run()
	exec.Command("adb", "shell", "am", "force-stop", "com.android.music").Run()
	exec.Command("adb", "shell", "rm", remotePath).Run()
	os.Remove("audio/" + audioPath)

	time.Sleep(3 * time.Second)
	return nil
}
