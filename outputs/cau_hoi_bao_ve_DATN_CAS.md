# Bộ câu hỏi dự kiến hội đồng bảo vệ đồ án - Cardiac Alert System (CAS)

Nguồn phân tích: toàn bộ cấu trúc code trong `C:\cardiac-alert` và báo cáo `BaoCao_DATN_MacNhuHuu (1).docx`.

## 1. Câu hỏi tổng quan đề tài

1. Vì sao chọn đề tài phát hiện té ngã, ngưng tim và hỗ trợ sơ cứu bằng AI?
   - Gợi ý trả lời: nhu cầu giám sát người cao tuổi/bệnh nhân nguy cơ cao, giảm thời gian phát hiện sự cố, kết hợp computer vision, cảnh báo thời gian thực và trợ lý sơ cứu.

2. Điểm khác biệt của CAS so với camera giám sát thông thường là gì?
   - Camera thường chỉ ghi hình; CAS phân tích tư thế, sinh hiệu, phát cảnh báo, lưu bằng chứng, gửi Telegram/cuộc gọi và hỗ trợ sơ cứu.

3. Hệ thống giải quyết những bài toán chính nào?
   - Phát hiện té ngã/tư thế bất thường, theo dõi nhịp tim/nhịp thở không tiếp xúc, phát hiện đau qua khuôn mặt, cảnh báo đa kênh, lưu sự kiện, hỏi đáp RAG.

4. Đối tượng sử dụng chính là ai?
   - Gia đình có người già sống một mình, bệnh nhân tim mạch/vận động, viện dưỡng lão, phòng khám, người chăm sóc.

5. Vì sao tên hệ thống là Cardiac Alert nhưng lại có phát hiện té ngã?
   - Đây là nền tảng cảnh báo khẩn cấp sức khỏe, trong đó té ngã là sự kiện nguy cơ cao thường liên quan chấn thương/ngưng tim; tên nhấn mạnh cảnh báo y tế khẩn cấp.

6. Đâu là phạm vi MVP hiện tại và đâu là định hướng tương lai?
   - MVP: dashboard, camera, HLS, AI result pipeline, cảnh báo, incident, RAG cơ bản, mobile cơ bản. Tương lai: multi-camera fusion, wearable, HIPAA, dự báo sức khỏe dài hạn.

7. Đóng góp kỹ thuật chính của đồ án là gì?
   - Tích hợp end-to-end: AI inference Python, backend Go/Gin, WebSocket, HLS, MongoDB, Redis/StateStorage, RAG ChromaDB + Gemini, web/mobile dashboard.

8. Đâu là giá trị thực tiễn lớn nhất?
   - Rút ngắn thời gian phát hiện và báo người thân/caregiver, có bằng chứng hình ảnh/video, hỗ trợ sơ cứu ngay khi chờ cấp cứu.

9. Nếu hội đồng hỏi "đề tài này có quá rộng không?", trả lời thế nào?
   - Thừa nhận rộng nhưng chia thành module độc lập; MVP tập trung vào pipeline cảnh báo khẩn cấp, các tính năng nâng cao được thiết kế mở rộng.

10. Nếu phải tóm tắt hệ thống trong 30 giây?
    - CAS nhận luồng camera, AI phân tích tư thế/sinh hiệu, gửi kết quả về Go backend, backend xác nhận sự kiện theo thời gian, phát cảnh báo WebSocket/Telegram/cuộc gọi, lưu sự kiện và cho phép tra cứu bằng dashboard/RAG.

## 2. Câu hỏi kiến trúc hệ thống

11. Kiến trúc tổng thể gồm những thành phần nào?
    - Web Next.js, Mobile React Native, Go backend, Python inference, AI Brain FastAPI, MongoDB, Redis/state storage, ChromaDB, FFmpeg/HLS, Telegram/Twilio/Android call.

12. Vì sao chọn microservice thay vì monolithic?
    - AI Python cần thư viện OpenCV/MediaPipe/PyTorch; backend Go tối ưu API/concurrency; RAG FastAPI tách riêng dễ scale và bảo trì.

13. Dữ liệu đi từ camera đến cảnh báo như thế nào?
    - Camera/stream -> Python inference xử lý -> POST `/api/v1/ai-result` kèm `X-API-Key` -> Go alert engine -> state machine -> WebSocket/Telegram/call -> MongoDB/archive.

14. Backend Go có trực tiếp chạy AI không?
    - Không phải chính. Go backend quản lý API, HLS, trạng thái và cảnh báo; AI result do script Python hoặc AI service đẩy về backend.

15. Vì sao dùng Go cho backend?
    - Go phù hợp xử lý concurrent goroutine, API nhẹ, WebSocket hub, subprocess FFmpeg, hiệu năng ổn định.

16. Vì sao dùng Python cho AI?
    - Hệ sinh thái AI mạnh: PyTorch, OpenCV, MediaPipe, Ultralytics YOLO, scipy, sentence-transformers.

17. Vì sao dùng Next.js cho dashboard?
    - React component, App Router, TypeScript, tích hợp HLS.js/WebSocket tốt, dễ triển khai Vercel/Railway.

18. Vì sao dùng MongoDB?
    - Dữ liệu camera, user, event, health profile có cấu trúc linh hoạt; dễ lưu metadata incident và pose data.

19. Vai trò của Redis trong báo cáo/code là gì?
    - Lưu/cache trạng thái cảnh báo hoặc camera state để tránh mất trạng thái khi restart; trong code `NewSmartStorage(redisURL)` chọn storage phù hợp.

