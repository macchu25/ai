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
	CameraID              primitive.ObjectID
	ModelName             string
	Label                 string
	Confidence            float32
	EvidenceImage         []byte
	EvidenceSkeletonImage []byte
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
	redisURL := os.Getenv("REDIS_URL")
	storage := NewSmartStorage(redisURL)

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
		case "guide_vitals":
			msg := "🤔 <b>Trợ lý Casos (Chỉ số sinh tồn):</b> Bạn có đang ở gần nạn nhân không?"
			buttons := telephony.InlineKeyboardMarkup{
				InlineKeyboard: [][]telephony.InlineButton{
					{{Text: "✅ CÓ, TÔI Ở GẦN", CallbackData: "athome_yes_vitals:" + data}},
					{{Text: "❌ KHÔNG, TÔI Ở XA", CallbackData: "athome_no:" + data}},
				},
			}
			telephony.SendTelegramAlertCustom(senderID, msg, buttons)
		case "athome_yes_vitals":
			msg := "🚑 <b>Trợ lý Cấp cứu Casos:</b> Hãy chọn đúng trạng thái nhịp sinh tồn hiện tại của nạn nhân bên dưới để nhận hướng dẫn sơ cứu khẩn cấp:"
			buttons := telephony.InlineKeyboardMarkup{
				InlineKeyboard: [][]telephony.InlineButton{
					{
						{Text: "🫁 Ngưng tim / Ngưng thở (CPR)", CallbackData: "fa_cpr:" + data},
					},
					{
						{Text: "❤️ Nhịp tim nhanh (Tachycardia)", CallbackData: "fa_hr_high:" + data},
						{Text: "💙 Nhịp tim chậm (Bradycardia)", CallbackData: "fa_hr_low:" + data},
					},
					{
						{Text: "🌬️ Ngừng thở lâm sàng (Apnea)", CallbackData: "fa_apnea:" + data},
					},
				},
			}
			telephony.SendTelegramAlertCustom(senderID, msg, buttons)
		case "athome_yes":
			msg := "🚑 <b>Trợ lý Cấp cứu Casos:</b> Bạn đang ở gần nạn nhân. Hãy chọn đúng trường hợp thực tế của nạn nhân bên dưới để nhận hướng dẫn sơ cứu chuẩn y tế:"
			buttons := telephony.InlineKeyboardMarkup{
				InlineKeyboard: [][]telephony.InlineButton{
					{
						{Text: "🧠 Chấn thương đầu", CallbackData: "fa_head:" + data},
						{Text: "🫁 Hồi sức tim phổi (CPR)", CallbackData: "fa_cpr:" + data},
					},
					{
						{Text: "🦴 Gãy xương/Khớp", CallbackData: "fa_bone:" + data},
						{Text: "🩸 Chảy máu hở", CallbackData: "fa_blood:" + data},
					},
					{
						{Text: "🧠 Nghi Đột quỵ", CallbackData: "fa_stroke:" + data},
						{Text: "🌀 Co giật/Động kinh", CallbackData: "fa_seizure:" + data},
					},
					{
						{Text: "❤️ Nhịp tim nhanh", CallbackData: "fa_hr_high:" + data},
						{Text: "💙 Nhịp tim chậm", CallbackData: "fa_hr_low:" + data},
					},
					{
						{Text: "🌬️ Ngừng thở (Apnea)", CallbackData: "fa_apnea:" + data},
					},
				},
			}
			telephony.SendTelegramAlertCustom(senderID, msg, buttons)
		case "athome_no":
			msg := "📡 <b>HƯỚNG DẪN XỬ LÝ KHẨN CẤP (KHI Ở XA):</b>\n\n" +
				"<b>1. GỌI NGAY CỨU HỘ 115:</b>\n" +
				"• Cung cấp địa chỉ nhà chính xác của nạn nhân.\n" +
				"• Báo cáo rõ: <i>'Hệ thống AI giám sát báo động ngã khẩn cấp tại phòng khách/phòng ngủ.'</i>\n\n" +
				"<b>2. LIÊN LẠC HÀNG XÓM / BAN QUẢN LÝ:</b>\n" +
				"• Gọi ngay cho hàng xóm gần nhất hoặc bảo vệ tòa nhà chạy sang kiểm tra cứu giúp.\n\n" +
				"<b>3. TIẾP CẬN VÀO NHÀ:</b>\n" +
				"• Kích hoạt mở khóa thông minh (Smart Lock) từ xa nếu có.\n" +
				"• Hướng dẫn hàng xóm/cứu hộ nơi để chìa khóa dự phòng hoặc lối vào nhanh nhất.\n\n" +
				"<b>4. GIÁM SÁT QUA CAMERA:</b>\n" +
				"• Bật camera trực tiếp trên ứng dụng Casos để cập nhật tình hình thực tế và báo cho đội cấp cứu khi họ đến."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_head":
			msg := "🧠 <b>SƠ CỨU: CHẤN THƯƠNG ĐẦU / BẤT TỈNH</b>\n\n" +
				"<b>1. CỐ ĐỊNH CỘT SỐNG CỔ (CỰC KỲ QUAN TRỌNG):</b>\n" +
				"• Giữ đầu và cổ thẳng hàng với thân mình. ⚠️ <b>KHÔNG</b> tự ý bế xốc hay di chuyển đầu nạn nhân để tránh liệt vĩnh viễn nếu có chấn thương cổ.\n\n" +
				"<b>2. KIỂM TRÃ ĐƯỜNG THỞ:</b>\n" +
				"• Nếu bất tỉnh nhưng vẫn thở: Nghiêng nhẹ người nạn nhân sang tư thế nằm nghiêng an toàn (tư thế hồi phục) để đờm nhớt hoặc chất nôn chảy ra ngoài, tránh sặc đường thở.\n\n" +
				"<b>3. XỬ LÝ CHẢY MÁU:</b>\n" +
				"• Dùng gạc hoặc vải sạch ép nhẹ trực tiếp lên vết thương đầu để cầm máu.\n" +
				"• ⚠️ <b>LƯU Ý:</b> Nếu có máu hoặc dịch trong chảy ra từ tai/mũi, <b>KHÔNG</b> bịt lại, hãy để chảy tự do và kê đầu cao nhẹ."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_cpr":
			msg := "🫁 <b>SƠ CỨU: NGỪNG TIM / NGỪNG THỞ (CPR)</b>\n\n" +
				"<b>1. CHUẨN BỊ:</b>\n" +
				"• Đặt nạn nhân nằm ngửa trên mặt phẳng cứng (sàn nhà, không nằm trên đệm).\n\n" +
				"<b>2. ÉP TIM LIÊN TỤC (CPR):</b>\n" +
				"• Đặt gót bàn tay lên giữa xương ức (giữa hai núm vú). Tay kia chồng lên trên, khóa các ngón tay.\n" +
				"• Dùng lực toàn thân ép thẳng góc xuống ngực sâu 5-6 cm, tần số 100-120 lần/phút (nhịp nhạc <i>'Staying Alive'</i>).\n" +
				"• Đảm bảo lồng ngực nở hoàn toàn sau mỗi lần ép.\n\n" +
				"<b>3. HÀ HƠI THỔI NGẠT (NẾU BIẾT CÁCH):</b>\n" +
				"• Tỉ lệ: 30 lần ép tim - 2 lần hà hơi thổi ngạt.\n" +
				"• Nếu không được huấn luyện thổi ngạt: <b>ÉP TIM LIÊN TỤC</b> không dừng cho đến khi y tế đến."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_bone":
			msg := "🦴 <b>SƠ CỨU: NGHI NGỜ GÃY XƯƠNG / CHẤN THƯƠNG KHỚP</b>\n\n" +
				"<b>1. GIỮ NGUYÊN TƯ THẾ:</b>\n" +
				"• ⚠️ <b>KHÔNG</b> di chuyển nạn nhân. Tuyệt đối không cố nắn, bẻ thẳng hoặc ấn xương gãy lệch về vị trí cũ.\n\n" +
				"<b>2. NẸP CỐ ĐỊNH TẠM THỜI:</b>\n" +
				"• Dùng thanh gỗ, bìa carton cứng hoặc báo cuộn chặt đặt dọc theo chi chấn thương.\n" +
				"• Dùng vải buộc cố định nẹp ở khớp trên và khớp dưới vùng bị gãy để cố định xương gãy hoàn toàn.\n\n" +
				"<b>3. CHƯỜM LẠNH & GIẢM ĐAU:</b>\n" +
				"• Đặt túi đá lạnh chườm lên vùng sưng đau 15-20 phút để giảm đau co mạch (không đắp đá trực tiếp lên da).\n" +
				"• Liên tục đắp ấm và trấn an tinh thần nạn nhân chờ xe cứu thương."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_blood":
			msg := "🩸 <b>SƠ CỨU: VẾT THƯƠNG HỞ / CHẢY MÁU NHIỀU</b>\n\n" +
				"<b>1. ĐÈ CHẶT TRỰC TIẾP:</b>\n" +
				"• Sử dụng gạc vô trùng hoặc vải sạch ấn chặt trực tiếp lên vị trí vết thương chảy máu.\n\n" +
				"<b>2. NÂNG CAO CHI CHẤN THƯƠNG:</b>\n" +
				"• Nếu chảy máu ở tay/chân, hãy nâng cao tay hoặc chân bị thương cao hơn mức tim của nạn nhân để giảm bớt áp lực máu chảy.\n\n" +
				"<b>3. BĂNG ÉP CỐ ĐỊNH:</b>\n" +
				"• Quấn băng thun đè lên miếng gạc để giữ áp lực cầm máu liên tục (kiểm tra ngón tay/chân xem có bị tím tái không để nới lỏng).\n" +
				"• ⚠️ <b>NẾU CÓ DỊ VẬT CẮM SÂU:</b> <b>KHÔNG RÚT RA</b>. Dùng vải quấn đệm xung quanh dị vật để cố định rồi băng lại."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_stroke":
			msg := "🧠 <b>SƠ CỨU: NGHI NGỜ ĐỘT QUỴ (TAI BIẾN)</b>\n\n" +
				"<b>1. QUY TẮC F.A.S.T:</b>\n" +
				"• <b>Face:</b> Mặt méo xệch một bên khi cười.\n" +
				"• <b>Arm:</b> Yếu/liệt một bên tay chân, không nâng lên được.\n" +
				"• <b>Speech:</b> Nói ngọng, phát âm khó hoặc không hiểu lời nói.\n" +
				"• <b>Time:</b> Gọi ngay <b>115</b> lập tức. Ghi nhớ giờ khởi phát đầu tiên.\n\n" +
				"<b>2. TƯ THẾ NẰM AN TOÀN:</b>\n" +
				"• Đặt nạn nhân nằm đầu cao khoảng 30 độ (hoặc nằm nghiêng nếu có dấu hiệu nôn mửa) ở nơi thoáng mát.\n\n" +
				"<b>3. ⚠️ NGUYÊN TẮC VÀNG:</b>\n" +
				"• <b>KHÔNG</b> cho ăn, uống hoặc nuốt bất kỳ thứ gì (dễ sặc đường thở gây ngạt).\n" +
				"• <b>KHÔNG</b> tự ý cho uống thuốc hạ huyết áp, aspirin hoặc chích lể nặn máu vì có thể làm trầm trọng thêm tình trạng chảy máu não."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_seizure":
			msg := "🌀 <b>SƠ CỨU: CO GIẬT / ĐỘNG KINH</b>\n\n" +
				"<b>1. TẠO KHÔNG GIAN AN TOÀN:</b>\n" +
				"• Di chuyển ngay các vật sắc nhọn, thủy tinh, đồ đạc cứng xung quanh để tránh nạn nhân va đập tự gây thương tích.\n\n" +
				"<b>2. BẢO VỆ ĐẦU:</b>\n" +
				"• Đặt một chiếc gối mỏng, mềm hoặc tấm áo cuộn lại dưới đầu nạn nhân để chống va đập xuống sàn.\n\n" +
				"<b>3. THEO DÕI ĐƯỜNG THỞ:</b>\n" +
				"• Nới lỏng cổ áo, thắt lưng. Khi cơn giật dịu đi, xoay nhẹ người nạn nhân nằm nghiêng để đờm dãi chảy ra ngoài.\n\n" +
				"<b>4. ⚠️ ĐIỀU CẤM KỴ:</b>\n" +
				"• <b>KHÔNG</b> ghì chặt hay cố đè giữ tay chân nạn nhân để cắt cơn giật (dễ gây gãy xương/rách cơ).\n" +
				"• <b>KHÔNG</b> đút ngón tay, muỗng, hoặc bất cứ vật cứng nào vào miệng nạn nhân vì có thể gây gãy răng hoặc bít tắc đường thở."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_hr_high":
			msg := "❤️ <b>SƠ CỨU: NHỊP TIM QUÁ NHANH (TACHYCARDIA)</b>\n\n" +
				"<b>1. NGHỈ NGƠI & NỚI LỎNG QUẦN ÁO:</b>\n" +
				"• Hướng dẫn nạn nhân ngồi nghỉ ở tư thế nửa nằm nửa ngồi thoải mái.\n" +
				"• Nới lỏng khuy áo ở cổ, thắt lưng để hỗ trợ thở.\n\n" +
				"<b>2. KỸ THUẬT HÍT THỞ SÂU:</b>\n" +
				"• Yêu cầu nạn nhân hít vào thật sâu bằng mũi, nén hơi 2-3 giây rồi thở ra chậm bằng miệng (giúp kích hoạt hệ phó giao cảm làm chậm nhịp tim).\n\n" +
				"<b>3. NGHIỆM PHÁP VALSALVA (NẾU TỈNH TÁO):</b>\n" +
				"• Bảo nạn nhân bịt mũi, ngậm chặt miệng và cố gắng thở mạnh ra trong 10-15 giây (như động tác rặn) để hạ nhịp tim.\n" +
				"• Có thể chườm khăn mát/nước lạnh lên vùng trán và má.\n\n" +
				"<b>4. ⚠️ LƯU Ý QUAN TRỌNG:</b>\n" +
				"• <b>KHÔNG</b> tự ý cho uống bất kỳ thuốc hạ nhịp tim nào nếu không có đơn thuốc chỉ định của bác sĩ điều trị."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_hr_low":
			msg := "💙 <b>SƠ CỨU: NHỊP TIM QUÁ CHẬM (BRADYCARDIA)</b>\n\n" +
				"<b>1. NẰM NGỬA NÂNG CAO CHÂN:</b>\n" +
				"• Đặt nạn nhân nằm ngửa trên giường hoặc sàn nhà.\n" +
				"• <b>Kê cao hai chân lên khoảng 30-45 độ</b> (dùng gối hoặc chăn cuộn) để dồn máu từ chân về tim và não nhanh hơn, phòng tránh ngất xỉu.\n\n" +
				"<b>2. GIỮ ẤM & THÔNG THOÁNG:</b>\n" +
				"• Đắp chăn giữ ấm cơ thể nếu nạn nhân cảm thấy lạnh hoặc da tái nhợt.\n" +
				"• Nới lỏng cổ áo và thắt lưng.\n\n" +
				"<b>3. THEO DÕI SÁT SAO:</b>\n" +
				"• Liên tục kiểm tra ý thức và nhịp thở. Nếu nạn nhân đột ngột bất tỉnh và ngừng thở, phải lập tức chuyển sang tiến hành ép tim ngoài lồng ngực (CPR)."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		case "fa_apnea":
			msg := "🌬️ <b>SƠ CỨU: NGỪNG THỞ LÂM SÀNG / SUY HÔ HẤP (APNEA)</b>\n\n" +
				"<b>1. KHAI THÔNG ĐƯỜNG THỞ (AIRWAY):</b>\n" +
				"• Đặt nạn nhân nằm ngửa trên nền phẳng, cứng.\n" +
				"• Thực hiện kỹ thuật ngửa đầu - nâng cằm để mở rộng đường thở.\n" +
				"• Kiểm tra và lấy nhanh mọi dị vật, đờm nhớt trong miệng nạn nhân ra.\n\n" +
				"<b>2. HÀ HƠI THỔI NGẠT KHẨN CẤP:</b>\n" +
				"• Bịt mũi nạn nhân, áp miệng thổi một hơi thật mạnh trong 1 giây để lồng ngực phồng lên.\n" +
				"• Thực hiện 2 lần thổi ngạt liên tục.\n\n" +
				"<b>3. PHỐI HỢP ÉP TIM NGOÀI LỒNG NGỰC:</b>\n" +
				"• Kiểm tra mạch đập ở cổ. Nếu không có mạch, bắt đầu chu kỳ 30 lần ép tim ngoài lồng ngực xen kẽ 2 lần thổi ngạt liên tục cho đến khi y tế đến."
			telephony.SendTelegramAlertCustom(senderID, msg, nil)
		}
	})

	return engine
}

