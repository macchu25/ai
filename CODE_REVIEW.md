# Code Review (2026-05-01)

Scope: các file đang thay đổi theo `git status`

- `go-backend/internal/alert/engine.go`
- `go-backend/internal/auth/jwt.go`
- `go-backend/main.go`
- `web-app/src/app/(dashboard)/settings/page.tsx`

## 1) Critical (nên sửa ngay)

### 1.1 Frontend: crash do `status` undefined
Trong `SettingsPage`, code dùng biến `status` nhưng `useSession()` chỉ destructure `data`.

File: `web-app/src/app/(dashboard)/settings/page.tsx`
- `useEffect` đang check `status === "authenticated"` nhưng `status` chưa khai báo → runtime error / build error.

### 1.2 Backend: rate limiter có data race
Rate limiter tự viết trong Gin dùng `map` + biến thời gian dùng chung cho mọi request, không có mutex/atomic → dễ race/crash và limiter sai khi có concurrent traffic.

File: `go-backend/main.go`
- `rateLimitMap := make(map[string]int)` được đọc/ghi trong middleware cho mọi request.

## 2) High (bảo mật/độ tin cậy)

### 2.1 Engine: bỏ qua error ở ObjectID/Decode gây fail-open
File: `go-backend/internal/alert/engine.go`
- `primitive.ObjectIDFromHex(data)` đang bỏ qua lỗi (`_ =`) ở nhiều nhánh (`call`, `pause`, `guide`).
- `FindOne(...).Decode(...)` không check error, dẫn tới:
  - `camera.UserID` có thể zero-value.
  - `getUserChatID` sẽ fallback sang `TELEGRAM_CHAT_ID` env → rủi ro gửi nhầm cảnh báo cho chat mặc định.
  - logic phân quyền điều khiển bot Telegram có thể bị “fail-open” theo dữ liệu vào không hợp lệ.

### 2.2 JWT qua query param dễ bị leak
File: `go-backend/internal/auth/jwt.go`
- Middleware cho phép lấy token từ query `?token=` để phục vụ stream/video.
- Rủi ro: token lọt vào log, proxy cache, referrer, analytics.
- Khuyến nghị: chỉ cho phép query-token ở route thật sự cần (stream/ws), hoặc dùng token riêng short-lived cho stream.

### 2.3 JWT claims chưa validate kiểu dữ liệu
File: `go-backend/internal/auth/jwt.go`
- `c.Set("userID", claims["userID"])` không ép/validate type.
- Khuyến nghị: assert `string`, nếu không thì reject `401`.

## 3) Medium (logic/UX/perf/cleanliness)

### 3.1 Alert/metrics có thể lệch ở edge-case
File: `go-backend/internal/alert/engine.go`
- `ActiveAlerts.Inc()` khi bắt đầu “suspect” và `Dec()` khi clear.
- Nếu state storage reset/mất state hoặc gọi clear nhiều lần, gauge có thể lệch (tùy `metrics.ActiveAlerts` là Gauge/Counter).
- Khuyến nghị: đảm bảo idempotent/guard khi Dec, hoặc tính toán lại từ state thay vì incremental.

### 3.2 Thời gian threshold hardcode
File: `go-backend/internal/alert/engine.go`
- 7s để confirm, 5 phút để repeat alert đang hardcode.
- Khuyến nghị: đưa ra config/env (dễ tune theo thực tế).

### 3.3 “Bằng chứng” hardcode và route static công khai
Files:
- `go-backend/internal/alert/engine.go` dùng `"audio/mockup.png"` cho photo/upload.
- `go-backend/main.go` expose `r.Static("/audio", "./audio")`.
Rủi ro: lộ file nội bộ/nhầm evidence nếu nhiều incident.

### 3.4 Settings page có nhiều state/import không dùng + nút Save chưa lưu
File: `web-app/src/app/(dashboard)/settings/page.tsx`
- Nhiều icon import/state không dùng (`sensitivity`, `isLoaded`, ...).
- Nút “LƯU CẤU HÌNH” chưa gọi API để lưu `thrLow`, `thrHigh`, `audioAlert`.

## 4) Đề xuất thứ tự xử lý (ưu tiên)

