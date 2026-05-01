# 🏃‍♂️ Cardiac Alert System (CAS)

Hệ thống giám sát và nhận diện té ngã thông minh sử dụng trí tuệ nhân tạo (AI), hỗ trợ đa nền tảng (Web, Mobile) và cảnh báo thời gian thực qua cuộc gọi tự động.

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### 🔹 Backend & Core
- **Golang (Gin Gonic)**: Framework chính cho máy chủ API, xử lý hiệu năng cao và concurrency thông qua Goroutines.
- **MongoDB**: Cơ sở dữ liệu NoSQL dùng để lưu trữ thông tin người dùng, cấu hình camera và nhật ký sự cố.
- **WebSocket (Gorilla)**: Giao tiếp thời gian thực để đẩy thông báo từ AI Hub tới các Dashboard ngay lập tức.
- **FFmpeg**: Công cụ nòng cốt để transcode luồng RTSP từ Camera thành HLS Stream cho trình duyệt và thiết bị di động.
- **ADB (Android Debug Bridge)**: Gateway điều khiển điện thoại Android thực hiện cuộc gọi khẩn cấp qua SIM vật lý.

### 🔹 Frontend & Mobile
- **Next.js 14 (TypeScript)**: Dashboard quản trị với Server-side Rendering và kiến trúc App Router hiện đại.
- **React Native (Expo)**: Ứng dụng di động dành cho người thân, tích hợp Notification và quản lý hồ sơ y tế.
- **Tailwind CSS & Vanilla CSS**: Thiết kế giao diện cao cấp, Responsive và tối ưu trải nghiệm người dùng (UX).

### 🔹 AI Hub
- **Python (PyTorch)**: Framework huấn luyện và chạy mô hình học sâu (Deep Learning).
- **MediaPipe**: Thư viện Google giúp trích xuất khung xương (Pose Landmarks) từ Video với tốc độ cao.
- **CNN + LSTM**: Kiến trúc mô hình kết hợp nhận diện không gian và thời gian để phân biệt "ngã" với "ngồi xuống" hoặc "nằm xuống".

---

## 🛡️ Kiến trúc Bảo mật (Security Architecture)

Hệ thống được thiết kế với nhiều lớp bảo mật để bảo vệ dữ liệu y tế nhạy cảm và ngăn chặn báo động giả:

### 1. Xác thực & Phân quyền (Auth & RBAC)
- **JWT (JSON Web Tokens)**: Mọi yêu cầu từ Web và Mobile đều phải có Token hợp lệ. Chìa khóa ký (`JWT_SECRET`) được lưu trữ an toàn trong biến môi trường, không nằm trong mã nguồn.
- **Middleware Protection**: Các route nhạy cảm (Xóa camera, Sửa hồ sơ) đều được bảo vệ bởi lớp Middleware kiểm tra Token.

### 2. Chống chiếm quyền điều khiển (Resource Ownership)
- **Ownership Verification**: Hệ thống kiểm tra quyền sở hữu đối với từng ID Camera. Người dùng không thể xem, sửa hoặc xóa camera của người khác ngay cả khi biết ID của họ (Chống Horizontal Privilege Escalation).