func (e *Engine) Start() {
	go func() {
		for result := range e.ResultCh {
			e.Process(result.CameraID, result.ModelName, result.Label, result.Confidence, result.EvidenceImage, result.EvidenceSkeletonImage)
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

func (e *Engine) Process(camID primitive.ObjectID, modelName string, label string, conf float32, imgBytes []byte, skeletonImgBytes []byte) {
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

	state, err := e.storage.Get(ctx, camID)
	if err != nil {
		log.Printf("[Engine] Lỗi lấy trạng thái camera từ storage: %v\n", err)
	}
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
					e.resetCameraState(ctx, camID, state)
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

		durationAbnormal := time.Since(state.SuspectStart)

		if modelName == "Remote Heart Rate Monitor (rPPG)" {
			// Xác định thời gian chờ tối thiểu dựa trên mức độ nguy hiểm đối với rPPG
			requiredSeconds := 8.0
			criticalAlertSeconds := 15.0

			var hr, rr float64
			_, err := fmt.Sscanf(label, "rPPG: %f BPM | Resp: %f RPM", &hr, &rr)
			if err == nil {
				isCritical := (hr > 0 && (hr < 40 || hr > 140)) || rr == 0.0 || (rr > 0 && (rr < 6 || rr > 30))
				if isCritical {
					requiredSeconds = 3.0
					criticalAlertSeconds = 6.0
				}
			}

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
					e.triggerAlert(camID, alertLabel, conf, imgBytes, nil)
					state.LastAlert = time.Now()
				}
			}
		} else {
			// TRỤC THỜI GIAN CHO CẢNH BÁO TÉ NGÃ (FALL DETECTION VÀ CÁC MÔ HÌNH KHÁC)
			
			// 1. Mốc 3 giây: Bật còi báo cục bộ và gửi Telegram theo dõi
			if durationAbnormal >= 3*time.Second {
				if !state.LocalAlertSent {
					var camera model.Camera
					if err := e.db.Collection("cameras").FindOne(ctx, bson.M{"_id": camID}).Decode(&camera); err == nil {
						go e.gateway.TriggerLocalAlarm(camera.UserID, camID)
						
						_, patientName := e.getDetailedInfo(camID, camera.UserID)
						msg := fmt.Sprintf("🔍 <b>[Casos - THEO DÕI]</b>\n👤 <b>Đối tượng:</b> %s\n⚠️ <b>Dấu hiệu bất thường:</b> %s\n⏱️ <i>(Xác nhận sau 3 giây liên tục)</i>", html.EscapeString(patientName), html.EscapeString(alertLabel))
						go telephony.SendTelegramAlertCustom(e.getUserChatID(camera.UserID), msg, nil)
					}
					e.broadcastToOwner(camID, []byte(`{"event":"local_warning", "camera_id":"` + camID.Hex() + `"}`))
					state.LocalAlertSent = true
				}
			}

			// 2. Mốc 8 giây: Chụp lại hình ảnh ngã từ webcam
			if durationAbnormal >= 8*time.Second {
				if !state.SnapshotCaptured && len(imgBytes) > 0 {
					state.CapturedImageBytes = make([]byte, len(imgBytes))
					copy(state.CapturedImageBytes, imgBytes)
					if len(skeletonImgBytes) > 0 {
						state.CapturedSkeletonImageBytes = make([]byte, len(skeletonImgBytes))
						copy(state.CapturedSkeletonImageBytes, skeletonImgBytes)
					}
					state.SnapshotCaptured = true
					log.Printf("[Engine] Đã chụp ảnh bằng chứng té ngã ở giây thứ 8 cho camera %s\n", camID.Hex())
				}
			}

			// 3. Mốc 13 giây: Gửi Telegram đỏ kèm ảnh chụp ở giây thứ 8. Lặp lại mỗi 5 giây nếu vẫn ngã.
			if durationAbnormal >= 13*time.Second {
				photoToSend := state.CapturedImageBytes
				if len(photoToSend) == 0 {
					photoToSend = imgBytes
				}
				skeletonPhotoToSend := state.CapturedSkeletonImageBytes
				if len(skeletonPhotoToSend) == 0 {
					skeletonPhotoToSend = skeletonImgBytes
				}

				if !state.TelegramAlertSent {
					go e.triggerTelegramAlertOnly(camID, alertLabel, conf, photoToSend, skeletonPhotoToSend)
					state.TelegramAlertSent = true
					state.LastTelegramAlertTime = time.Now()
					state.LastAlert = time.Now()
					log.Printf("[Engine] Đã gửi Telegram đỏ cảnh báo khẩn cấp ở giây thứ 13 cho camera %s\n", camID.Hex())
				} else if time.Since(state.LastTelegramAlertTime) >= 5*time.Second {
					// Gửi lặp lại mỗi 5 giây kèm ảnh giây thứ 8 (nếu có) hoặc ảnh hiện tại
					go e.triggerTelegramAlertOnly(camID, alertLabel, conf, photoToSend, skeletonPhotoToSend)
					state.LastTelegramAlertTime = time.Now()
					log.Printf("[Engine] Gửi lại Telegram đỏ (mỗi 5s) cho camera %s\n", camID.Hex())
				}
			}

			// 4. Mốc 20 giây: Tự động gọi cho người thân. Lặp lại mỗi 30 giây nếu vẫn ngã.
			if durationAbnormal >= 20*time.Second {
				if !state.PhoneCallInitiated {
					go e.triggerPhoneCallOnly(camID, alertLabel)
					state.PhoneCallInitiated = true
					state.LastPhoneCallTime = time.Now()
					log.Printf("[Engine] Đã thực hiện cuộc gọi khẩn cấp tự động ở giây thứ 20 cho camera %s\n", camID.Hex())
				} else if time.Since(state.LastPhoneCallTime) >= 30*time.Second {
					// Gọi lặp lại mỗi 30 giây
					go e.triggerPhoneCallOnly(camID, alertLabel)
					state.LastPhoneCallTime = time.Now()
					log.Printf("[Engine] Thực hiện gọi lại khẩn cấp (mỗi 30s) cho camera %s\n", camID.Hex())
				}
			}
		}

		err = e.storage.Set(ctx, camID, state)
		if err != nil {
			log.Printf("[Engine] Lỗi ghi trạng thái camera vào storage: %v\n", err)
		}
	} else {
		if !state.SuspectStart.IsZero() {
			e.resetCameraState(ctx, camID, state)
		}
	}
}

