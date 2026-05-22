# Hướng Dẫn Chi Tiết Triển Khai AI Lên VPS & Quy Trình Khôi Phục Sự Cố

Tài liệu này hướng dẫn chi tiết cách triển khai, cấu hình và khởi chạy các dịch vụ AI trên máy chủ VPS Ubuntu. 

Đồng thời, tài liệu cung cấp **hướng dẫn dành riêng cho AI Agent (như Antigravity hoặc các trợ lý AI khác)** để có thể tự động kết nối và thiết lập lại toàn bộ hệ thống từ đầu trong trường hợp VPS cũ bị hỏng hoặc thay thế bằng VPS mới.

---

## 📋 1. Tổng Quan Hệ Thống AI Trên VPS

Hệ thống AI hiện tại được triển khai trên VPS bao gồm 2 dịch vụ chính chạy ngầm (background services):

1. **AI Brain Service (FastAPI - Cổng `8001`):**
   - Xử lý các nghiệp vụ hỏi đáp RAG (Retrieval-Augmented Generation) thông qua Gemini API.
   - Quản lý cơ sở dữ liệu Vector DB (ChromaDB) để lưu trữ và phân loại các sự cố té ngã/co giật.
   - Endpoint chính: `http://<VPS_IP>:8001/chat` và `http://<VPS_IP>:8001/index`.

2. **CAM Inference Engine (Python - Cổng `5000`):**
   - Chạy mô hình nhận diện hành vi (té ngã, co giật) thời gian thực sử dụng MediaPipe Pose Landmark Detection.
   - Phát luồng video giả lập MJPEG (qua Flask) và gửi cảnh báo trực tiếp về Backend.
   - Endpoint luồng video: `http://<VPS_IP>:5000/video_feed`.

---

## 🖥️ 2. Thông Tin Máy Chủ VPS Hiện Tại

> [!WARNING]
> Nếu bạn thay đổi VPS hoặc nhà cung cấp cài đặt lại hệ điều hành, các thông số IP/Password dưới đây sẽ thay đổi. Hãy nhớ cập nhật lại thông tin này!

- **IP Máy Chủ:** `159.89.23.180`
- **Cổng SSH:** `22`
- **Tài Khoản:** `root`
- **Mật Khẩu:** `Kt10lmBYM89i`
- **Đường Dẫn Dự Án Trên VPS:** `/root/cardiac-alert`

---

## 🤖 3. HƯỚNG DẪN DÀNH CHO AI AGENT (Khôi phục tự động khi VPS chết)

Nếu VPS này gặp sự cố (bị xóa, sập, hỏng dữ liệu), người dùng có thể yêu cầu bạn (AI Agent) kết nối lại và khôi phục hệ thống như sau:

### Bước A: Nhận thông tin VPS mới từ người dùng
Người dùng sẽ cung cấp thông tin IP, cổng SSH, Username và Password của VPS mới.

