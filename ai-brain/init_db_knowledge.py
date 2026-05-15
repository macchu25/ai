import pymongo

MONGO_URI = "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
DB_NAME = "fall_detection"

def update_system_knowledge():
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    col = db["system_knowledge"]
    
    col.delete_many({})
    
    knowledge_data = [
        # 1. HƯỚNG DẪN LẤY RTSP & CAMERA (Khôi phục chi tiết)
        {
            "category": "technical",
            "key": "get_rtsp_guide",
            "content": "Để lấy link RTSP của camera: Ezviz/Hikvision thường có dạng 'rtsp://admin:Mã_Xác_Thực@IP:554/H.264'. Dahua/Imou là 'rtsp://admin:Pass@IP:554/cam/realmonitor?channel=1&subtype=0'. Với X-IoT, bạn bật ONVIF trong ứng dụng điện thoại để lấy luồng."
        },
        {
            "category": "hardware",
            "key": "camera_advice",
            "content": "Casos tương thích tốt nhất với Tapo C210, Ezviz C6N và Imou Ranger 2. Dòng Xiaomi C300 có hình ảnh đẹp nhưng cần lưu ý về việc hỗ trợ RTSP."
        },
        
        # 2. HƯỚNG DẪN SƠ CỨU CPR (Khôi phục chi tiết)
        {
            "category": "medical",
            "key": "cpr_manual",
            "content": "Quy trình sơ cứu CPR khẩn cấp: Bước 1 - Kiểm tra phản ứng. Bước 2 - Khai thông đường thở. Bước 3 - Ép tim tốc độ 100-120 lần/phút, độ sâu 5cm tại giữa ngực. Bước 4 - Hô hấp nhân tạo nếu biết cách."
        },
        
        # 3. CHI TIẾT CÁC GÓI CƯỚC (Khôi phục đầy đủ 5 gói)
        {
            "category": "plans",
            "key": "all_plans_detail",
            "content": "Hệ thống Casos có 5 gói cước: \n- Free: 1 camera, báo qua Web.\n- Starter: 2 camera, báo Web/Telegram, lưu lịch sử 7 ngày.\n- Creator: 5 camera, tùy chỉnh âm thanh cảnh báo, xem báo cáo tuần.\n- Pro: 10 camera, ưu tiên băng thông, gọi điện AI Voice Call không giới hạn.\n- Scale: Không giới hạn camera, hỗ trợ kỹ thuật 24/7, lưu trữ đám mây 30 ngày."
        },
        
        # 4. QUY TRÌNH HỦY GÓI & OTP (Bảo mật & chi tiết)
        {
            "category": "subscription",
            "key": "cancel_guide",
            "content": "Quy trình hủy gói bảo mật 2 lớp: Bước 1 - Nhấn 'Hủy gói'. Bước 2 - Nhận mã OTP 6 số qua Email. Bước 3 - Nhập mã vào Dashboard để xác nhận. Gói sẽ chuyển sang trạng thái 'Đã hủy' và tài khoản quay về gói Free."
        },
        
        # 5. KẾT NỐI TELEGRAM & LỆNH ĐIỀU KHIỂN
        {
            "category": "manual",
            "key": "telegram_full",
            "content": "Kết nối Telegram: Chat với bot '@casos_alert_bot', dùng lệnh '/myid' để lấy ID. Bạn có thể dùng lệnh '/pause' để dừng báo động hoặc '/call' để yêu cầu AI gọi cứu hộ ngay lập tức."
        },
        
        # 6. QUY TRÌNH CẢNH BÁO AI
        {
            "category": "features",
            "key": "alert_logic",
            "content": "Khi phát hiện té ngã, hệ thống đếm ngược 7 giây cảnh báo tại chỗ (Local Warning). Nếu không có phản hồi, AI sẽ gửi thông báo Telegram và thực hiện cuộc gọi khẩn cấp (Emergency Alert) sau 10 giây tiếp theo."
        }
    ]
    
    col.insert_many(knowledge_data)
    print("SUCCESS: Full Knowledge Restored and Unified.")

if __name__ == "__main__":
    update_system_knowledge()
