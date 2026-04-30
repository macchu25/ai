# Cardiac Alert — Mobile App (Expo)

Ứng dụng di động cho hệ thống giám sát tim mạch AI, kết nối trực tiếp với **Go Backend** đã có sẵn.

---

## ⚙️ Cấu hình trước khi chạy

### 1. Cập nhật địa chỉ IP backend

Mở file:
```
mobile-app/src/constants/config.ts
```

Thay `192.168.1.100` bằng địa chỉ IP thực của máy tính đang chạy Go Backend:

```ts
export const API_BASE = 'http://<IP_MAY_CUA_BAN>:8080';
export const WS_BASE  = 'ws://<IP_MAY_CUA_BAN>:8080';
```

> **Tìm IP:** Mở CMD → gõ `ipconfig` → lấy `IPv4 Address` trong mục Wi-Fi.
> Điện thoại và máy tính **phải cùng mạng Wi-Fi**.

### 2. Đảm bảo Go Backend đang chạy

```powershell
cd go-backend
./cardiac-server.exe
# hoặc: go run main.go
```

Backend phải chạy ở: `http://localhost:8080`

---

## 🚀 Khởi chạy Mobile App

```bash
cd mobile-app
npm install   # nếu chưa cài
npm start     # hoặc: npx expo start
```

Sau đó:
- **Android**: Quét QR code bằng app **Expo Go** trên điện thoại
- **Giả lập Android**: Nhấn `a` trong terminal (cần Android Studio)
- **Web**: Nhấn `w` (demo, không đủ tính năng native)

---

## 📱 Tính năng Mobile App

| Tab | Tính năng |
|-----|-----------|
| 🏠 **Tổng Quan** | Dashboard stats, camera status, sự cố gần đây, badge cảnh báo real-time |
| 📹 **Camera** | Danh sách camera, trạng thái online/offline, alert overlay từ WebSocket |
| 📋 **Sự Cố** | Nhật ký toàn bộ sự cố từ MongoDB, filter theo loại |
| ❤️ **Sơ Cứu** | Hướng dẫn CPR đầy đủ, gọi 115/113/114 bằng 1 chạm |
| 👤 **Hồ Sơ** | Thông tin y tế, quản lý danh bạ khẩn cấp, đăng xuất |

---

## 🔌 API Backend đã tích hợp

Kết nối tới các endpoint trong `go-backend/main.go`:

| API | Chức năng |
|-----|-----------|
| `POST /api/v1/auth/social-login` | Đăng nhập, lấy JWT token |
| `GET /api/v1/cameras` | Danh sách camera |
| `GET /api/v1/incidents` | Nhật ký sự cố |
| `GET /api/v1/health-profiles` | Hồ sơ y tế |
| `PUT /api/v1/health-profiles/contacts` | Cập nhật danh bạ |
| `ws://.../ws` | Real-time alerts WebSocket |

---

## 📁 Cấu trúc thư mục

```
mobile-app/
├── App.tsx                          # Entry point
├── app.json                         # Expo config
├── src/
│   ├── constants/
│   │   └── config.ts                # API URL + Color tokens
│   ├── store/
│   │   └── authStore.ts             # Zustand auth state (JWT persist)
│   ├── services/
│   │   └── api.ts                   # API service layer
│   ├── context/
│   │   └── WebSocketContext.tsx     # Real-time WS provider
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Auth guard + nav root
│   │   └── MainTabs.tsx             # Bottom tab navigator (5 tabs)
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.tsx      # Đăng nhập
│       └── main/
│           ├── HomeScreen.tsx       # Dashboard tổng quan
│           ├── CamerasScreen.tsx    # Phòng camera
│           ├── IncidentsScreen.tsx  # Nhật ký sự cố
│           ├── CPRScreen.tsx        # Hướng dẫn sơ cứu
│           └── ProfileScreen.tsx    # Hồ sơ + danh bạ
```