func (e *Engine) resetCameraState(ctx context.Context, camID primitive.ObjectID, state *CameraState) {
	// Gửi thông báo hồi phục qua Telegram nếu trước đó đã có cảnh báo phát đi
	if state.TelegramAlertSent || state.LocalAlertSent {
		var cameraDoc model.Camera
		if err := e.db.Collection("cameras").FindOne(ctx, bson.M{"_id": camID}).Decode(&cameraDoc); err == nil {
			camName, patientName := e.getDetailedInfo(camID, cameraDoc.UserID)
			chatID := e.getUserChatID(cameraDoc.UserID)
			msg := fmt.Sprintf("🟢 <b>[Casos - HỒI PHỤC]</b>\n🆘 <b>Sự cố trước đó đã được giải quyết</b>\n👤 <b>Nạn nhân:</b> %s\n📍 <b>Tại:</b> %s\n✅ Hệ thống ghi nhận nạn nhân đã đứng dậy hoặc trở lại trạng thái bình thường.", html.EscapeString(patientName), html.EscapeString(camName))
			go telephony.SendTelegramAlertCustom(chatID, msg, nil)
		}
	}

	state.SuspectStart = time.Time{}
	state.AlertPaused = false
	state.LocalAlertSent = false
	state.SnapshotCaptured = false
	state.TelegramAlertSent = false
	state.PhoneCallInitiated = false
	state.CapturedImageBytes = nil
	state.CapturedSkeletonImageBytes = nil
	state.LastTelegramAlertTime = time.Time{}
	state.LastPhoneCallTime = time.Time{}
	metrics.ActiveAlerts.Dec()
	e.broadcastToOwner(camID, []byte(`{"event":"clear_alert", "camera_id":"` + camID.Hex() + `"}`))
	err := e.storage.Set(ctx, camID, state)
	if err != nil {
		log.Printf("[Engine] Lỗi ghi reset trạng thái camera vào storage: %v\n", err)
	}
	log.Printf("[Engine] Đã reset trạng thái cho camera %s về bình thường\n", camID.Hex())
}

