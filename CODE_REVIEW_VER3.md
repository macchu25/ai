# Code Review ver3 (2026-05-01)

Mục tiêu: review lại sau khi bạn đã fix theo `CODE_REVIEW_VER2.md`.

## 1) Các điểm đã fix đúng hướng (đã “đóng” issue ver2)

### 1.1 JWT claim `userID` đã được validate type
File: `go-backend/internal/auth/jwt.go`
- Đã ép kiểu `claims["userID"].(string)` và reject `401` nếu thiếu/sai kiểu → giảm nguy cơ `panic` ở các handler downstream.

### 1.2 User handlers đã harden parse `ObjectIDFromHex`
File: `go-backend/internal/user/handler.go`
- Đã check `userID` là `string`, check error `ObjectIDFromHex` trước khi query/update.

### 1.3 WebSocket đã siết `CheckOrigin` theo allowlist
File: `go-backend/internal/ws/client.go`
- `CheckOrigin` đã so khớp theo danh sách origin cho phép + `FRONTEND_URL`.

### 1.4 HLS không còn xóa toàn bộ thư mục stream khi startup
File: `go-backend/internal/stream/hls.go`
- Đã bỏ `os.RemoveAll(dir)`; chỉ tạo thư mục khi chưa tồn tại → tránh “rụng” live stream khi restart server.

### 1.5 `/streams` đã được bảo vệ bằng JWT middleware
File: `go-backend/main.go`
- Đã đổi từ `StaticFS("/streams", ...)` public sang group có `auth.JWTMiddleware()`.

### 1.6 Settings page regression `isLoaded` đã được fix + chuẩn hóa camelCase
File: `web-app/src/app/(dashboard)/settings/page.tsx`
- Đã khai báo `const [isLoaded, setIsLoaded] = useState(false);`
- FE GET/PUT đang dùng camelCase (`thrLow`, `thrHigh`, `audioAlert`) đồng bộ với backend `UpdateProfile` (camelCase) hiện tại.

## 2) Issue mới / điểm cần lưu ý sau khi fix

### 2.1 `stream.NewHLSServer()` có thể trả `nil` nhưng `main` không check
File: `go-backend/internal/stream/hls.go`, `go-backend/main.go`
- `NewHLSServer()` hiện có nhánh:
  - nếu `MkdirAll(dir)` lỗi → `return nil`
- Nhưng `main.go` đang dùng thẳng:
  - `hlsServer := stream.NewHLSServer()`
  - truyền `hlsServer` vào `alert.NewEngine(...)`, `camera.NewManager(...)`, và `StaticFS(http.Dir(hlsServer.OutputDir))`
→ nếu `hlsServer == nil` sẽ nil-deref.

Khuyến nghị:
- hoặc để `NewHLSServer()` luôn trả `*HLSServer` và `panic/log.Fatal` nếu init fail,
- hoặc `main` phải check `nil` và stop server sớm với log rõ ràng.

### 2.2 `main.go` hiện có dấu hiệu “thừa” handler biến cục bộ
File: `go-backend/main.go`
- `authHandler := auth.NewHandler(db)` vẫn được tạo nhưng route auth lại đăng ký qua `auth.RegisterRoutes(...)`.
- Nếu `authHandler` không dùng ở đâu khác, nên bỏ để tránh dead code/confusion.

## 3) Các vấn đề còn tồn tại (chưa đóng)

### 3.1 Engine vẫn còn nhiều chỗ bỏ qua error `Decode(...)`
File: `go-backend/internal/alert/engine.go`
- Trong `Process/triggerAlert/getDetailedInfo/broadcastToOwner/CallTestManual` vẫn có `FindOne(...).Decode(...)` không check error.
Rủi ro:
- dữ liệu camera/user bị thiếu → gửi nhầm Telegram fallback, gọi nhầm số, hoặc “im lặng” không alert.

### 3.2 User profile response: GET trả thẳng document, có thể “thiếu default”
File: `go-backend/internal/user/handler.go`
- `GetProfile` nếu tìm thấy profile sẽ trả `profile` (bson.M) nguyên trạng.
Nếu profile cũ chưa có các field mới (`thrLow/thrHigh/audioAlert`) thì FE sẽ giữ default (ổn), nhưng UX có thể không rõ là “đang dùng default hay đã lưu”.
Khuyến nghị:
- normalize response: luôn trả đủ keys (kèm default) để FE render nhất quán.

### 3.3 JWT token vẫn hỗ trợ query param cho mọi route dùng middleware
File: `go-backend/internal/auth/jwt.go`
- `tokenString = c.Query("token")` vẫn áp dụng chung cho mọi endpoint protected.
Khuyến nghị:
- chỉ bật query-token ở route thật sự cần (VD `/streams`, `/ws`) hoặc tách middleware riêng cho stream.

## 4) Checklist ưu tiên (ver3)

- **P0**: Fix `NewHLSServer()` không trả `nil` âm thầm, hoặc check `nil` ở `main`.
- **P1**: Harden `engine.go`: check lỗi `Decode`, tránh fallback send-to-wrong-chat, và log error có context.
- **P1**: Giới hạn JWT query-token theo route (tách middleware hoặc conditional theo path).
- **P2**: Normalize response `GetProfile` để luôn trả đủ các field config (kể cả khi document cũ thiếu field).