20. Vai trò của ChromaDB là gì?
    - Vector database cho tài liệu, incident text và truy vấn chatbot theo ngữ nghĩa.

21. Vì sao dùng FFmpeg + HLS?
    - Chuyển RTSP/MJPEG thành HLS `.m3u8` để browser phát được; chia segment ngắn phục vụ live stream.

22. Hệ thống real-time ở đâu?
    - WebSocket cho cảnh báo tức thời; HLS cho video live gần thời gian thực; Python inference đẩy kết quả định kỳ.

23. Điểm nghẽn hiệu năng có thể nằm ở đâu?
    - AI inference CPU/GPU, FFmpeg transcoding, băng thông HLS, Gemini API latency/quota, Mongo/Chroma query, WebSocket scale.

24. Nếu triển khai cho nhiều camera, cần scale phần nào trước?
    - Tách inference worker theo camera/GPU, giới hạn FPS, dùng queue, scale FFmpeg/HLS, phân vùng storage, scale WebSocket backend.

25. Nếu backend bị restart, điều gì xảy ra?
    - Cần khôi phục camera streams, WebSocket reconnect, trạng thái cảnh báo nên lấy từ Redis/Mongo; hiện code có `StartAll()` đọc camera DB và restart HLS.

## 3. Câu hỏi AI phát hiện té ngã

26. Input của model fall detection là gì?
    - Chuỗi 30 frame, mỗi frame 99 giá trị keypoint, tương ứng 33 điểm MediaPipe Pose x 3 tọa độ.

27. Vì sao dùng 30 frame?
    - Đủ biểu diễn chuyển động ngắn hạn, giúp CNN-LSTM học sự thay đổi tư thế theo thời gian thay vì chỉ một ảnh tĩnh.

28. Kiến trúc model fall detection là gì?
    - `FallDetectionModel`: Conv1D trích đặc trưng theo chuỗi, LSTM học phụ thuộc thời gian, fully connected phân loại 4 lớp.

29. Vì sao kết hợp CNN và LSTM?
    - CNN trích đặc trưng cục bộ từ keypoint sequence; LSTM nắm diễn biến thời gian như ngã nhanh, nằm lâu, chuyển trạng thái.

30. MediaPipe Pose đóng vai trò gì?
    - Trích skeleton/keypoints để giảm phụ thuộc nền ảnh, ánh sáng và trang phục hơn so với xử lý ảnh thô.

31. Vì sao không dùng trực tiếp YOLO để phát hiện người ngã?
    - YOLO mạnh ở object detection nhưng khó hiểu chuyển động/tư thế thời gian; skeleton + CNN-LSTM phù hợp hơn cho fall action recognition.

32. YOLOv11-Nano dùng để làm gì trong hệ thống?
    - Lọc false alarm khi người nằm/ngồi trên sofa/giường/đồ vật, nhận diện furniture/object để phân biệt nghỉ ngơi với té ngã.

33. Cơ chế giảm false positive trong `inference.py` là gì?
    - Kết hợp confidence threshold, fall streak nhiều frame, kiểm tra sudden drop, kiểm tra tư thế, kiểm tra furniture collision.

34. Nếu người cúi xuống nhặt đồ, hệ thống tránh báo ngã như thế nào?
    - Dựa vào góc torso/thigh, trạng thái pose và streak; cúi người không được xem là fall liên tục nếu không thỏa điều kiện hậu ngã.

35. Vì sao cần state machine trong phát hiện ngã?
    - Để phân biệt trạng thái normal, nghi ngờ, fall detected, post-fall; tránh cảnh báo tức thì khi chỉ có nhiễu một vài frame.

36. Ngưỡng confidence hiện được dùng thế nào?
    - Với model khác rPPG, backend coi label khác `normal` và confidence > 0.85 là bất thường.

37. Điểm yếu của cách dùng ngưỡng cố định là gì?
    - Không thích nghi theo môi trường, camera angle, người dùng; cần calibration hoặc adaptive threshold.

38. Nếu camera đặt quá cao/thấp thì ảnh hưởng gì?
    - Keypoint méo/thiếu, góc cơ thể không ổn định, tăng false negative/false positive.

39. Nếu có nhiều người trong khung hình thì sao?
    - Báo cáo có nêu đây là hạn chế; tracking nhiều người có thể bị PID swap, cần multi-person tracker tốt hơn.

40. Nếu ánh sáng yếu hoặc bị che khuất?
    - MediaPipe/YOLO giảm độ chính xác; cần cảnh báo chất lượng môi trường, IR camera hoặc sensor bổ sung.

41. Tại sao model nhận 99 giá trị thay vì ảnh RGB?
    - Giảm kích thước input, tăng tốc inference, tập trung vào tư thế cơ thể, giảm dữ liệu nhạy cảm.

42. Có nhược điểm gì khi chỉ dùng keypoints?
    - Mất thông tin ngữ cảnh, vật cản, bề mặt; phụ thuộc chất lượng pose estimation.

43. `ai-service/main.py` và `grpc_server.py` khác nhau thế nào?
    - Cả hai load model fall; FastAPI cung cấp REST `/analyze`, gRPC cung cấp RPC `Analyze` với proto `FrameRequest`.

44. Vì sao có cả REST và gRPC?
    - REST dễ test/tích hợp; gRPC phù hợp giao tiếp tốc độ cao, schema rõ ràng giữa services.

45. `proto/fall_detection.proto` định nghĩa gì?
    - `Frame` chứa repeated float keypoints, `FrameRequest` chứa nhiều frame, `AnalysisResult` gồm label, confidence, probabilities, service `FallDetector.Analyze`.

