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
        },

        # 7. CẤU HÌNH MỞ CỔNG MODEM (PORT FORWARDING)
        {
            "category": "technical",
            "key": "port_forwarding_guide",
            "content": "Để cấu hình mở cổng Modem (Port Forwarding) cho Camera IP:\n"
                       "Bước 1: Cố định IP của Camera trong cài đặt Modem/Camera (ví dụ: 192.168.1.100) để tránh bị đổi IP khi khởi động lại.\n"
                       "Bước 2: Xác định cổng RTSP của Camera (thường là 554).\n"
                       "Bước 3: Truy cập trang quản trị Modem (thường là 192.168.1.1 hoặc 192.168.0.1) -> Chọn mục Port Forwarding / NAT / Virtual Server -> Tạo quy tắc mới trỏ cổng ngoài (ví dụ: 554 hoặc 8554 để bảo mật) về IP tĩnh của Camera và cổng trong 554 qua giao thức TCP.\n"
                       "Bước 4: Tra cứu IP công cộng (Public IP) bằng ip.me hoặc whatismyip.com. \n"
                       "Link RTSP khai báo vào Casos lúc này sẽ có dạng: rtsp://username:password@IP_Cong_Cong:Port/duong_dan. Ví dụ: rtsp://admin:pass@14.226.50.88:8554/cam/realmonitor?channel=1&subtype=0."
        },
        {
            "category": "security",
            "key": "port_forwarding_security",
            "content": "Lưu ý cực kỳ quan trọng khi mở cổng Modem (Port Forwarding):\n"
                       "- Thay đổi mật khẩu mặc định của Camera sang mật khẩu mạnh để tránh bị tấn công khi phơi bày cổng RTSP lên Internet.\n"
                       "- Đối với mạng WAN IP động, địa chỉ IP công cộng sẽ đổi khi modem khởi động lại. Nên sử dụng dịch vụ DDNS (như No-IP, DynDNS, hoặc DDNS tích hợp sẵn của modem) để tạo tên miền cố định thay thế cho IP công cộng (ví dụ: nharieng.ddns.net)."
        },
        
        # 8. CÁCH TÌM IP CAMERA NỘI BỘ
        {
            "category": "technical",
            "key": "find_camera_ip",
            "content": "Cách tìm địa chỉ IP của Camera IP trong mạng nội bộ:\n"
                       "Cách 1 (AP Mode): Nếu camera chưa kết nối mạng và đang phát Wifi riêng (như X-IoT_Cam_123), hãy kết nối điện thoại vào Wifi đó rồi tìm địa chỉ Default Gateway (thường là 192.168.4.1).\n"
                       "Cách 2 (Mạng Wifi nhà): Sử dụng ứng dụng Fing trên điện thoại (đảm bảo điện thoại kết nối cùng mạng Wifi) để quét toàn bộ thiết bị mạng, hoặc đăng nhập trang quản trị Modem để tra danh sách Client."
        },

        # 9. ĐO NHỊP TIM & NHỊP THỞ KHÔNG TIẾP XÚC (rPPG)
        {
            "category": "medical",
            "key": "rppg_vitals_detail",
            "content": "Tính năng đo nhịp tim và nhịp thở không tiếp xúc (rPPG) trên Casos hoạt động như thế nào?\n"
                       "- Đo nhịp tim: AI nhận diện khuôn mặt và phân tích biến thiên màu sắc sắc tố mao mạch dưới da theo dòng máu chảy (tín hiệu BVP) để tính nhịp tim (BPM) chính xác.\n"
                       "- Đo nhịp thở: AI sử dụng mô hình Mediapipe Pose định vị 2 vai để theo dõi chuyển động hô hấp của lồng ngực và tính tần số thở (RPM).\n"
                       "- Giao diện: Người nhà có thể click vào ô nhịp tim/nhịp thở trên Dashboard để xem biểu đồ ECG Grid chi tiết hiển thị 40 điểm đo gần nhất và các chỉ số Min, Max, Average.\n"
                       "- Huấn luyện: Mô hình rPPG được huấn luyện dựa trên các bộ dữ liệu y sinh nổi tiếng toàn cầu gồm COHFACE, PURE và UBFC-RPPG."
        },

        # 10. NHẬN DIỆN BIỂU CẢM ĐAU (PAIN DETECTION)
        {
            "category": "medical",
            "key": "pain_detection_detail",
            "content": "Tính năng nhận diện biểu cảm đau đớn (Pain Detection) hoạt động như thế nào?\n"
                       "- Thuật toán: Sử dụng Mediapipe Face Mesh 3D để theo dõi các điểm cơ mặt: nhíu mày (Brow Furrowing), híp mắt (Eye Squinting) và méo miệng/hé miệng do đau (Mouth Stretching).\n"
                       "- Thang đo: Tính điểm theo thang điểm chuẩn y tế Faces Pain Scale (từ 0.0 đến 6.0) dựa trên tập dữ liệu đau đớn vai lâm sàng UNBC-McMaster Shoulder Pain Archive.\n"
                       "- Ngưỡng báo động: Khi điểm số đau cơ mặt vượt ngưỡng 3.5 / 6.0, khung hình camera sẽ hiển thị viền đỏ cảnh báo khẩn cấp lên Dashboard."
        },

        # 11. CẢNH BÁO NGỪNG THỞ (APNEA ALERT)
        {
            "category": "medical",
            "key": "apnea_alert_detail",
            "content": "Quy trình cảnh báo ngừng thở (Apnea Alert) hoạt động như thế nào?\n"
                       "- Phát hiện: Nếu lồng ngực người bệnh đứng yên hoặc nín thở quá 8 giây, chỉ số nhịp thở hạ xuống 0.0 RPM.\n"
                       "- Các mốc cảnh báo: Sau 3 giây bất thường liên tiếp, hệ thống phát còi báo động tại chỗ (Local Warning) và gửi tin nhắn Telegram. Sau 6 giây bất thường, hệ thống kích hoạt cuộc gọi khẩn cấp tự động, gửi ảnh bằng chứng hiện trường qua Telegram và nhấp nháy màn hình đỏ."
        },

        # 12. FAQ & CÁC LỖI THƯỜNG GẶP
        {
            "category": "faq",
            "key": "faq_offline_latency",
            "content": "Các lỗi thường gặp và cách khắc phục trên hệ thống Casos:\n"
                       "- Lỗi Camera Offline: Hãy kiểm tra nguồn điện camera, khởi động lại modem wifi nhà bạn. Camera sẽ kết nối lại sau 1-2 phút.\n"
                       "- Hình ảnh camera bị trễ (latency/delay): Do truyền tải qua cloud để AI xử lý, độ trễ thường là 2-5 giây. Nếu trễ > 10s hoặc giật lag, hãy cấu hình giảm độ phân giải camera xuống 1080p hoặc 720p trong ứng dụng của camera.\n"
                       "- Không nhận được mã OTP: Kiểm tra hộp thư Spam (Thư rác) hoặc Promotions (Quảng cáo). Có thể gửi lại sau 60 giây.\n"
                       "- Chó mèo kích hoạt báo động giả: AI sử dụng công nghệ theo dõi khung xương người (Skeleton Tracking) nên sẽ bỏ qua vật nuôi để tránh báo động sai."
        }
    ]
    
    col.insert_many(knowledge_data)
    print("SUCCESS: Full Knowledge Restored and Unified.")

if __name__ == "__main__":
    update_system_knowledge()
