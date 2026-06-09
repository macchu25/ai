package telephony

import (
	"context"
	"log"

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
	db     *mongo.Database
	twilio *TwilioGateway
}

func NewGateway(db *mongo.Database) *Gateway {
	return &Gateway{
		db:     db,
		twilio: NewTwilioGateway(),
	}
}

func (g *Gateway) InitiateAndroidCall(userID primitive.ObjectID, camID primitive.ObjectID, reason string, callType CallType, camName string, specificPhone ...string) {
	specificP := ""
	if len(specificPhone) > 0 {
		specificP = specificPhone[0]
	}
	phone, contactName := g.getEmergencyContact(userID, specificP)

	if phone == "" {
		log.Printf("[Telephony] BỎ QUA: Không tìm thấy số điện thoại cho user %s\n", userID.Hex())
		return
	}

	// 1. Ưu tiên dùng Twilio nếu đã cấu hình
	if g.twilio != nil && g.twilio.IsConfigured() {
		log.Printf("[Telephony] Sử dụng Twilio để gọi báo động...\n")
		err := g.twilio.InitiateOutboundCall(phone, contactName, camName, reason)
		if err == nil {
			return // Thành công thì dừng ở đây
		}
		log.Printf("[Telephony] ⚠️ Lỗi Twilio: %v\n", err)
	}

	log.Printf("[Telephony] Cảnh báo: Không thể thực hiện cuộc gọi báo động qua ADB (Đã loại bỏ tích hợp ADB).\n")
}

func (g *Gateway) TriggerLocalAlarm(userID primitive.ObjectID, camID primitive.ObjectID) {
	log.Printf("[Telephony] Cảnh báo tại chỗ được kích hoạt (Tích hợp phát âm thanh qua ADB đã bị loại bỏ).\n")
}

func (g *Gateway) getEmergencyContact(userID primitive.ObjectID, specificPhone string) (string, string) {
	var profile bson.M
	err := g.db.Collection("health_profiles").FindOne(context.Background(), bson.M{"user_id": userID}).Decode(&profile)
	if err != nil {
		return specificPhone, "Người thân"
	}
	if contacts, ok := profile["contacts"].(primitive.A); ok && len(contacts) > 0 {
		for _, contactInterface := range contacts {
			if contact, ok := contactInterface.(bson.M); ok {
				phone, _ := contact["phone"].(string)
				name, _ := contact["name"].(string)
				if name == "" { name = "Người thân" }
				if specificPhone != "" && phone == specificPhone {
					return phone, name
				}
			}
		}
		// Fallback to first contact if specificPhone is not found or not provided
		if first, ok := contacts[0].(bson.M); ok {
			phone, _ := first["phone"].(string)
			name, _ := first["name"].(string)
			if name == "" { name = "Người thân" }
			if specificPhone == "" {
				return phone, name
			}
		}
	}
	return specificPhone, "Người thân"
}
