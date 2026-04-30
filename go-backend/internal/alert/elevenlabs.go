package alert

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"net/url"
)

// CallRelative thực hiện cuộc gọi qua Android ADB và dùng Google TTS để đọc thông báo
func CallRelative(phoneNumber, patientName, incidentType string) error {
	// Nội dung thông báo
	text := fmt.Sprintf("Cảnh báo khẩn cấp từ hệ thống Cardiac Alert. Người thân của bạn là %s đang gặp sự cố %s. Vui lòng kiểm tra ngay lập tức.", patientName, incidentType)
	
	return triggerAndroidCall(phoneNumber, text)
}

func triggerAndroidCall(toPhoneNumber, alertText string) error {
	adbPath := filepath.Join("..", "platform-tools", "adb.exe")
	
	log.Printf("📱 [Android Gateway] Đang chuẩn bị gọi đến %s...\n", toPhoneNumber)

	// 1. Đánh thức điện thoại
	exec.Command(adbPath, "shell", "input", "keyevent", "KEYCODE_WAKEUP").Run()
	exec.Command(adbPath, "shell", "wm", "dismiss-keyguard").Run()

	// 2. Thực hiện cuộc gọi
	log.Printf("📞 Đang gọi %s...\n", toPhoneNumber)
	exec.Command(adbPath, "shell", "am", "start", "-a", "android.intent.action.CALL", "-d", "tel:"+toPhoneNumber).Run()

	// 3. Đợi người dùng nhấc máy (Rút ngắn còn 6 giây cho nhanh)
	log.Println("⏳ Đợi nhấc máy (6 giây)...")
	time.Sleep(6 * time.Second)

	// 4. Bật loa ngoài
	exec.Command(adbPath, "shell", "input", "keyevent", "KEYCODE_SPEAKERPHONE_ON").Run()

	// 5. PHÁT GIỌNG NÓI QUA GOOGLE TRANSLATE TTS (MIỄN PHÍ)
	log.Println("📢 Đang yêu cầu chị Google đọc thông báo...")
	
	// Encode văn bản để đưa vào URL
	encodedText := url.QueryEscape(alertText)
	ttsURL := fmt.Sprintf("https://translate.google.com/translate_tts?ie=UTF-8&q=%s&tl=vi&client=tw-ob", encodedText)
	
	// Tăng âm lượng tối đa
	exec.Command(adbPath, "shell", "media", "volume", "--stream", "3", "--set", "15").Run()
	
	// Ra lệnh cho Android mở link này (nó sẽ tự động phát âm thanh)
	exec.Command(adbPath, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", ttsURL).Run()

	log.Printf("✅ [Android Gateway] Đã hoàn tất quy trình báo động miễn phí.\n")
	return nil
}
