# Code Review ver5 (2026-05-01)

Mục tiêu: verify các mục trong `CODE_REVIEW_VER4.md` sau khi bạn nói “mọi thứ đã xong”, và ghi lại phần đã đóng + phần còn lại/regression.

## 1) Các mục ver4 đã được đóng

### 1.1 `alert/api.go` đã harden parse `userID`
File: `go-backend/internal/alert/api.go`
- `GetIncidents` và `TestCall` đã:
  - ép kiểu `userID` sang `string` an toàn
  - check lỗi `primitive.ObjectIDFromHex`

### 1.2 `/ai-result` đã “fail-closed” khi thiếu `INTERNAL_API_KEY`
File: `go-backend/internal/alert/api.go`
- Đã đổi logic sang: **nếu thiếu key hoặc sai key** → trả `401`.

### 1.3 Telegram client đã check error + HTTP status (phần lớn)
File: `go-backend/internal/telephony/telegram.go`
- `SendTelegramAlertCustom` đã:
  - check `json.Marshal` error
  - check `httpClient.Post` error
  - check `resp.StatusCode`
- `SendTelegramPhotoCustom` đã:
  - check error `NewRequest`/`Do` + `resp.StatusCode`
- `StartBotListener` đã:
  - check decode error
  - check `result.Ok`

### 1.4 Android gateway đã thêm timeout + log lỗi quan trọng
File: `go-backend/internal/telephony/android.go`
- Đã chuyển sang `exec.CommandContext` với timeout.
- Có log lỗi `adb push` và kích hoạt cuộc gọi.

### 1.5 Logger init đã handle error build
File: `go-backend/internal/logger/logger.go`
- Đã xử lý `config.Build()` error và fallback logger.

## 2) Regression / issue mới phát sinh

### 2.1 `logger.go` đang thiếu import `fmt` (sẽ fail build)
File: `go-backend/internal/logger/logger.go`
- Code dùng `fmt.Printf(...)` nhưng import hiện tại không có `fmt`.

Khuyến nghị:
- thêm `fmt` vào import, hoặc đổi sang `os.Stdout.WriteString`/`zap` fallback mà không cần `fmt`.

### 2.2 Telegram: vẫn chưa check `resp.StatusCode` cho `getUpdates`
File: `go-backend/internal/telephony/telegram.go`
- `StartBotListener` hiện decode body ngay sau `httpClient.Get(url)` nhưng chưa kiểm tra `resp.StatusCode`.
- Nếu Telegram trả `429/5xx`, decode có thể fail hoặc `Ok=false` nhưng thiếu log status cụ thể.

Khuyến nghị:
- check `resp.StatusCode` + log; implement backoff theo `429` (Retry-After).

### 2.3 Telegram Photo: một số lỗi vẫn đang bị bỏ qua
File: `go-backend/internal/telephony/telegram.go`
- `CreateFormFile` đang `_` error.
- `io.Copy` không check error.
- `json.Marshal(buttons)` vẫn `_` error.

Khuyến nghị:
- check các lỗi này để tránh gửi ảnh “im lặng” khi file hỏng/quyền thiếu.

### 2.4 Android gateway: tham số/field chưa dùng
File: `go-backend/internal/telephony/android.go`
- `Gateway.mutex` hiện không dùng.
- `camID` trong `InitiateAndroidCall(userID, camID, ...)` không dùng.

Khuyến nghị:
- bỏ field/param nếu không cần, hoặc dùng `camID` để log/context, hoặc để chọn audio/message theo camera.

## 3) Checklist ver5

- **P0**: Fix compile: thêm `fmt` import trong `logger.go`.
- **P1**: Check `resp.StatusCode` + backoff cho Telegram `getUpdates`.
- **P1**: Check error đầy đủ cho `SendTelegramPhotoCustom`.
- **P2**: Dọn unused (`mutex`, `camID`) trong Android gateway hoặc dùng cho logging/behavior.