46. Nếu hội đồng hỏi model được train bằng dataset nào?
    - Trả lời theo báo cáo/code hiện có: model weight đã có `models/best_model.pth`; cần nêu rõ nguồn dataset/tiền xử lý nếu đã chuẩn bị, nếu chưa thì nói MVP dùng dataset thử nghiệm và cần mở rộng dataset thực tế.

47. Accuracy 85% trong dashboard có phải kết quả đo chính thức không?
    - Nên nói đây là metadata/đánh giá MVP hiển thị; để công bố khoa học cần bảng test set, confusion matrix, precision/recall/F1.

48. Cần metric nào cho bài toán y tế?
    - Recall/sensitivity cho sự cố nguy hiểm, false alarm rate, detection latency, precision, F1, confusion matrix theo điều kiện ánh sáng/góc camera.

49. Vì sao false negative nguy hiểm hơn false positive?
    - Bỏ sót té ngã/ngưng tim có thể làm chậm cấp cứu; false positive gây phiền nhưng có thể xử lý bằng xác nhận nhiều tầng.

50. Nếu mô hình báo ngã liên tục, backend xử lý lặp cảnh báo thế nào?
    - Có state `LastTelegramAlertTime`, `LastPhoneCallTime`, `AlertPaused`; Telegram lặp sau khoảng 5s, gọi lặp khoảng 30s trong luồng fall.

## 4. Câu hỏi rPPG, nhịp thở và phát hiện đau

51. rPPG là gì?
    - Remote Photoplethysmography: ước lượng nhịp tim từ biến đổi màu rất nhỏ trên da mặt qua video, không cần cảm biến đeo.

52. Vì sao rPPG phụ thuộc ánh sáng?
    - Tín hiệu màu da rất nhỏ; thiếu sáng, flicker, motion blur làm nhiễu tín hiệu.

53. Code rPPG lấy ROI ở đâu?
    - `rppg_inference.py` phát hiện mặt, crop face; làm mượt tọa độ để giảm jitter.

54. Nhịp thở được ước lượng như thế nào?
    - Theo báo cáo/code: theo dõi vùng ngực dựa trên vai/face fallback, tính dao động luminance/chest movement để suy ra RPM.

55. DeepPhys trong code dùng để làm gì?
    - Model spatial-temporal CNN cho rPPG, có nhánh appearance/motion và attention.

56. Vì sao cần bandpass filter?
    - Lọc tần số sinh lý hợp lý của nhịp tim, giảm nhiễu ngoài dải.

57. Nếu người bệnh di chuyển nhiều thì rPPG bị gì?
    - Motion artifact lớn, ROI không ổn định, BVP/HR sai; cần yêu cầu tương đối đứng yên hoặc dùng sensor bổ trợ.

58. Ngưỡng bất thường sinh hiệu trong backend là gì?
    - Backend parse label dạng `rPPG: x BPM | Resp: y RPM`, phân loại warning/danger/critical bằng ngưỡng HR/RR và kích hoạt theo thời gian.

59. Vì sao rPPG có delay xác nhận khác fall?
    - Sinh hiệu dễ nhiễu nên cần xác nhận liên tục; critical thì rút ngắn thời gian.

60. Phát hiện đau qua khuôn mặt dựa trên gì?
    - MediaPipe Face Mesh, tính đặc trưng như brow furrowing, eye squinting, mouth/nose wrinkle; fallback bằng motion proxy.

61. Pain score có ý nghĩa lâm sàng tuyệt đối không?
    - Không. Đây là chỉ báo hỗ trợ cảnh báo, cần kiểm chứng y khoa; không thay thế chẩn đoán bác sĩ.

62. Vì sao threshold pain trong code push alert là khoảng 3.5 nhưng báo cáo nói pain alert > 6.0?
    - Đây là điểm cần chuẩn bị: có thể giải thích MVP hạ ngưỡng để demo/nhạy hơn, còn ngưỡng lâm sàng đề xuất cần hiệu chỉnh; nên đồng bộ lại trước bảo vệ nếu có thời gian.

63. Nếu camera chỉ thấy mặt, có đo nhịp thở được không?
    - Code có fallback face-based chest projection nhưng độ tin cậy thấp hơn khi không thấy ngực/vai.

64. Hệ thống có phát hiện ngưng tim trực tiếp không?
    - Không đo ECG trực tiếp; suy luận nguy cơ qua HR/RR bất thường, apnea, fall/unconsciousness. Cần nói rõ đây là cảnh báo hỗ trợ, không phải thiết bị y tế chẩn đoán.

65. Làm sao kiểm tra rPPG đúng?
    - So sánh với pulse oximeter/smartwatch/thiết bị y tế tham chiếu trong nhiều điều kiện ánh sáng, tính MAE/RMSE và tỉ lệ lỗi.

## 5. Câu hỏi backend Go, alert pipeline

66. Endpoint quan trọng nhất nhận kết quả AI là gì?
    - `POST /api/v1/ai-result`, xác thực bằng header `X-API-Key`.

67. Vì sao endpoint AI result không dùng JWT?
    - Nó dành cho service nội bộ Python; dùng internal API key đơn giản cho machine-to-machine.

68. Rủi ro của `X-API-Key` hardcode trong script Python là gì?
    - Lộ khóa nếu commit/public; nên dùng biến môi trường, secret manager, rotate key.

69. Alert engine hoạt động thế nào?
    - Nhận `AIResult` qua channel, kiểm tra label/confidence/model, cập nhật state theo camera, phát local warning, Telegram, phone call, lưu event.

