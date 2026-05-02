# Code Review ver4 (2026-05-01)

Mục tiêu: review thêm 1 vòng sau ver3, tập trung vào `alert/api`, `telephony`, `ws hub`, `camera manager`, `metrics/logger`.

## 1) Các điểm đã tốt lên (so với ver3)

### 1.1 `Manager` đã xử lý lỗi DB tốt hơn
File: `go-backend/internal/camera/manager.go`
- `StartAll()` đã log lỗi `Find`/`cursor.All`.
- `updateStatus()` đã check error và log cảnh báo.

### 1.2 Metrics type hợp lý hơn cho logic hiện tại
File: `go-backend/internal/metrics/metrics.go`
- `ActiveAlerts` là `Gauge` (phù hợp với Inc/Dec theo state).

## 2) Các vấn đề còn tồn tại (ưu tiên sửa)

## 2.1 CRITICAL/HIGH

### 2.1.1 `alert/api.go` vẫn bỏ qua lỗi parse userID → có thể query sai user
File: `go-backend/internal/alert/api.go`
- `GetIncidents`:
  - `objID, _ := primitive.ObjectIDFromHex(userID.(string))` (bỏ qua lỗi + type assert có thể panic nếu context sai)
- `TestCall`:
  - `objID, _ := primitive.ObjectIDFromHex(userID.(string))` (bỏ qua lỗi)

Khuyến nghị:
- copy pattern “harden” giống `user/handler.go`: check type string + check error `ObjectIDFromHex`.

### 2.1.2 `AIResult` internal key đang “fail-open” nếu env trống
File: `go-backend/internal/alert/api.go`
- Logic hiện tại:
  - nếu `INTERNAL_API_KEY == ""` thì **bỏ qua kiểm tra** và ai cũng có thể POST `/ai-result` để kích hoạt alert.

Khuyến nghị:
- production nên **bắt buộc** `INTERNAL_API_KEY` (tương tự `JWT_SECRET`), hoặc ít nhất có chế độ `REQUIRE_INTERNAL_API_KEY=true`.

### 2.1.3 Telegram I/O đang bỏ qua lỗi + không kiểm tra HTTP status
File: `go-backend/internal/telephony/telegram.go`
- `SendTelegramAlertCustom`: bỏ qua error `json.Marshal`, bỏ qua response/error của `httpClient.Post(...)`.
- `SendTelegramPhotoCustom`: bỏ qua error `CreateFormFile`, `io.Copy`, `NewRequest`, `httpClient.Do(...)`.
- `StartBotListener`:
  - `json.NewDecoder(resp.Body).Decode(&result)` không check error
  - không check `resp.StatusCode` và `result.Ok`
  - `ackURL` gọi `httpClient.Get(...)` bỏ qua error

Tác động:
- lỗi Telegram có thể “im lặng”, làm hệ thống tưởng đã gửi cảnh báo nhưng thực tế không.

Khuyến nghị:
- check error + status code, log có context (update_id/chat_id), và backoff hợp lý theo loại lỗi.

### 2.1.4 Android gateway bỏ qua lỗi ADB → khó vận hành và có thể báo “đã gọi” nhưng thực tế fail
File: `go-backend/internal/telephony/android.go`
- Hầu hết `exec.Command(...).Run()` không check error.

Khuyến nghị:
- check + log lỗi từng bước quan trọng (adb push / call intent / play audio / cleanup).
- cân nhắc timeout bằng `exec.CommandContext` với deadline.

## 2.2 MEDIUM

### 2.2.1 Logger init đang bỏ qua error build
File: `go-backend/internal/logger/logger.go`
- `logger, _ := config.Build()` bỏ qua error.

Khuyến nghị:
- handle error và fallback logger hoặc `panic/log.Fatal` (tùy môi trường).

### 2.2.2 WS hub: vòng lặp broadcast O(n) theo số client
File: `go-backend/internal/ws/hub.go`
- Mỗi message private vẫn duyệt tất cả client để match `UserID`.

Khuyến nghị (nếu scale):
- map `userID -> set[*Client]` để broadcast đúng nhóm, giảm CPU khi nhiều client.

## 3) Checklist ưu tiên (ver4)

- **P0**: Harden `alert/api.go` (parse userID safe + check errors).
- **P0**: Bắt buộc `INTERNAL_API_KEY` trong production (tránh fake incident).
- **P1**: Harden Telegram client (check error/status/Ok; log + backoff).
- **P1**: Harden Android gateway (check ADB errors + timeout).
- **P2**: Handle error trong logger init.
- **P2**: Optimize WS hub nếu cần scale.