### Bước B: Cập nhật kịch bản triển khai tự động
Trong mã nguồn dự án, có sẵn các script Python tự động hóa cấu hình và triển khai nằm trong thư mục `scratch/`:
1. Mở file [deploy_vps.py](file:///c:/cardiac-alert/scratch/deploy_vps.py).
2. Sửa các biến cấu hình kết nối ở đầu file để khớp với VPS mới:
   ```python
   VPS_IP = "IP_MOI_CUA_BAN"
   VPS_PORT = 22
   VPS_USER = "root"
   VPS_PASS = "MAT_KHAU_MOI"
   ```

### Bước C: Chạy lệnh triển khai tự động
Chạy kịch bản triển khai tự động bằng lệnh sau trên máy của người dùng (nơi agent đang hoạt động):
```powershell
python scratch/deploy_vps.py
```
**Script này sẽ tự động thực hiện các công việc sau trên VPS mới:**
1. Tạo phân vùng Swap 2GB (RAM ảo) để chống tràn bộ nhớ (Out-Of-Memory).
2. Cài đặt các gói thư viện hệ thống cần thiết (`ffmpeg`, `python3-venv`, `libgl1`, v.v.).
3. Upload toàn bộ mã nguồn AI (`ai-brain/`, `models/`, `inference.py`, `requirements_new.txt`) lên thư mục `/root/cardiac-alert` trên VPS.
4. Thiết lập môi trường ảo Python (`venv`), nâng cấp `pip`, cài đặt `PyTorch CPU` phiên bản tối ưu và các gói Python cần thiết.
5. Giải phóng các tiến trình cũ chiếm cổng `8001` và `5000`.
6. Khởi động chạy ẩn hai dịch vụ **AI Brain** và **CAM Inference** dưới dạng tiến trình ngầm (`nohup`).

### Bước D: Kiểm tra trạng thái tự động
Để kiểm tra xem dịch vụ đã chạy thành công trên VPS mới hay chưa, hãy chạy script:
```powershell
python scratch/check_vps.py
```
*(Hãy nhớ cập nhật thông tin IP/Pass trong file `check_vps.py` trước khi chạy).*

### Bước E: Cập nhật biến môi trường trên Railway (Backend)
Khi IP của VPS thay đổi, Backend (chạy trên Railway hoặc nền tảng khác) cần được cập nhật cấu hình để kết nối tới IP mới:
1. Truy cập trang quản trị Railway của dự án `be-casos`.
2. Tìm biến môi trường có tên: `AI_BRAIN_URL`.
3. Cập nhật giá trị của nó thành địa chỉ mới: `http://<IP_VPS_MOI>:8001`.
4. Railway sẽ tự động redeploy backend để áp dụng IP mới.

---

## 🛠️ 4. Quy Trình Cài Đặt Thủ Công Từng Bước (Dành Cho Con Người)

Nếu bạn muốn tự thiết lập VPS bằng tay thay vì dùng script tự động của AI, hãy thực hiện theo thứ tự sau:

### Bước 1: SSH vào VPS và tạo Swap Space (RAM ảo 2GB)
VPS RAM thấp (1GB - 2GB) rất dễ bị treo khi biên dịch thư viện AI. Cần tạo RAM ảo trước:
```bash
# Tạo file swap 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Cho phép tự kích hoạt swap khi reboot VPS
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Kiểm tra lại RAM & Swap
free -h
```

### Bước 2: Cài đặt các thư viện hệ thống (System Dependencies)
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv libgl1-mesa-glx libglib2.0-0 ffmpeg libgles2 libgles2-mesa libegl1-mesa libegl1
```

### Bước 3: Tải mã nguồn lên VPS
Tạo thư mục `/root/cardiac-alert` trên VPS và upload các thư mục/file sau lên đó (loại trừ `venv/`, `.git/`, `node_modules/` để tránh tải file nặng):
- Thư mục `ai-brain/`
- Thư mục `models/`
- File `inference.py`

### Bước 4: Khởi tạo môi trường ảo Python & Cài thư viện
```bash
cd /root/cardiac-alert

# Tạo venv
python3 -m venv venv
./venv/bin/pip install --upgrade pip

# Cài đặt PyTorch bản CPU (nhẹ hơn bản GPU/CUDA rất nhiều)
./venv/bin/pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Cài đặt các gói Python hỗ trợ AI & APIs
./venv/bin/pip install opencv-python-headless numpy requests mediapipe ultralytics flask flask-cors fastapi uvicorn chromadb google-generativeai pydantic sentence-transformers python-dotenv
```

### Bước 5: Cấu hình khóa API Key của Gemini
Tạo file `.env` chứa API Key của Gemini bên trong thư mục `/root/cardiac-alert/ai-brain/.env`:
```bash
echo 'GEMINI_API_KEY="AIzaSyDlYi7QAkkqhQchEWJ9F7sOcBrripqLLm4"' > /root/cardiac-alert/ai-brain/.env
```

### Bước 6: Khởi chạy các dịch vụ ngầm
```bash
# Giải phóng cổng 8001 và 5000 nếu đang bị chiếm
fuser -k 8001/tcp 5000/tcp || true
sleep 1

# Khởi chạy AI Brain (FastAPI) trên cổng 8001
cd /root/cardiac-alert/ai-brain
nohup ../venv/bin/python service.py > brain.log 2>&1 &

# Khởi chạy CAM AI (Inference) trên cổng 5000
cd /root/cardiac-alert
nohup ./venv/bin/python inference.py --headless --source 0 --camera-id 1 > cam.log 2>&1 &
```

---

## 🔍 5. Kiểm Tra Hoạt Động & Khắc Phục Sự Cố

### Kiểm tra xem dịch vụ có đang hoạt động không:
```bash
# Kiểm tra các tiến trình Python đang chạy
ps aux | grep python

# Kiểm tra các cổng 8001 và 5000 có đang LISTEN không
ss -tuln | grep -E '8001|5000'
```

### Xem nhật ký hoạt động (Logs):
Nếu gặp lỗi kết nối hoặc AI không phản hồi, hãy kiểm tra nhật ký log trực tiếp:
- **Xem log AI Brain (Chatbot RAG):**
  ```bash
  tail -n 50 /root/cardiac-alert/ai-brain/brain.log
  ```
- **Xem log CAM (Phát hiện té ngã & Stream):**
  ```bash
  tail -n 50 /root/cardiac-alert/cam.log
  ```

---

## 🔄 6. Cách Khởi Động Nhanh (Khi VPS bị Reboot đột ngột)

Nếu VPS chỉ bị khởi động lại đột ngột nhưng dữ liệu không mất, bạn không cần cài đặt lại môi trường. Hãy SSH vào VPS và chạy lệnh khởi chạy nhanh sau:

```bash
# Chạy lại AI Brain FastAPI
cd /root/cardiac-alert/ai-brain && fuser -k 8001/tcp || true && nohup ../venv/bin/python service.py > brain.log 2>&1 &

# Chạy lại CAM AI
cd /root/cardiac-alert && fuser -k 5000/tcp || true && nohup ./venv/bin/python inference.py --headless --source 0 --camera-id 1 > cam.log 2>&1 &
```
