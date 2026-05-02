package telephony

import (
	"context"
	"fmt"
	"log"
	"os/exec"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CallType string

const (
	CallRelative CallType = "người thân"
	CallDoctor   CallType = "bác sĩ"
)

type Gateway struct {
	db *mongo.Database
}

func NewGateway(db *mongo.Database) *Gateway {
	return &Gateway{db: db}
}

func (g *Gateway) InitiateAndroidCall(userID primitive.ObjectID, camID primitive.ObjectID, reason string, callType CallType) {
	phone := g.getUserPhone(userID)
	if phone == "" {
		log.Printf("[Android] BỎ QUA: Không tìm thấy số điện thoại cho user %s\n", userID.Hex())
		return
	}

	log.Printf("[Android] ĐANG GỌI 📞 %s (%s) từ Camera %s. Lý do: %s\n", phone, string(callType), camID.Hex(), reason)

	// Tạo context với timeout 30 giây cho toàn bộ tiến trình ADB
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Đẩy file âm thanh cảnh báo vào điện thoại
	audioPath := "/sdcard/alert.mp3"
	if err := exec.CommandContext(ctx, "adb", "push", "audio/emergency_vi.mp3", audioPath).Run(); err != nil {
		log.Printf("[Android] Lỗi adb push: %v. Hãy kiểm tra kết nối thiết bị!\n", err)
	}

	// 2. Kích hoạt cuộc gọi qua Intent (yêu cầu Android đã root hoặc có quyền shell đặc biệt)
	callCmd := fmt.Sprintf("am start -a android.intent.action.CALL -d tel:%s", phone)
	if err := exec.CommandContext(ctx, "adb", "shell", callCmd).Run(); err != nil {
		log.Printf("[Android] Lỗi kích hoạt cuộc gọi: %v\n", err)
	}

	// 3. (Optional) Phát âm thanh cảnh báo nếu máy đang trong cuộc gọi
	go func() {
		time.Sleep(3 * time.Second)
		playCtx, playCancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer playCancel()
		
		// Tăng âm lượng tối đa trước khi phát
		exec.CommandContext(playCtx, "adb", "shell", "input", "keyevent", "24").Run()
		exec.CommandContext(playCtx, "adb", "shell", "input", "keyevent", "24").Run()

		if err := exec.CommandContext(playCtx, "adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "file://"+audioPath, "-t", "audio/mp3").Run(); err != nil {
			log.Printf("[Android] Lỗi phát âm thanh: %v\n", err)
		}
	}()
}

func (g *Gateway) getUserPhone(userID primitive.ObjectID) string {
	var profile bson.M
	err := g.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
	if err != nil {
		return ""
	}

	// Ưu tiên lấy từ contacts nếu có
	if contacts, ok := profile["contacts"].(primitive.A); ok && len(contacts) > 0 {
		if first, ok := contacts[0].(bson.M); ok {
			if phone, ok := first["phone"].(string); ok && phone != "" {
				return phone
			}
		}
	}

	return ""
}