- **P0**: Fix `SettingsPage` (khai báo `status` từ `useSession()`) + dọn unused để tránh lỗi build/lint.
- **P0**: Thay rate limiter bằng giải pháp thread-safe (mutex + fixed window) hoặc middleware limiter chuẩn.
- **P1**: Siết error handling cho `ObjectIDFromHex` + `Decode` trong `engine.go` để tránh fail-open/sent-to-wrong-chat.
- **P1**: Giới hạn JWT query-token theo route + validate claim type.
- **P2**: Hoàn thiện API lưu cấu hình thresholds/audioAlert và update UI state theo dữ liệu backend.

---

## 5) Review vòng 2 (mở rộng theo module liên quan)

### 5.1 WebSocket: `CheckOrigin` đang mở hoàn toàn
File: `go-backend/internal/ws/client.go`
- `websocket.Upgrader.CheckOrigin` trả `true` cho mọi origin. JWT có bảo vệ route `/ws`, nhưng origin mở vẫn tăng bề mặt tấn công (CSWSH/phishing nếu token bị lộ).
- Khuyến nghị: check origin theo allowlist giống CORS config hoặc dựa trên `NEXT_PUBLIC_*` domain cấu hình.

### 5.2 State storage (memory fallback) không thread-safe
File: `go-backend/internal/alert/storage.go`
- `MemoryStorage.states` là map không có mutex; `Engine.Process` chạy goroutine đọc/ghi state song song → data race nếu không dùng Redis.
- Khuyến nghị: thêm mutex cho `MemoryStorage` hoặc luôn ép dùng Redis trong môi trường có concurrent.

### 5.3 Health profile handlers: parse ObjectID/typing có thể panic + bỏ qua lỗi
File: `go-backend/internal/user/handler.go`
- Nhiều chỗ `objID, _ := primitive.ObjectIDFromHex(userID.(string))`:
  - Nếu `userID` trong context không phải string → `panic`.
  - Nếu string không phải hex ObjectID → `objID` thành zero-value và query/update sẽ sai.
- `UpdateTelegramID` không validate định dạng (nên chỉ nhận số, trim space, giới hạn length).
- Khuyến nghị: validate `userID` type + check error `ObjectIDFromHex` và trả `401/400` rõ ràng.

### 5.4 Incidents API: bỏ qua lỗi parse userID
File: `go-backend/internal/alert/api.go`
- `objID, _ := primitive.ObjectIDFromHex(userID.(string))` trong `GetIncidents`.
- `TestCall` cũng bỏ qua lỗi parse userID.
- Khuyến nghị: xử lý error và reject request thay vì tiếp tục với ObjectID rỗng.

### 5.5 Telephony bot listener: thiếu kiểm tra lỗi decode/HTTP status
File: `go-backend/internal/telephony/telegram.go`
- `json.NewDecoder(resp.Body).Decode(&result)` không check error.
- Không check `result.Ok`, không check HTTP status, không backoff theo loại lỗi.
- Khuyến nghị: kiểm tra lỗi decode + status code; nếu Telegram trả lỗi thì log và sleep/backoff.

---

## 6) Review vòng 3 (bám theo rủi ro vận hành/bảo mật)

### 6.1 HLS server: xóa sạch stream khi startup + `/streams` public
File: `go-backend/internal/stream/hls.go`, `go-backend/main.go`
- `NewHLSServer()` gọi `os.RemoveAll(dir)` với `./tmp/streams` mỗi lần server start → đang xem live có thể bị “rụng” khi restart.
- Route `/streams` đang public (`r.StaticFS("/streams", ...)`), không có auth theo user/camera.
- Khuyến nghị:
  - Không xóa toàn bộ ở startup (hoặc chỉ xóa theo pattern/retention).
  - Bảo vệ truy cập stream theo ownership (JWT) hoặc ký URL theo camera.

### 6.2 Gateway gọi Android/ADB: không check error của command
File: `go-backend/internal/telephony/android.go`
- Nhiều `exec.Command(...).Run()` bỏ qua error → khó debug khi ADB không kết nối/permission.
- Khuyến nghị: check error, log đầy đủ; cân nhắc timeout/context cho command.

### 6.3 Camera API: có chỗ bỏ qua lỗi userID parse
File: `go-backend/internal/camera/api.go`
- `AddCamera` dùng `objID, _ := primitive.ObjectIDFromHex(userID.(string))` → nên handle error như `GetCameras/DeleteCamera`.

### 6.4 Manager.updateStatus bỏ qua error DB
File: `go-backend/internal/camera/manager.go`
- `UpdateOne` không check error; nếu DB down thì status không cập nhật nhưng hệ thống vẫn log “online/offline” giả.
- Khuyến nghị: handle error (ít nhất log) để vận hành dễ quan sát.


