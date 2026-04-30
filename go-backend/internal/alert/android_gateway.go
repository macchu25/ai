package alert

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"os/exec"
	"time"
)

// CallRelative thực hiện cuộc gọi qua Android ADB và dùng Google TTS để đọc thông báo
func CallRelative(phoneNumber, patientName, incidentType string) error {
	// Nội dung thông báo
	text := fmt.Sprintf("Cảnh báo khẩn cấp từ hệ thống Cardiac Alert. Người thân của bạn là %s đang gặp sự cố %s. Vui lòng kiểm tra ngay lập tức.", patientName, incidentType)
	
	return triggerAndroidCall(phoneNumber, text)
}

func triggerAndroidCall(toPhoneNumber, alertText string) error {
	// Lấy ADB_PATH từ môi trường hoặc dùng mặc định
	adbPath := os.Getenv("ADB_PATH")
	if adbPath == "" {
		adbPath = "adb" // Giả định adb có sẵn trong PATH
	}
	
	log.Printf("📱 [Android Gateway] Đang chuẩn bị gọi đến %s...\n", toPhoneNumber)

	// Hàm helper để chạy lệnh và log lỗi
	runCmd := func(args ...string) error {
		cmd := exec.Command(adbPath, args...)
		if err := cmd.Run(); err != nil {
			log.Printf("❌ [ADB Error] Lệnh %v thất bại: %v\n", args, err)
			return err
		}
		return nil
	}

	// 1. Đánh thức điện thoại
	runCmd("shell", "input", "keyevent", "KEYCODE_WAKEUP")
	runCmd("shell", "wm", "dismiss-keyguard")

	// 2. Thực hiện cuộc gọi
	log.Printf("📞 Đang gọi %s...\n", toPhoneNumber)
	if err := runCmd("shell", "am", "start", "-a", "android.intent.action.CALL", "-d", "tel:"+toPhoneNumber); err != nil {
		return err
	}

	// 3. Đợi người dùng nhấc máy (Rút ngắn còn 6 giây cho nhanh)
	log.Println("⏳ Đợi nhấc máy (6 giây)...")
	time.Sleep(6 * time.Second)

	// 4. Bật loa ngoài
	runCmd("shell", "input", "keyevent", "KEYCODE_SPEAKERPHONE_ON")

	// 5. PHÁT GIỌNG NÓI QUA GOOGLE TRANSLATE TTS (MIỄN PHÍ)
	log.Println("📢 Đang yêu cầu chị Google đọc thông báo...")
	
	// Encode văn bản để đưa vào URL
	encodedText := url.QueryEscape(alertText)
	ttsURL := fmt.Sprintf("https://translate.google.com/translate_tts?ie=UTF-8&q=%s&tl=vi&client=tw-ob", encodedText)
	
	// Tăng âm lượng tối đa
	runCmd("shell", "media", "volume", "--stream", "3", "--set", "15")
	
	// Ra lệnh cho Android mở link này (nó sẽ tự động phát âm thanh)
	if err := runCmd("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", ttsURL); err != nil {
		return err
	}

	log.Printf("✅ [Android Gateway] Đã hoàn tất quy trình báo động.\n")
	return nil
}