70. Vì sao dùng Go channel `ResultCh`?
    - Tách HTTP request khỏi xử lý cảnh báo, xử lý async, tránh block request.

71. Các mốc thời gian cảnh báo fall trong code là gì?
    - Khoảng 3s local warning/Telegram theo dõi, 8s snapshot evidence, 13s Telegram khẩn cấp, 20s gọi điện, sau đó có lặp.

72. Vì sao không gọi cấp cứu ngay lập tức khi vừa phát hiện fall?
    - Để giảm false alarm; hệ thống escalation theo thời gian nếu bất thường kéo dài.

73. Khi người dùng bấm pause trên Telegram thì sao?
    - `AlertPaused = true`, hệ thống dừng cảnh báo lặp cho camera đó.

74. Khi trạng thái trở lại bình thường thì sao?
    - `resetCameraState` xóa state, gửi thông báo hồi phục, broadcast `clear_alert` qua WebSocket.

75. Event được lưu ở đâu?
    - MongoDB collection `events`, có camera_id, user_id, type, confidence, status, video_url, detected_at.

76. Video bằng chứng được lưu thế nào?
    - HLS server copy các segment `.ts` và `.m3u8` hiện tại sang `storage/archives/<incidentID>`.

77. Điểm yếu của cách archive HLS hiện tại?
    - Copy segment hiện có, không đảm bảo đúng 2 phút nếu buffer/list size nhỏ; cần ring buffer/recording pipeline rõ hơn.

78. Vì sao cần `user_id` trong camera/event?
    - Phân quyền dữ liệu theo người dùng; chỉ owner xem camera/incident của mình.

79. Có chống spam API không?
    - `main.go` có rate limit map theo IP 60 request/phút, nhưng in-memory nên chưa phù hợp multi-instance production.

80. Hạn chế của rate limiter hiện tại?
    - Reset toàn cục theo phút, không distributed, có thể mất khi restart, không phân biệt endpoint/user.

81. CORS được cấu hình thế nào?
    - Cho phép localhost frontend và `FRONTEND_URL` từ env, cho headers Authorization/Content-Type và credentials.

82. HLS stream được bảo vệ ra sao?
    - Route `/streams/*filepath` dùng `StreamAuthMiddleware`; hỗ trợ token path hoặc query token.

83. Nếu token HLS bị lộ thì sao?
    - Người khác có thể xem stream trong thời gian token còn hiệu lực; nên dùng token ngắn hạn, ký path, TLS.

84. Vì sao cần WebSocket private message?
    - Cảnh báo chỉ gửi cho user sở hữu camera, không broadcast toàn hệ thống.

85. Nếu WebSocket mất kết nối?
    - Frontend reconnect sau 5 giây; backend vẫn lưu incident trong Mongo/alert state.

## 6. Câu hỏi camera, streaming và HLS

86. Camera hỗ trợ dạng nào?
    - RTSP, HTTP/MJPEG, HLS cloud/bridge; có tích hợp IMOU lấy live URL.

87. Vì sao browser không xem RTSP trực tiếp?
    - Browser không hỗ trợ RTSP native; cần chuyển qua HLS/WebRTC/MJPEG.

88. Vì sao chọn HLS thay vì WebRTC?
    - HLS dễ triển khai, tương thích tốt; nhược điểm là latency cao hơn WebRTC.

89. FFmpeg chạy thế nào trong backend?
    - `stream.StartHLS` spawn subprocess FFmpeg, convert/copy stream thành segment HLS, restart nếu lỗi.

90. Vì sao dùng `-c:v copy` cho RTSP?
    - Giảm CPU, tránh transcode, giảm latency nếu codec tương thích.

91. Khi nào dùng `libx264`?
    - Với HTTP/MJPEG input, cần encode sang HLS H.264.

92. HLS segment config hiện tại là gì?
    - `hls_time 1`, `hls_list_size 5`, flags delete/append/omit_endlist/discont_start.

93. Latency HLS phụ thuộc gì?
    - Segment duration, list size, network, player buffer, transcoding/copy, camera stream.

94. `useHLS.ts` dùng thư viện gì?
    - `hls.js` nếu browser hỗ trợ MSE; fallback native HLS cho Safari.

95. Nếu stream bị đứt, hệ thống làm gì?
    - FFmpeg loop restart sau lỗi; camera manager có backoff logic nhưng `mockReadRTSP` hiện chỉ health-check đơn giản.

96. Điểm hội đồng có thể hỏi xoáy về camera manager?
    - `processFrames` trong Go không xử lý AI thật, chỉ health-check; AI thực tế nằm ở script Python riêng. Cần trình bày rõ để tránh hiểu nhầm.

## 7. Câu hỏi RAG chatbot và AI Brain

97. RAG là gì?
    - Retrieval-Augmented Generation: tìm tài liệu liên quan trong vector DB rồi đưa vào LLM để trả lời dựa trên ngữ cảnh.

98. Vì sao không hỏi thẳng Gemini?
    - RAG giúp trả lời theo dữ liệu hệ thống/camera/incident/tài liệu kỹ thuật, giảm hallucination và có ngữ cảnh riêng.

99. AI Brain dùng thành phần nào?
    - FastAPI, ChromaDB PersistentClient, sentence-transformers `all-MiniLM-L6-v2`, Gemini 2.5 Flash Lite.

100. Endpoint `/index` làm gì?
     - Thêm document text + metadata vào ChromaDB collection.

101. Endpoint `/chat` làm gì?
     - Query ChromaDB top 4 kết quả, ghép context vào prompt, gọi Gemini sinh câu trả lời tiếng Việt.

