import os
import sys
import time
import requests
import pymongo
from dotenv import load_dotenv

# Force UTF-8 output
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# Load .env
load_dotenv(dotenv_path="../go-backend/.env")

mongo_uri = os.getenv("MONGODB_URI")
api_key = os.getenv("INTERNAL_API_KEY", "ai_secret_key_12345")
backend_url = "http://localhost:8080/api/v1/ai-result"

if not mongo_uri:
    print("❌ Không tìm thấy MONGODB_URI trong file .env!")
    sys.exit(1)

# Connect to MongoDB and find camera ID
try:
    client = pymongo.MongoClient(mongo_uri)
    db = client["fall_detection"]
    camera = db["cameras"].find_one()
    if not camera:
        print("❌ Không tìm thấy camera nào trong database. Hãy chắc chắn bạn đã tạo camera trong hệ thống!")
        sys.exit(1)
    camera_id = str(camera["_id"])
    print(f"👉 Sử dụng Camera ID: {camera_id} ('{camera.get('name')}')")
except Exception as e:
    print(f"❌ Lỗi kết nối MongoDB: {e}")
    sys.exit(1)

def run_simulation(heart_rate, respiration_rate, duration_seconds=12):
    print(f"\n=======================================================")
    print(f"🚀 BẮT ĐẦU GIẢ LẬP NHỊP TIM: {heart_rate} BPM | Nhịp thở: {respiration_rate} RPM")
    print(f"⏱️ Thời gian chạy: {duration_seconds} giây (mỗi 2 giây gửi 1 lần)")
    print(f"=======================================================")
    
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    
    steps = duration_seconds // 2
    for step in range(1, steps + 1):
        elapsed = step * 2
        payload = {
            "CameraID": camera_id,
            "ModelName": "Remote Heart Rate Monitor (rPPG)",
            "Label": f"rPPG: {heart_rate:.1f} BPM | Resp: {respiration_rate:.1f} RPM",
            "Confidence": 1.0
        }
        
        try:
            res = requests.post(backend_url, json=payload, headers=headers, timeout=2)
            if res.status_code == 200:
                print(f"[{elapsed}s / {duration_seconds}s] Gửi thành công! Status: {res.json()}")
            else:
                print(f"[{elapsed}s / {duration_seconds}s] Thất bại! Mã lỗi HTTP: {res.status_code}, Phản hồi: {res.text}")
        except Exception as err:
            print(f"[{elapsed}s / {duration_seconds}s] Lỗi khi gọi API (Đảm bảo Go backend đang chạy trên cổng 8080): {err}")
            
        time.sleep(2)
        
    print("✅ Hoàn thành giả lập.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng:")
        print("  py test_heart_rate_alert.py high      - Giả lập nhịp tim rất cao (150 BPM - Cấp cứu)")
        print("  py test_heart_rate_alert.py low       - Giả lập nhịp tim rất thấp (35 BPM - Cấp cứu)")
        print("  py test_heart_rate_alert.py warning   - Giả lập nhịp tim cảnh báo (115 BPM - Nguy kịch)")
        print("  py test_heart_rate_alert.py normal    - Giả lập nhịp tim bình thường (75 BPM)")
        sys.exit(0)
        
    mode = sys.argv[1].lower()
    
    if mode == "high":
        # 150 BPM > 140 BPM (Critical High)
        # Báo động sau 3 giây, gọi điện & ghi incident sau 6 giây
        run_simulation(heart_rate=150.0, respiration_rate=16.0, duration_seconds=12)
    elif mode == "low":
        # 35 BPM < 40 BPM (Critical Low)
        # Báo động sau 3 giây, gọi điện & ghi incident sau 6 giây
        run_simulation(heart_rate=35.0, respiration_rate=16.0, duration_seconds=12)
    elif mode == "warning":
        # 115 BPM (High Danger - nhưng chưa tới mức Critical)
        # Báo động sau 8 giây, gọi điện & ghi incident sau 15 giây
        run_simulation(heart_rate=115.0, respiration_rate=16.0, duration_seconds=20)
    elif mode == "normal":
        # Bình thường -> Khôi phục/Xóa trạng thái bất thường nếu có
        run_simulation(heart_rate=75.0, respiration_rate=16.0, duration_seconds=6)
    else:
        print(f"❌ Không hỗ trợ chế độ '{mode}'. Chọn: high, low, warning, normal.")
