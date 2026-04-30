# 🏃‍♂️ AI Fall Detection System

Dự án Hệ thống Nhận diện Ngã (Fall Detection) dựa trên AI (CNN + LSTM). Dự án phân chia thành 2 môi trường hoạt động nhằm phục vụ cho cả việc thử nghiệm và tích hợp thực tế.

---

## 🚀 Cách 1: Chạy mô phỏng trực tiếp (Webcam)

Sử dụng trực tiếp Webcam của máy tính để nhận diện chuyển động thực tế. Màn hình sẽ bật lên một giao diện Video, tự động vẽ khung xương (Pose Landmarks) và hiện Tracking trạng thái ngay trên khung hình.

- **Chức năng chính**: Thử nghiệm thuật toán nhanh chóng, điều chỉnh thông số trực tiếp bằng mắt nhìn.
- **Cách chạy**:
  > Mở Terminal (Powershell) tại thư mục gốc và chạy:
  > ```powershell`
  > python inference.py
  > ```
  > *(Nhấn phím `q` trên cửa sổ video để tắt)*

---

## 🌐 Cách 2: Chạy dưới dạng Server (API Backend)

Chức năng này biến hệ thống AI của bạn thành một "bộ não" chạy ngầm. Cơ chế như sau:
1. Thiết bị người dùng (Mobile App / IoT Camera) sẽ tự bật Camera, gom các điểm ảnh khung xương và nén thành một mảng số.
2. Ứng dụng người dùng đẩy cục số này qua mạng Wifi/Internet về cho máy chủ.
3. API Server chạy qua AI Model và trả về kết quả `fall / normal / seizure` mà **không hề mở giao diện Camera nào**.

- **Chức năng chính**: Là kiến trúc chuẩn để ghép nối hệ thống AI này với App trên điện thoại hoặc Website.
- **Cách khởi động Server**:
  > ```powershell
  > uvicorn ai-service.main:app --reload
  > ```
  > Server sẽ online tại cổng `http://127.0.0.1:8000`. Bạn có thể vào `/docs` để kiểm tra tài liệu Swagger UI.
- **Cách Test thử API**:
  > Mở một Terminal khác và chạy kịch bản thử nghiệm tải trọng (gửi tự động một request lên):
  > ```powershell
  > python tests/test_api.py
  > ```

---

## 📂 Cấu trúc dự án chuẩn (Clean Code)
```text
C:\Users\dayla\ai\
├── models/             # Root của AI: Chứa weights (best_model.pth), model config và Label definitions.
├── ai-service/         # Root của API: Chứa mã nguồn Fast API Server dùng để giao tiếp mạng.
├── tests/              # Chứa các unit tests & scripts dùng để thử nghiệm hệ thống.
└── inference.py        # Ứng dụng chạy độc lập tích hợp AI với OpenCV cho Cách 1.
```

---

## 📝 Nhật ký Phát triển & Thử nghiệm (Log)

Dưới đây là các bước đã thực hiện để tối ưu hóa hệ thống từ phiên bản gốc:

### 1. Nâng cấp Model & Phân loại tư thế
- **Thực hiện**: Tích hợp Model 4 lớp nhãn (`0: normal`, `1: fall`, `2: unconscious`, `3: seizure`).
- **Nâng cấp**: Sử dụng Vector hình học (góc thân mình và đùi) để phân biệt chi tiết trạng thái **Ngồi (ngoi)** và **Đi ngủ (di ngu)** khi AI báo kết quả "Normal".
- **Kết quả**: Hệ thống nhận diện chính xác tư thế nằm nghỉ và ngồi, không còn bị nhầm lẫn là "Normal" chung chung.

### 2. Thuật toán "Instant Fall" (Ngã đột ngột)
- **Thực hiện**: Theo dõi vận tốc góc của thân mình trong vòng 1 giây qua `angle_history`.
- **Kết quả**: Nếu góc lưng thay đổi cực nhanh từ Đứng (< 25 độ) sang Nằm (> 60 độ), hệ thống sẽ kích hoạt báo động ngay lập tức (chỉ sau 3 khung hình) mà không cần đợi xác nhận lâu theo cách cũ.

### 3. Lọc nhiễu & Chống báo giả (Alert Filtering)
- **Thực hiện**: Cấu hình để hệ thống **chỉ gửi cảnh báo về Dashboard** đối với các nhãn nguy hiểm thực sự (`fall`, `unconscious`, `seizure`). Các trạng thái sinh hoạt (`ngoi`, `di ngu`) chỉ hiển thị trên màn hình camera mà không gây báo động giả.
- **Thử nghiệm**: Khi người dùng ngồi xuống từ từ, hệ thống nhận diện đúng là `di ngu (tu tu)` và không nổ chuông báo động.

### 4. Hồi phục bền vững (Persistent Recovery)
- **Vấn đề**: Khi người ngã cựa quậy vì đau, bộ đếm giây hay bị reset về 0 khiến cảnh báo không ổn định.
- **Giải pháp**: Áp dụng cơ chế xác nhận hồi phục **6 giây** (`RECOVERY_THRESHOLD = 180`).
- **Kết quả**: Hệ thống chỉ reset cảnh báo khi người dùng thực sự đứng hoặc ngồi dậy và **duy trì** tư thế đó liên tục trong hơn 6 giây. Nếu chỉ lăn lộn trên sàn, nhãn té ngã vẫn giữ nguyên và bộ đếm vẫn tiếp tục chạy.

### 5. Các lỗi kỹ thuật đã xử lý
- **Lỗi Shape Mismatch**: Sửa lỗi kích thước layer cuối (fc.3) của model khi nạp trọng số 4 nhãn vào code cũ mang cấu trúc 2 nhãn.
- **Lỗi Unicode**: Chuyển đổi các thông báo Console sang tiếng Việt không dấu để tránh lỗi crash chương trình trên máy Windows.
- **Lỗi Syntax**: Sửa lỗi định nghĩa hàm trong class `FallDetector` bị sai thụt lề trong quá trình cập nhật.
https://xxxx.ngrok-free.app/webhook/be736ba9-f7f4-4f77-98b3-c3766b2df78a

"C:\Users\NHU HUU\ngrok\ngrok.exe" http 5678

set WEBHOOK_URL=https://9ce6-115-76-55-57.ngrok-free.app 
npx n8n
.\server.exe
go run main.go

rm server.exe
go build -o server.exe .; .\server.exe
