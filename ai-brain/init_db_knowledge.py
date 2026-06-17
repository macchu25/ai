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
        },
        
        # 13. HƯỚNG DẪN THÊM CAMERA MỚI
        {
            "category": "technical",
            "key": "add_new_camera",
            "content": "Để thêm camera mới vào hệ thống Casos:\n"
                       "Bước 1: Trên giao diện Dashboard quản trị, truy cập vào trang quản lý Camera.\n"
                       "Bước 2: Bấm vào nút 'Thêm Camera' (hoặc 'Add Camera') để mở form điền thông tin.\n"
                       "Bước 3: Nhập các thông tin cần thiết bao gồm: Tên camera (ví dụ: Camera Phòng Khách), vị trí lắp đặt (ví dụ: tầng 1), và URL RTSP kết nối tới luồng camera (ví dụ: rtsp://username:password@IP:Port).\n"
                       "Bước 4: Nhấn 'Lưu' hoặc 'Xác nhận'. Hệ thống Go Backend sẽ nhận thông tin, tự động khởi tạo tiến trình FFmpeg để transcode luồng RTSP này sang luồng HLS (.m3u8) phục vụ cho việc stream mượt mà trên giao diện Web và Mobile."
        },
        
        # 14. GIỚI HẠN CAMERA THEO GÓI CƯỚC
        {
            "category": "plans",
            "key": "camera_limits_by_plan",
            "content": "Giới hạn số lượng camera tối đa được phép thêm vào hệ thống Casos tùy thuộc vào gói dịch vụ đăng ký:\n"
                       "- Gói Free (Miễn phí): Cho phép tối đa 1 camera.\n"
                       "- Gói Starter: Cho phép tối đa 3 camera.\n"
                       "- Gói Creator: Cho phép tối đa 10 camera.\n"
                       "- Gói Pro: Cho phép tối đa 25 camera.\n"
                       "- Gói Scale: Cho phép tối đa 1000 camera.\n"
                       "Nếu thêm vượt quá số lượng giới hạn của gói hiện tại, Backend sẽ trả về mã lỗi 403 Forbidden cùng thông báo yêu cầu nâng cấp gói cước để thêm mới."
        },
        
        # 15. TỰ ĐỘNG PHÁT HIỆN CAMERA NỘI BỘ
        {
            "category": "technical",
            "key": "discover_cameras_feature",
            "content": "Hệ thống hỗ trợ tính năng tự động quét và phát hiện camera trong mạng nội bộ (Discover Cameras).\n"
                       "Khi truy cập trang quản lý Camera, người dùng có thể kích hoạt tính năng Discovery. Hệ thống sẽ tự động quét dải IP trong mạng nội bộ để nhận diện các địa chỉ IP của các camera đang hoạt động (ví dụ: Tapo, Ezviz, ONVIF) giúp người dùng thêm nhanh camera vào hệ thống mà không cần dò tìm IP thủ công."
        },
        
        # 16. KẾT NỐI CAMERA IMOU QUA CLOUD
        {
            "category": "technical",
            "key": "imou_cloud_integration",
            "content": "Để thêm camera IMOU qua tài khoản Cloud:\n"
                       "Hệ thống tích hợp trực tiếp với IMOU Open Platform. Người dùng điền thông tin App ID và App Secret của tài khoản nhà phát triển IMOU. AI Brain và Go Backend sẽ tự động kết nối qua API của IMOU (Easy4ip), lấy toàn bộ danh sách thiết bị liên kết, trạng thái online/offline, và tự động cấu hình luồng stream trực tiếp từ Cloud về Dashboard mà không cần cấu hình RTSP/Modem phức tạp."
        },
        
        # 17. KHÔNG PHÂN BIỆT CO GIẬT VÀ NGẤT (ĐÃ TẮT THEO YÊU CẦU)
        {
            "category": "technical",
            "key": "seizure_vs_unconscious",
            "content": "Trạng thái nhận diện co giật (Seizure) và ngất/bất động (Unconscious) trên Casos:\n"
                       "Tính năng nhận diện co giật và ngất đã được tắt hoàn toàn theo yêu cầu của người dùng. AI hiện tại chỉ phát hiện hành động Té ngã (Fall) và kích hoạt trực tiếp chu trình cảnh báo khẩn cấp (Emergency Alert) mà không phân biệt mức độ co giật hay bất tỉnh sau khi ngã nữa."
        },
        
        # 18. CHỐNG BÁO ĐỘNG GIẢ BẰNG YOLO
        {
            "category": "technical",
            "key": "yolo_false_alarm_suppression",
            "content": "Cơ chế chống báo động giả bằng YOLO (YOLO Furniture Collision) trên Casos:\n"
                       "Để tránh báo động giả khi người dùng nằm nghỉ ngơi bình thường, AI tích hợp mô hình YOLOv11-Nano để phát hiện và định vị các đồ nội thất trong phòng như giường, ghế sofa, ghế tựa.\n"
                       "Nếu tọa độ vùng hông của người bệnh trùng lấp lên các vùng nhận diện của giường hoặc ghế sofa, AI sẽ tự động bỏ qua trạng thái ngã và phân loại thành tư thế nghỉ ngơi/ngủ (Resting on furniture) giúp hệ thống không phát chuông cảnh báo sai."
        },
        
        # 19. CỔNG GỌI ĐIỆN CỨU HỘ ADB ANDROID
        {
            "category": "technical",
            "key": "adb_call_gateway",
            "content": "Cơ chế hoạt động của cổng gọi điện cứu hộ qua điện thoại Android (ADB Gateway):\n"
                       "Go Backend kết nối và điều khiển trực tiếp một điện thoại Android cắm qua cổng USB (yêu cầu bật USB Debugging). Khi có sự cố té ngã khẩn cấp vượt quá thời gian cảnh báo tại chỗ (10 giây), hệ thống tự động kích hoạt cuộc gọi từ SIM vật lý bằng lệnh ADB Intent: 'am start -a android.intent.action.CALL -d tel:<phone>'.\n"
                       "Hệ thống giám sát trạng thái cuộc gọi thông qua giám sát 'dumpsys telephony.registry'. Khi người thân nhấc máy (cuộc gọi chuyển sang trạng thái Active), hệ thống sẽ phát âm thanh cảnh báo hoặc TTS trực tiếp từ loa để thông báo tình trạng bệnh nhân."
        },
        
        # 20. CẢNH BÁO RANH GIỚI NGUY HIỂM (GEOFENCING)
        {
            "category": "features",
            "key": "geofencing_hazard_zones",
            "content": "Tính năng thiết lập ranh giới nguy hiểm (Geofencing) trên Casos:\n"
                       "Hệ thống cho phép vẽ các ranh giới cảnh báo (đa giác) trên giao diện quản lý (như khu vực cầu thang, bếp nấu ga, sàn nhà tắm dễ trơn trượt).\n"
                       "AI sử dụng thuật toán Point-in-Polygon (PIP) tính toán khoảng cách từ tọa độ chân của người bệnh (Landmarks 31, 32) tới warning boundary để phát loa cảnh báo tại chỗ kịp thời: 'Cảnh báo: Bạn đang tiến gần khu vực nguy hiểm!'"
        },
        
        # 21. GIÁM SÁT ĐI LANG THANG ĐÊM KHUYA
        {
            "category": "features",
            "key": "nighttime_wandering_monitoring",
            "content": "Tính năng giám sát đi lang thang đêm khuya (Nighttime Wandering) trên Casos:\n"
                       "Sử dụng camera hồng ngoại ban đêm kết hợp mô hình YOLOv11 nhận diện người và bộ đếm thời gian hệ thống.\n"
                       "Trong khung giờ nguy hiểm từ 11:00 PM đến 5:00 AM, nếu phát hiện bệnh nhân tự ý rời phòng ngủ hoặc đi lang thang trong nhà, hệ thống sẽ ngay lập tức gửi cảnh báo im lặng tới ứng dụng di động của người thân để kịp thời hỗ trợ."
        },
        
        # 22. LƯU TRỮ VÀ BẢO VỆ VIDEO BẰNG CHỨNG (EVIDENCE VIDEO ARCHIVING)
        {
            "category": "technical",
            "key": "evidence_video_archiving",
            "content": "Quy trình lưu trữ video bằng chứng (Evidence Video Archiving) trên Casos:\n"
                       "Khi xảy ra sự cố khẩn cấp (té ngã được xác nhận sau 10 giây), hệ thống Go Backend sẽ trích xuất và lưu trữ vĩnh viễn phân đoạn video dài 2 phút bao gồm: 1 phút trước sự cố và 1 phút sau sự cố vào thư mục '/storage/archives/'.\n"
                       "Trong khi các phân đoạn video thông thường (.ts) tự động bị xóa sau 1 giờ để tiết kiệm dung lượng, các video bằng chứng này được bảo vệ hoàn toàn và lưu trữ vĩnh viễn để gia đình và bác sĩ đối chiếu lịch sử chấn thương."
        },
        
        # 23. KẾT NỐI WEBSOCKET CHUYÊN BIỆT O(1)
        {
            "category": "technical",
            "key": "websocket_architecture_o1",
            "content": "Kiến trúc WebSocket Hub thời gian thực trên Casos:\n"
                       "Go Backend sử dụng Gorilla WebSocket để duy trì kết nối hai chiều ổn định với Dashboard và Mobile App.\n"
                       "Để tối ưu hiệu năng phát sóng thông báo, danh sách kết nối được cấu trúc dạng bản đồ lồng nhau 'map[string]map[*Client]bool' nhóm theo UserID. Thiết kế này giúp việc tìm kiếm kết nối của một người dùng cụ thể đạt độ phức tạp thuật toán tối ưu O(1) thay vì duyệt mảng toàn cục, giúp đẩy thông tin viền đỏ màn hình nhấp nháy ngay lập tức khi phát hiện tai nạn."
        },
        
        # 24. BẢO MẬT STREAM VIDEO HLS QUA JWT
        {
            "category": "security",
            "key": "secure_hls_streaming_jwt",
            "content": "Cơ chế bảo mật luồng video HLS trực tiếp trên Casos:\n"
                       "Hệ thống transcode luồng RTSP camera sang định dạng HLS (.m3u8 và các segment .ts) lưu tại đường dẫn '/streams'.\n"
                       "Để ngăn chặn rò rỉ hình ảnh riêng tư của gia đình, Go Backend bắt buộc xác thực JWT Token được truyền qua Query Parameter (ví dụ: '/streams/:id/stream.m3u8?token=...'). Mọi yêu cầu không có token hợp lệ hoặc token hết hạn sẽ bị backend từ chối truy cập ngay lập tức."
        },
        
        # 25. PHÒNG NGỪA LEO THANG ĐẶC QUYỀN HÀNG NGANG (HORIZONTAL PRIVILEGE ESCALATION)
        {
            "category": "security",
            "key": "horizontal_privilege_escalation_defense",
            "content": "Cơ chế chống leo thang đặc quyền hàng ngang (Horizontal Privilege Escalation) trên Casos:\n"
                       "Mỗi khi người dùng thực hiện các thao tác thêm, sửa, xóa hoặc xem luồng camera, Go Backend luôn giải mã JWT token để lấy 'user_id' của người dùng hiện tại và đối chiếu với trường 'user_id' của camera trong MongoDB.\n"
                       "Nếu người dùng cố ý thao tác bằng ID camera thuộc sở hữu của tài khoản khác, hệ thống sẽ trả về lỗi 403 Forbidden (Quyền bị từ chối) nhằm ngăn chặn rò rỉ dữ liệu camera giữa các khách hàng."
        },
        
        # 26. BẢO MẬT API ENDPOINT NỘI BỘ VÀ GIỚI HẠN TẦN SUẤT (RATE LIMITING)
        {
            "category": "security",
            "key": "api_security_and_rate_limiting",
            "content": "Quy chế bảo mật API và giới hạn tần suất yêu cầu trên Casos:\n"
                       "- Bảo mật API nội bộ: Endpoint tiếp nhận kết quả phân tích AI '/api/v1/ai-result' được thiết kế đóng (Fail-Closed). Backend yêu cầu header 'X-API-Key' phải trùng khớp với biến môi trường bí mật 'INTERNAL_API_KEY', ngăn chặn hacker gửi gói tin giả mạo té ngã.\n"
                       "- Giới hạn tần suất: API Gateway tích hợp cơ chế Rate Limiter giới hạn tối đa 60 yêu cầu/phút cho mỗi địa chỉ IP để chống các cuộc tấn công từ chối dịch vụ (DDoS)."
        },
        
        # 27. ẢNH CHỤP BẰNG CHỨNG GỬI TELEGRAM
        {
            "category": "features",
            "key": "telegram_evidence_screenshots",
            "content": "Cơ chế gửi ảnh chụp bằng chứng (Evidence Screenshot) qua Telegram:\n"
                       "Khi mô hình AI xác định trạng thái té ngã đạt 10 giây khẩn cấp, script 'inference.py' lập tức chụp lại khung hình camera (Evidence Frame) tại thời điểm ngã.\n"
                       "Ảnh chụp này được gửi kèm cùng với tin nhắn văn bản chi tiết về hồ sơ bệnh án của bệnh nhân lên nhóm chat Telegram của người nhà qua Telegram Bot API, giúp người nhà nắm bắt trực quan mức độ nghiêm trọng tại hiện trường."
        },
        
        # 28. BIỂU ĐỒ ECG GRID VÀ THEO DÕI VITAL SIGNS
        {
            "category": "features",
            "key": "ecg_grid_and_vital_signs",
            "content": "Giao diện hiển thị chỉ số sinh tồn và biểu đồ ECG Grid trên Casos:\n"
                       "Trên giao diện Web Dashboard, người nhà có thể click vào các ô hiển thị nhịp tim (BPM) hoặc nhịp thở (RPM) của bệnh nhân.\n"
                       "Hệ thống sẽ mở ra một popup biểu đồ ECG Grid chi tiết, vẽ lại đường sóng dao động của 40 điểm đo gần nhất, đồng thời tổng hợp các chỉ số Min (Nhỏ nhất), Max (Lớn nhất) và Average (Trung bình) của nhịp tim/nhịp thở trong phiên đo hiện tại."
        },
        
        # 29. KIẾN TRÚC MÔ HÌNH HỌC SDeep CNN-LSTM
        {
            "category": "technical",
            "key": "cnn_lstm_architecture",
            "content": "Kiến trúc mô hình học sâu CNN-LSTM phân loại hành vi trên Casos:\n"
                       "- Đầu vào: Chuỗi 30 khung hình xương liên tiếp (1 giây), mỗi khung hình gồm 33 điểm mốc MediaPipe (99 tọa độ x, y, z).\n"
                       "- Tầng Conv1D: Tầng quét trích xuất đặc trưng không gian của các nhóm khớp xương (tay, chân, đầu) trong các khoảnh khắc ngắn.\n"
                       "- Tầng LSTM (2 lớp ẩn, hidden size 256): Tầng phân tích biến đổi động học theo thời gian để nhận diện hành vi (ví dụ: phân biệt góc lưng nghiêng nhanh khi ngã so với khi cúi người nhặt đồ).\n"
                       "- Tầng Output: Hàm Softmax xuất xác suất của 4 nhãn tư thế: normal (bình thường), fall (té ngã), ngoi (ngồi), di ngu (nằm ngủ)."
        },
        
        # 30. CHI TIẾT QUY TRÌNH CẢNH BÁO NGỪNG THỞ (APNEA TIMELINE)
        {
            "category": "features",
            "key": "apnea_alert_timeline_details",
            "content": "Các mốc thời gian cảnh báo ngừng thở (Apnea Alert) trên Casos:\n"
                       "Nếu lồng ngực người bệnh đứng yên hoặc nín thở quá 8 giây, chỉ số nhịp thở hạ xuống 0.0 RPM.\n"
                       "- Mốc 3 giây bất thường liên tiếp: Hệ thống bắt đầu kích hoạt cảnh báo tại chỗ (Local Warning) và gửi tin nhắn cảnh báo văn bản qua Telegram.\n"
                       "- Mốc 6 giây bất thường liên tiếp: Kích hoạt cuộc gọi khẩn cấp tự động thông qua ADB Android Gateway/Twilio, đồng thời gửi ảnh chụp bằng chứng hiện trường qua Telegram và nhấp nháy viền đỏ màn hình Dashboard để báo động khẩn cấp."
        }
    ]
    
    col.insert_many(knowledge_data)
    print("SUCCESS: Full Knowledge Restored and Unified.")

if __name__ == "__main__":
    update_system_knowledge()
