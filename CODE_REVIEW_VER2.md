# Code Review ver2 (2026-05-01)

Mục tiêu: review lại sau khi bạn đã xử lý các issues ở bản review trước. Dưới đây là những điểm **đã fix**, **còn tồn tại**, và **issue mới phát sinh**.

## 1) Những vấn đề đã được xử lý tốt

### 1.1 Rate limiter đã thread-safe
File: `go-backend/main.go`
- Đã thêm `sync.RWMutex` bao quanh `rateLimitMap` và `lastReset` → fix được data race của `map` trong middleware.

### 1.2 Telegram callback parsing đã check lỗi ObjectID/Decode (một phần)
File: `go-backend/internal/alert/engine.go`
- Đã đổi từ bỏ qua lỗi sang:
  - check `primitive.ObjectIDFromHex` cho `call/pause`/nhánh camera
  - check error `Decode(&camera)` khi lookup camera theo `_id`

### 1.3 Memory state storage đã có mutex
File: `go-backend/internal/alert/storage.go`
- `MemoryStorage` đã thêm `sync.RWMutex` cho `Get/Set/Delete` → loại bỏ data race khi không dùng Redis.

### 1.4 Settings page đã lấy `status` từ `useSession()`
File: `web-app/src/app/(dashboard)/settings/page.tsx`
- `const { data: session, status } = useSession();` → fix lỗi `status` undefined trước đó.

## 2) Issue mới phát sinh / regression

### 2.1 Frontend: gọi `setIsLoaded(true)` nhưng không khai báo state
File: `web-app/src/app/(dashboard)/settings/page.tsx`
- Trong `fetchProfile()` đang gọi `setIsLoaded(true);` nhưng không thấy `const [isLoaded, setIsLoaded] = useState(...)` trong file → sẽ gây lỗi build/runtime.

### 2.2 Settings lưu config: contract JSON giữa FE/BE chưa đồng bộ rõ ràng
Files:
- FE gửi `thrLow/thrHigh/audioAlert` khi PUT `/health-profiles`
- BE lưu `thr_low/thr_high/audio_alert` trong Mongo
Hiện FE khi GET `/health-profiles` lại đọc `data.thr_low`, `data.thr_high`, `data.audio_alert` (snake_case) → có vẻ bạn đang trộn 2 style trong cùng API.
- Khuyến nghị: chuẩn hóa response/request (camelCase hoặc snake_case) và map nhất quán trong handler.

## 3) Các vấn đề vẫn còn (chưa thấy fix trong code hiện tại)

## 3.1 CRITICAL/HIGH

### 3.1.1 JWT middleware chưa validate type của claim `userID`
File: `go-backend/internal/auth/jwt.go`
- `c.Set("userID", claims["userID"])` vẫn set trực tiếp giá trị claim (có thể không phải `string`).
- Downstream có nhiều chỗ `userID.(string)` → có thể `panic`.

### 3.1.2 User handler vẫn bỏ qua lỗi `ObjectIDFromHex` và vẫn cast có thể panic
File: `go-backend/internal/user/handler.go`
- `objID, _ := primitive.ObjectIDFromHex(userID.(string))` xuất hiện ở `GetProfile/UpdateContacts/UpdateTelegramID/UpdateProfile`.
- Nếu token claim sai kiểu hoặc userID không phải hex object id → query/update sẽ sai hoặc panic.

### 3.1.3 WebSocket `CheckOrigin` vẫn mở hoàn toàn
File: `go-backend/internal/ws/client.go`
- `CheckOrigin: func(...) { return true }` vẫn giữ nguyên.

### 3.1.4 `/streams` vẫn public + HLS vẫn `RemoveAll` khi startup
Files:
- `go-backend/main.go` expose `r.StaticFS("/streams", ...)` public
- `go-backend/internal/stream/hls.go` vẫn `os.RemoveAll(dir)` trong `NewHLSServer()`

### 3.1.5 Camera AddCamera vẫn bỏ qua lỗi parse userID
File: `go-backend/internal/camera/api.go`
- `objID, _ := primitive.ObjectIDFromHex(userID.(string))` trong `AddCamera`.

## 3.2 Medium

### 3.2.1 Engine còn nhiều chỗ DB Decode bỏ qua lỗi
File: `go-backend/internal/alert/engine.go`
- Các chỗ như `FindOne(...).Decode(&camera)` trong `Process/triggerAlert/getDetailedInfo/broadcastToOwner/CallTestManual` vẫn bỏ qua error → có thể dẫn tới gửi nhầm, state sai, hoặc hành vi “im lặng”.

### 3.2.2 `Manager.updateStatus` vẫn bỏ qua lỗi DB
File: `go-backend/internal/camera/manager.go`
- `UpdateOne(...)` không check error.

## 4) Checklist ưu tiên đề xuất (ver2)

- **P0**: Sửa `SettingsPage` khai báo `isLoaded` hoặc bỏ hẳn `setIsLoaded(true)` nếu không dùng.
- **P0**: Chuẩn hóa contract API health profile:
  - Chọn **camelCase** toàn bộ JSON hoặc **snake_case** toàn bộ; map thống nhất request/response.
- **P1**: Harden auth:
  - JWT middleware validate claim type (`userID` must be string) và reject nếu sai
  - Các handler parse ObjectID phải check error thay vì `_ :=`
- **P1**: Siết WebSocket origin theo allowlist.
- **P1**: Bảo vệ `/streams` theo ownership/JWT hoặc signed URL; xem lại `RemoveAll` khi startup.
- **P2**: Bổ sung error handling/log cho các `Decode/UpdateOne` quan trọng (camera status, trigger alert).

