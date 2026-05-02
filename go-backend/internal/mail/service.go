package mail

import (
	"fmt"
	"time"

	"go-backend/internal/logger"
)

type Service struct {
	// Có thể thêm cấu hình SMTP ở đây nếu muốn gửi thật
}

func NewService() *Service {
	return &Service{}
}

func (s *Service) SendSubscriptionEmail(toEmail, userName, planName string, paidAt, expiresAt time.Time, bankRef string) error {
	// GIẢ LẬP GỬI EMAIL: Trong thực tế bạn sẽ dùng thư viện gomail hoặc net/smtp
	subject := "Chúc mừng! Bạn đã đăng ký gói cước thành công tại Casos AI"
	refLine := ""
	if bankRef != "" {
		refLine = fmt.Sprintf("- Mã tham chiếu NG: %s\n", bankRef)
	}
	layout := "02/01/2006 15:04 (GMT+7)"
	paidTxt := paidAt.In(time.FixedZone("ICT", 7*3600)).Format(layout)
	expTxt := expiresAt.In(time.FixedZone("ICT", 7*3600)).Format(layout)

	body := fmt.Sprintf(`
Chào %s,

Chúc mừng bạn đã kích hoạt gói %s.

Thông tin gói:
- Gói: %s
- Trạng thái: Đang hoạt động
- Thanh toán/nâng cấp: %s
- Hết hạn gói: %s
%s
Các tính năng nâng cao đã mở cho tài khoản của bạn. Bạn cũng sẽ thấy thông báo trong trung tâm cảnh báo của ứng dụng.

Cảm ơn bạn đã đồng hành cùng Casos AI Studio.

Trân trọng,
Đội ngũ Casos AI Studio`, userName, planName, planName, paidTxt, expTxt, refLine)

	// Log ra console để bạn test
	logger.Log.Info("📧 [EMAIL SENT] To: " + toEmail)
	logger.Log.Info("📧 [SUBJECT] " + subject)
	fmt.Println("-------------------------------------------")
	fmt.Println(body)
	fmt.Println("-------------------------------------------")

	return nil
}