102. Dữ liệu incident được đưa vào RAG khi nào?
     - Trong `triggerTelegramAlertOnly`, backend tạo incident text và POST sang `AI_BRAIN_URL/index`.

103. RAG có phân quyền theo user không?
     - Metadata có `user_id`, nhưng code chat hiện query chung theo text, chưa filter user. Đây là rủi ro cần nêu hướng cải tiến.

104. Rủi ro privacy của chatbot là gì?
     - Có thể trả nhầm dữ liệu giữa người dùng nếu không filter metadata; prompt injection; lộ thông tin sức khỏe.

105. Làm sao cải tiến RAG an toàn hơn?
     - Truyền user_id từ JWT, filter Chroma metadata, log/audit, guardrail prompt, không đưa secret vào context, phân quyền document.

106. Vì sao dùng `all-MiniLM-L6-v2`?
     - Nhẹ, embedding nhanh, phù hợp MVP semantic search; có thể thay bằng model multilingual tốt hơn cho tiếng Việt.

107. Nếu Gemini API quota exceeded thì sao?
     - Trả lỗi/fallback; cần cache, retry, rate limit và câu trả lời fallback từ rule-based docs.

108. RAG có thể thay bác sĩ không?
     - Không. Chỉ hỗ trợ thông tin sơ cứu/tham khảo; trường hợp khẩn cấp phải gọi 115/nhân viên y tế.

## 8. Câu hỏi frontend web

109. Web dashboard có những màn hình chính nào?
     - Dashboard, Cameras, Incidents, Analytics, Profile, rPPG, AI Models, Reports, Docs, CPR, Subscription, Settings, Recommendations.

110. Dashboard nhận alert realtime thế nào?
     - Hook `useDashboardSocket` mở WebSocket `/ws?token=...`, parse event `alert`, `local_warning`, `clear_alert`, `subscription_updated`.

111. Khi có `local_warning`, UI làm gì?
     - Set alert state, phát âm báo synthetic qua Web Audio API, gọi callback cập nhật incident.

112. Vì sao cần token trong WebSocket?
     - Xác thực người dùng trước khi nhận private alert.

113. HLS player hoạt động thế nào?
     - `useHLS` attach Hls.js vào video element, load `.m3u8`, autoplay nếu browser cho phép.

114. Nếu autoplay bị chặn?
     - Code catch lỗi; UI cần cho người dùng bấm play hoặc mute autoplay.

115. NextAuth trong dự án dùng vai trò gì?
     - Có route auth Next.js; backend chính dùng social login/JWT riêng. Cần giải thích ranh giới nếu bị hỏi.

116. Làm sao dashboard tránh hiển thị camera người khác?
     - Backend filter theo user_id/JWT; frontend chỉ gọi API với token.

117. UI có hỗ trợ đa ngôn ngữ không?
     - Có `translations.ts` và LanguageContext; cần nêu phạm vi nếu chưa đầy đủ.

118. Nếu mất mạng frontend thì alert có mất không?
     - Realtime mất tạm thời, nhưng incident vẫn lưu MongoDB; khi reconnect có thể reload danh sách incident.

## 9. Câu hỏi mobile app

119. Mobile app dùng công nghệ gì?
     - React Native/Expo style, TypeScript, zustand auth store, screens Home/Cameras/Incidents/CPR/Profile/Settings.

120. Mobile nhận WebSocket thế nào?
     - `WebSocketContext` kết nối endpoint websocket, cập nhật `alertState` khi nhận event `alert`.

121. Điểm hạn chế WebSocket mobile hiện tại?
     - Code chỉ xử lý `alert`, chưa xử lý `clear_alert`/`local_warning` đầy đủ như web; endpoint có thể thiếu token tùy config.

122. Vì sao cần mobile nếu đã có web?
     - Người thân/caregiver nhận cảnh báo và xem incident mọi lúc, tiện hơn dashboard máy tính.

123. Push notification native đã có chưa?
     - Nếu chưa triển khai đầy đủ, nói hiện MVP dùng WebSocket/Telegram/call; push notification là roadmap.

## 10. Câu hỏi bảo mật và quyền riêng tư

124. Dữ liệu nào là nhạy cảm nhất?
     - Video camera, ảnh bằng chứng, thông tin sức khỏe, số điện thoại, lịch sử incident, RTSP URL.

125. RTSP URL được bảo vệ ra sao?
     - Camera manager gọi `auth.Decrypt(cam.RTSPURL)` trước khi stream; nghĩa là DB lưu encrypted RTSP URL.

126. JWT dùng để làm gì?
     - Xác thực API private, WebSocket, stream access.

127. Vì sao cần mã hóa RTSP URL?
     - RTSP URL thường chứa username/password camera; lộ URL là lộ quyền xem camera.

128. Rủi ro khi lưu ảnh evidence vào `audio/evidence_temp.jpg` là gì?
     - File tạm có thể bị ghi đè giữa camera/sự kiện, rủi ro race condition và lộ dữ liệu; nên lưu theo incidentID/cameraID.

129. Hệ thống đã đạt chuẩn y tế/HIPAA chưa?
     - Chưa. Báo cáo coi production hardening/HIPAA là hạn chế và roadmap.

130. Cần làm gì để production healthcare?
     - TLS end-to-end, encryption at rest, audit log, RBAC, consent, retention policy, key management, compliance, monitoring.

131. Prompt injection trong chatbot là gì?
     - Người dùng/tài liệu độc hại yêu cầu bot bỏ qua quy tắc/lộ secret; cần guardrail và lọc context.