### 3. Bảo mật luồng AI & Video (Video Privacy)
- **Secure HLS Streaming**: Mọi luồng video (`.m3u8`, `.ts`) từ Go Backend đều được bảo vệ bằng JWT. Hệ thống hỗ trợ xác thực qua Header hoặc Query Parameter (`?token=`), đảm bảo chỉ người sở hữu camera mới có thể xem luồng trực tiếp.
- **X-API-Key**: Mọi dữ liệu đẩy từ script AI về Server đều phải đính kèm một `INTERNAL_API_KEY` bí mật. Điều này ngăn chặn việc kẻ xấu giả mạo sự cố để kích hoạt hệ thống báo động.
- **WebSocket Privacy**: Kênh thông báo thời gian thực (`/ws`) được bảo vệ bằng JWT. Hệ thống chỉ đẩy thông báo (Alert) tới các Client có cùng UserID với chủ sở hữu Camera, đảm bảo người dùng khác không thể nghe lén sự cố của bạn.
- **Redis State Storage**: Trạng thái của từng Camera (đang theo dõi, đã phát cảnh báo chưa, thời gian bắt đầu sự cố) được lưu trữ vào Redis thay vì bộ nhớ RAM. Điều này đảm bảo khi Server khởi động lại, quá trình đếm ngược và xử lý sự cố không bị gián đoạn.
- **Structured Logging (Zap)**: Hệ thống sử dụng Zap Logger để ghi lại mọi sự kiện theo định dạng cấu trúc, giúp việc truy vết sự cố y tế trở nên chính xác và nhanh chóng.
- **Prometheus Metrics**: Cung cấp endpoint `/metrics` để theo dõi sức khỏe hệ thống (số vụ ngã, số cuộc gọi thành công, FPS trung bình) thời gian thực.
- **Evidence Archiving**: Khi có sự cố té ngã, hệ thống tự động trích xuất 2 phút video liên quan (trước và sau sự cố) vào kho lưu trữ vĩnh viễn (`storage/archives/`), đảm bảo bằng chứng không bị mất.
- **Auto-Cleanup Worker**: Robot chạy ngầm tự động dọn dẹp các file video Live cũ sau 1 giờ để bảo vệ ổ cứng, nhưng tuyệt đối không chạm vào kho bằng chứng sự cố.
- **Telegram Bot Integration**: Hệ thống gửi tin nhắn báo động tức thời tới nhóm Telegram gia đình ngay khi phát hiện nghi vấn hoặc sự cố khẩn cấp.

### 4. Quản lý cấu hình (Configuration Security)
- **Environment Variables (.env)**: Toàn bộ thông tin nhạy cảm như MONGODB_URI, API Keys (ElevenLabs, Stringee), và đường dẫn ADB được tách biệt hoàn toàn khỏi mã nguồn.

---

## 🚀 Hướng dẫn khởi động (6 Bước)

### 1. Chuẩn bị Cơ sở dữ liệu
- **MongoDB**: Khởi động MongoDB (Local hoặc Atlas).
- **Redis**: Khởi động Redis Server (`localhost:6379`).

### 1.5. Cách nhanh nhất: Sử dụng Docker (Khuyên dùng)
Nếu bạn đã cài Docker, bạn có thể khởi động toàn bộ hạ tầng (MongoDB, Redis, Backend, Web App) chỉ bằng một câu lệnh duy nhất:
```powershell
docker-compose up --build
```
*Lưu ý: Bạn vẫn cần chạy script `inference.py` (AI Hub) thủ công ở máy ngoài để có thể truy cập Webcam/GPU.*

### 2. Cấu hình Biến môi trường
Tạo/Cập nhật file `.env` tại thư mục `go-backend/`:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
INTERNAL_API_KEY=ai_secret_key_12345
REDIS_URL=localhost:6379
ADB_PATH=C:\path\to\adb.exe
# Ngưỡng thời gian báo động
LOCAL_WARNING_SECONDS=7
EMERGENCY_ALERT_MINUTES=8
```

### 3. Chạy Backend (Go)
```powershell
cd go-backend
go run main.go
```

### 4. Chạy AI Hub (Python)
```powershell
# Webcam
python inference.py --source 0
# Hoặc RTSP
python inference.py --source "rtsp://..."
```

### 5. Chạy Dashboard (Web)
```powershell
cd web-app
npm run dev
```
Truy cập: `http://localhost:3000`

### 6. Chạy Mobile App (Expo)
```powershell
cd mobile-app
npx expo start
```

---

**📊 Giám sát hệ thống:**
- **Logs**: Xem tại console của Go Backend (Zap Structured Logs).
- **Metrics**: Truy cập `http://localhost:8080/metrics` để xem thông số Prometheus.
- **API Docs**: Truy cập `http://localhost:8080/swagger/index.html`.

---

## 📂 Cấu trúc thư mục (Refactored)
```text
c:\cardiac-alert\
├── go-backend/         # Máy chủ Go (Gin Gonic, MongoDB)
│   ├── internal/       # Business Logic (Module: alert, auth, camera, user)
│   └── main.go         # Entry point (Modularized)
├── web-app/            # Next.js 14 Dashboard
├── mobile-app/         # Expo React Native App
├── inference.py        # AI Prediction Script (Secured)
└── models/             # AI Model weights & Definition
```

 rm server.exe
 go build -o server.exe
.\server.exe