func (e *Engine) triggerTelegramAlertOnly(camID primitive.ObjectID, label string, conf float32, imgBytes []byte, skeletonImgBytes []byte) {
	var cameraDoc model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": camID}).Decode(&cameraDoc); err != nil {
		log.Printf("[Engine] Lỗi triggerTelegramAlertOnly: không tìm thấy camera %s: %v\n", camID.Hex(), err)
		return
	}
	camName, patientName := e.getDetailedInfo(camID, cameraDoc.UserID)
	chatID := e.getUserChatID(cameraDoc.UserID)
	medical := e.getMedicalSummary(cameraDoc.UserID)

	msg := fmt.Sprintf("🚨 <b>[Casos - KHẨN CẤP]</b>\n🆘 <b>SỰ CỐ:</b> %s\n👤 <b>Nạn nhân:</b> %s\n📍 <b>Tại:</b> %s\n📋 <b>HỒ SƠ Y TẾ:</b>\n%s", html.EscapeString(label), html.EscapeString(patientName), html.EscapeString(camName), medical)
	
	guideCallback := "guide:" + camID.Hex()
	labelLower := strings.ToLower(label)
	if strings.Contains(labelLower, "bpm") || 
		strings.Contains(labelLower, "rpm") || 
		strings.Contains(labelLower, "nhịp tim") || 
		strings.Contains(labelLower, "nhịp thở") || 
		strings.Contains(labelLower, "tachycardia") || 
		strings.Contains(labelLower, "bradycardia") || 
		strings.Contains(labelLower, "apnea") {
		guideCallback = "guide_vitals:" + camID.Hex()
	}

	buttons := telephony.InlineKeyboardMarkup{
		InlineKeyboard: [][]telephony.InlineButton{
			{{Text: "📖 HƯỚNG DẪN XỬ LÝ", CallbackData: guideCallback}},
			{{Text: "⏹️ TẠM DỪNG BÁO ĐỘNG", CallbackData: "pause:" + camID.Hex()}},
			{{Text: "⚡ GỌI LẠI KHẨN CẤP", CallbackData: "call:" + cameraDoc.UserID.Hex()}},
		},
	}
	go telephony.SendTelegramAlertCustom(chatID, msg, buttons)
	
	evidencePath := "audio/mockup.png"
	caption := "🚨 BẰNG CHỨNG THỰC TẾ"
	if len(imgBytes) > 0 {
		evidencePath = "audio/evidence_temp.jpg"
		_ = os.MkdirAll("audio", 0755) // Đảm bảo thư mục audio luôn tồn tại
		err := os.WriteFile(evidencePath, imgBytes, 0644)
		if err != nil {
			log.Printf("[Engine] Lỗi ghi file ảnh bằng chứng (%s): %v\n", evidencePath, err)
			evidencePath = "audio/mockup.png"
		}
	}

	imgData, err := os.ReadFile(evidencePath)
	if err == nil {
		// Gửi ảnh thường trước (không kèm nút để tránh trùng lặp)
		go telephony.SendTelegramPhotoCustom(chatID, caption, imgData, nil)
	} else {
		log.Printf("[Engine] Không thể đọc ảnh bằng chứng (%s): %v\n", evidencePath, err)
	}

	// Gửi ảnh khung xương nếu có
	skeletonPath := ""
	if len(skeletonImgBytes) > 0 {
		skeletonPath = "audio/evidence_skeleton_temp.jpg"
		_ = os.MkdirAll("audio", 0755)
		err := os.WriteFile(skeletonPath, skeletonImgBytes, 0644)
		if err != nil {
			log.Printf("[Engine] Lỗi ghi file ảnh khung xương (%s): %v\n", skeletonPath, err)
			skeletonPath = ""
		}
	}
	if skeletonPath != "" {
		skeletonData, err := os.ReadFile(skeletonPath)
		if err == nil {
			skeletonCaption := "💀 KHUNG XƯƠNG AI QUÉT"
			// Gửi ảnh khung xương kèm các nút điều khiển
			go telephony.SendTelegramPhotoCustom(chatID, skeletonCaption, skeletonData, buttons)
		}
	}

	// HYBRID CLOUD: Đẩy bằng chứng lên S3/Firebase
	go func() {
		e.cloudSync.UploadIncidentEvidence(evidencePath)
		if skeletonPath != "" {
			e.cloudSync.UploadIncidentEvidence(skeletonPath)
		}
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

func (e *Engine) triggerPhoneCallOnly(camID primitive.ObjectID, label string) {
	var cameraDoc model.Camera
	if err := e.db.Collection("cameras").FindOne(context.Background(), bson.M{"_id": camID}).Decode(&cameraDoc); err != nil {
		log.Printf("[Engine] Lỗi triggerPhoneCallOnly: không tìm thấy camera %s: %v\n", camID.Hex(), err)
		return
	}
	camName, _ := e.getDetailedInfo(camID, cameraDoc.UserID)
	metrics.EmergencyCalls.Inc()
	go e.gateway.InitiateAndroidCall(cameraDoc.UserID, camID, label, telephony.CallRelative, camName)

	// Cập nhật sự kiện trong database để báo đã gọi điện thoại
	go func() {
		time.Sleep(1 * time.Second) // Đợi sự kiện mốc 13s chèn xong
		coll := e.db.Collection("events")
		filter := bson.M{
			"camera_id": camID,
			"user_id":   cameraDoc.UserID,
			"status":    "active",
		}
		update := bson.M{
			"$set": bson.M{
				"call_initiated": true,
				"description":    fmt.Sprintf("Phát hiện sự cố %s tại %s. Đã báo qua Telegram & Đang gọi điện thoại khẩn cấp.", label, camName),
			},
		}
		_, err := coll.UpdateMany(context.Background(), filter, update)
		if err != nil {
			log.Printf("[Engine] Lỗi cập nhật trạng thái cuộc gọi vào DB: %v\n", err)
		}
	}()
}

func (e *Engine) triggerAlert(camID primitive.ObjectID, label string, conf float32, imgBytes []byte, skeletonImgBytes []byte) {
	e.triggerTelegramAlertOnly(camID, label, conf, imgBytes, skeletonImgBytes)
	e.triggerPhoneCallOnly(camID, label)
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