132. API key trong repo nên xử lý thế nào?
     - Không hardcode; dùng `.env`, secret manager, biến môi trường, rotate key.

133. Nếu người ngoài gửi fake AI result thì sao?
     - Endpoint kiểm tra `X-API-Key`; nhưng cần thêm mTLS/service auth, request signing, camera ownership validation.

134. CORS có đủ bảo mật không?
     - CORS chỉ bảo vệ browser origin, không thay thế authentication/authorization.

## 11. Câu hỏi cơ sở dữ liệu

135. Các collection chính là gì?
     - users, cameras, events, alerts, health_profiles, cpr_guides, ai_models; thêm ChromaDB collection `casos_intelligence`.

136. Vì sao event cần `status`?
     - Phân biệt active/resolved/false alarm, phục vụ dashboard và thống kê.

137. Vì sao camera cần `user_id` và `created_by`?
     - Quản lý ownership và phân quyền, truy vết người tạo.

138. HealthProfile lưu gì?
     - Nhóm máu, bệnh nền, thuốc, contact khẩn cấp, updated_at; code còn có thể dùng profile dạng bson.M để lấy tên/chat ID.

139. Cần index MongoDB nào?
     - `events.user_id`, `events.camera_id`, `events.detected_at`, `cameras.user_id`, `users.provider_id/email`.

140. Nếu dữ liệu incident tăng nhanh?
     - Cần retention policy, archive object storage, pagination, TTL/index, nén video.

141. Vì sao dùng ChromaDB riêng thay vì Mongo text search?
     - Chroma hỗ trợ vector similarity theo ngữ nghĩa, phù hợp chatbot RAG.

## 12. Câu hỏi tích hợp Telegram, gọi điện, thanh toán

142. Telegram dùng để làm gì?
     - Gửi cảnh báo, ảnh bằng chứng, nút hướng dẫn sơ cứu, pause alert, gọi lại khẩn cấp.

143. Vì sao dùng Telegram thay vì chỉ notification app?
     - Dễ triển khai, thông báo nhanh, có inline button, không cần app riêng luôn online.

144. Gọi điện khẩn cấp thực hiện bằng gì?
     - Code có Gateway telephony, hỗ trợ Android ADB/local SIM call và các module Twilio/ElevenLabs.

145. Vì sao cần escalation qua cuộc gọi?
     - Người thân có thể bỏ lỡ notification; cuộc gọi tăng khả năng phản ứng.

146. Nếu Telegram bot bị mất kết nối?
     - Cần fallback qua SMS/call/WebSocket/email; hiện hệ thống có multi-channel định hướng.

147. Thanh toán/subscription trong hệ thống nhằm mục đích gì?
     - Mô hình thương mại theo gói camera/tính năng, SePay/VietQR/plan management.

148. Nếu hội đồng hỏi thanh toán có liên quan đồ án AI không?
     - Đây là phần sản phẩm hóa/startup; core kỹ thuật vẫn là monitoring + alert pipeline.

## 13. Câu hỏi testing, đánh giá và demo

149. Bạn đã test những phần nào?
     - API auth/camera/incident, gRPC, model load, dashboard stream, alert simulation, RAG, HLS, Telegram/call demo.

150. Test quan trọng nhất cho hệ thống y tế là gì?
     - End-to-end latency, false negative, false positive, recovery, multi-camera, network failure, privacy/security.

151. Độ trễ từ phát hiện đến cảnh báo là bao nhiêu?
     - Fall pipeline cố ý có mốc 3s/8s/13s/20s; rPPG có mốc 3-8s tùy critical/warning. Cần nêu latency đo thực tế khi demo.

152. Vì sao báo cáo nói 7s/10s nhưng code có 3s/13s/20s?
     - Đây là điểm cần chuẩn bị: báo cáo mô tả demo/thiết kế ban đầu, code đã điều chỉnh escalation để giảm false alarm và tăng bằng chứng; nên cập nhật slide/báo cáo hoặc giải thích là các mốc có thể cấu hình.

153. Demo bảo vệ nên chạy luồng nào?
     - Login -> thêm camera hoặc dùng webcam -> bật inference -> giả lập/diễn fall -> dashboard local warning -> Telegram evidence -> incident log -> RAG hỏi sự kiện/sơ cứu.

154. Nếu demo AI thật lỗi, phương án dự phòng?
     - Dùng endpoint simulate AI đã có `/cameras/:id/simulate-ai`, video/ảnh bằng chứng mẫu, screenshot flow, log backend.

155. Làm sao chứng minh không phải demo fake?
     - Cho xem script inference đẩy realtime, log backend nhận `/ai-result`, WebSocket event, MongoDB event, Telegram timestamp.

156. Nên chuẩn bị số liệu nào trước bảo vệ?
     - Confusion matrix fall, latency trung bình, số case test, FPS inference, CPU/GPU usage, rPPG error so với thiết bị tham chiếu.

157. Nếu hội đồng hỏi "có test trên bệnh nhân thật chưa?"
     - Trả lời trung thực: MVP thử nghiệm trong môi trường mô phỏng/người tình nguyện; cần approval đạo đức và dữ liệu lâm sàng cho triển khai thật.

158. Nếu camera không kết nối trong demo?
     - Dùng webcam/local stream hoặc simulate endpoint; giải thích cloud camera phụ thuộc mạng/quyền RTSP.

159. Nếu Telegram không gửi được?
     - Kiểm tra bot token/chat id/network; có thể demo WebSocket + DB event trước, Telegram bằng video/log dự phòng.

160. Nếu Gemini quota hết?
     - Demo RAG bằng context đã index hoặc fallback response; giải thích quota/API external là dependency.

## 14. Câu hỏi phản biện sâu

161. Hệ thống có thể gây hại nếu cảnh báo sai không?
     - Có thể gây hoảng loạn/phiền nhiễu; do đó có multi-stage confirmation, pause, false alarm marking và cần kiểm định thêm.

162. Hệ thống có thể bỏ sót trường hợp người ngã khuất camera không?
     - Có. Camera-based system phụ thuộc field of view; cần multi-camera/wearable/panic button bổ sung.

163. Tại sao không dùng wearable thay camera?
     - Wearable chính xác hơn cho sinh hiệu nhưng người già có thể quên đeo/sạc; camera không tiếp xúc nhưng có vấn đề privacy. Hướng tốt là hybrid.

164. Tại sao không dùng optical flow/action recognition trên video RGB?
     - RGB giàu thông tin nhưng nặng và nhạy privacy; skeleton nhẹ hơn. Có thể kết hợp trong tương lai.

165. Làm sao cá nhân hóa ngưỡng sinh hiệu?
     - Dựa trên health profile, tuổi, bệnh nền, baseline HR/RR theo thời gian; code đã có nhánh personalized threshold nhưng cần hoàn thiện dữ liệu.

166. Nếu hai người trong phòng, cảnh báo gắn với ai?
     - MVP còn hạn chế; cần person re-identification, tracking ID ổn định, gán camera zone/bed, hoặc wearable pairing.

167. Nếu người nằm ngủ trên sofa thì sao?
     - YOLO furniture và pose logic giảm false alarm; tuy nhiên cần learning theo ngữ cảnh và thời gian nằm bình thường.

168. Nếu người té nhưng sau đó đứng dậy ngay?
     - State reset khi label normal; có thể chỉ lưu warning hoặc không kích hoạt emergency, tùy thời gian bất thường.

169. Vì sao không gọi 115 tự động?
     - Vấn đề pháp lý, false alarm, trách nhiệm; MVP gọi người thân/caregiver trước, hướng dẫn gọi 115.

170. Ai chịu trách nhiệm nếu chatbot hướng dẫn sai?
     - Hệ thống phải có disclaimer, nguồn y tế chuẩn, kiểm duyệt nội dung; không thay thế bác sĩ/cấp cứu chuyên nghiệp.

171. Có nên lưu video người dùng không?
     - Chỉ lưu khi có incident, có consent, giới hạn retention và mã hóa; tránh lưu liên tục để giảm privacy risk.

172. Hệ thống có hoạt động offline không?
     - Inference local có thể hoạt động, nhưng Telegram/Gemini/cloud cần internet; cần offline fallback local alarm/call.

173. Nếu mất điện/mất mạng thì sao?
     - Cần UPS, local siren, edge storage, retry sync khi mạng phục hồi; hiện là roadmap production.

174. Vì sao dùng ChromaDB embedded thay vì managed vector DB?
     - Đơn giản cho MVP/local; production có thể chuyển Pinecone/Weaviate/Qdrant managed.

175. Nếu triển khai bệnh viện, cần thay đổi gì?
     - Multi-tenant RBAC, audit, HL7/FHIR integration, device management, SLA, monitoring, compliance, edge GPU server.

## 15. Câu hỏi về báo cáo, thị trường và startup

176. SWOT của hệ thống là gì?
    - Strength: tích hợp AI + alert. Weakness: phụ thuộc camera/môi trường. Opportunity: aging population/smart healthcare. Threat: pháp lý, cạnh tranh, privacy.

177. Mô hình kinh doanh là gì?
    - Subscription theo số camera/tính năng, B2B nursing home, hardware-software bundle, premium call/SMS.

178. Đối thủ cạnh tranh là ai?
    - CCTV thông minh, wearable fall detectors, home security systems, medical alert devices.

179. Lợi thế cạnh tranh của CAS?
    - Không cần đeo thiết bị, tích hợp video evidence + RAG sơ cứu + multi-channel alert + dashboard.

180. Rào cản triển khai thực tế?
    - Privacy, độ chính xác lâm sàng, camera placement, băng thông, chi phí cloud, compliance, niềm tin người dùng.

181. Vì sao đề tài có tính đổi mới?
    - Không chỉ phát hiện fall đơn lẻ, mà tích hợp pipeline cảnh báo, sinh hiệu không tiếp xúc, chatbot sơ cứu và quản trị sự kiện.

182. Hạn chế lớn nhất đã nêu trong báo cáo?
    - Robustness/false alarm, rPPG phụ thuộc môi trường, production hardening, wearable chưa tích hợp, multi-person tracking.

183. Roadmap ngắn hạn là gì?
    - Ổn định MVP, giảm latency, nút false alarm, cloud secure deployment, tối ưu model.

184. Roadmap dài hạn là gì?
    - Wearable, IoT sensors, multi-camera fusion, telemedicine integration, B2B hospitals/nursing homes.

185. Nếu chỉ được chọn một hướng cải tiến sau bảo vệ?
    - Nên chọn đánh giá/giảm false alarm bằng dataset thực tế và chuẩn hóa security/privacy, vì ảnh hưởng trực tiếp khả năng triển khai.

## 16. Câu hỏi code-level hội đồng có thể mở file hỏi

186. Trong `go-backend/main.go`, các route public/private được chia thế nào?
    - Public: auth, payment webhook, bridge register, ai-result. Private group `/api/v1` dùng JWT cho billing, camera, incidents, chat, profile, simulate, model toggle.

187. Trong `alert/api.go`, vì sao `AIResult` decode ảnh base64?
    - Python gửi evidence image/skeleton image dạng base64 trong JSON, backend decode để gửi Telegram/lưu file.

188. Trong `alert/engine.go`, vì sao dùng `CameraState`?
    - Theo dõi trạng thái nghi ngờ theo từng camera: suspect start, local alert sent, snapshot, telegram sent, phone initiated, pause.

189. Trong `camera/manager.go`, vì sao `StartAll()` đọc camera từ DB?
    - Khi backend khởi động lại, tự khởi động lại các stream đã đăng ký.

190. Trong `stream/hls.go`, cleanup worker làm gì?
    - Xóa `.ts`/`.m3u8` cũ hơn 1 giờ trong output stream để tránh đầy ổ.

191. Trong `models/model_def.py`, input LSTM sau CNN có shape gì?
    - Ban đầu `(batch, seq, features)`, permute sang `(batch, features, seq)` cho Conv1D, rồi permute lại `(batch, seq, channels)` cho LSTM.

192. Trong `rppg_inference.py`, vì sao có `poll_model_status()`?
    - Cho dashboard bật/tắt rPPG/Pain model từ backend `ai-models`.

193. Trong `ai-brain/service.py`, prompt có quy tắc nào quan trọng?
    - Trả lời tiếng Việt dựa trên context, không tiết lộ bí mật kỹ thuật nội bộ, liệt kê đầy đủ khi hỏi danh sách.

194. Trong `useDashboardSocket.ts`, reconnect thế nào?
    - Khi close, set timeout kết nối lại sau 5 giây.

195. Trong mobile `WebSocketContext.tsx`, vì sao có thể cần sửa?
    - WebSocket endpoint có thể chưa gắn token và chỉ xử lý event `alert`; nên đồng bộ với web để nhận clear/local warning.

## 17. Câu hỏi "bẫy" và cách trả lời an toàn

196. "Hệ thống có chẩn đoán ngưng tim chính xác không?"
    - Không khẳng định chẩn đoán. Hệ thống cảnh báo nguy cơ qua dấu hiệu bất thường và hỗ trợ phản ứng nhanh.

197. "Có thể bán cho bệnh viện ngay không?"
    - Chưa. Cần kiểm định, compliance, bảo mật, thử nghiệm lâm sàng và vận hành production.

198. "AI có thay bác sĩ/caregiver không?"
    - Không. AI hỗ trợ giám sát và cảnh báo, quyết định y tế vẫn do con người/chuyên môn y tế.

199. "Nếu model sai thì trách nhiệm thuộc ai?"
    - MVP nghiên cứu; triển khai thật cần điều khoản sử dụng, kiểm định, human-in-the-loop, cảnh báo không thay thế cấp cứu.

200. "Dữ liệu camera có xâm phạm riêng tư không?"
    - Có rủi ro; thiết kế cần consent, mã hóa, phân quyền, chỉ lưu incident, retention policy và minh bạch với người dùng.

201. "Sao trong code có endpoint simulate, vậy demo có thật không?"
    - Simulate dùng để test pipeline và dự phòng demo; AI thật vẫn chạy qua Python inference đẩy `/ai-result`.

202. "Sao báo cáo nói MongoDB với Mongoose nhưng code Go dùng mongo-driver?"
    - Nên giải thích phần báo cáo dùng thuật ngữ chưa chính xác; backend thực tế dùng official MongoDB Go driver, không dùng Mongoose.

203. "Sao có gRPC nhưng backend Go chưa gọi gRPC?"
    - gRPC service là hướng tách inference tốc độ cao; MVP hiện chủ yếu dùng Python script push result/REST. Đây là phần có thể tích hợp sâu hơn.

204. "Sao AI key hardcode trong script?"
    - Đó là cấu hình demo/MVP; production phải chuyển sang env/secret manager và rotate key.

205. "Sao `audio/evidence_temp.jpg` dùng chung?"
    - Đây là hạn chế MVP; cần đổi sang đường dẫn theo incident/camera để tránh ghi đè và tăng bảo mật.

## 18. Checklist chuẩn bị trước ngày bảo vệ

1. Chuẩn bị sơ đồ luồng dữ liệu: Camera -> Python AI -> Go backend -> Alert engine -> WebSocket/Telegram/Call -> Mongo/RAG.
2. Chuẩn bị demo fallback bằng `/simulate-ai` nếu camera/AI thật lỗi.
3. Chuẩn bị số liệu test tối thiểu: latency, số case fall/normal, false alarm, FPS.
4. Đồng bộ các mốc thời gian trong slide/báo cáo/code: 3s, 8s, 13s, 20s hoặc cấu hình chính thức.
5. Chuẩn bị câu trả lời trung thực cho phần chưa production: HIPAA, multi-person, rPPG validation, wearable.
6. Không khẳng định hệ thống chẩn đoán y khoa; dùng cụm "cảnh báo nguy cơ", "hỗ trợ sơ cứu", "không thay thế bác sĩ".
7. Khi bị hỏi code, nhấn mạnh ranh giới module: Go backend điều phối, Python inference xử lý AI, AI Brain xử lý RAG.
8. Kiểm tra env demo: MongoDB, backend port 8080, web 3000, AI Brain 8001, inference camera_id/API key.
9. Chuẩn bị log terminal/backend khi demo để chứng minh event thật.
10. Chuẩn bị 1 slide "Limitations & Future Work" thật rõ, hội đồng thường đánh giá cao sự trung thực kỹ thuật.
