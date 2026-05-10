import cv2
import numpy as np
import time
import requests
import threading
from collections import deque

import torch
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)


# ── State Machine ──────────────────────────────────────────────
class State:
    MONITORING = "monitoring"
    FALL_DETECTED = "fall_detected"
    POST_FALL = "post_fall"


# ── Keypoint group indices ─────────────────────────────────────
ARM_IDX = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
LEG_IDX = [25, 26, 27, 28, 29, 30, 31, 32]
TORSO_IDX = [11, 12, 23, 24]


class FallDetector:
    def __init__(self, model, label_map, n_frames=30):
        self.model = model
        self.label_map = label_map
        self.n_frames = n_frames
        self.buffer = deque(maxlen=n_frames)

        # State machine
        self.state = State.MONITORING
        self.fall_start_time = 0
        self.played_audio = False
        self.fall_streak = 0  # Đếm số frame liên tục predict "fall"
        self.FALL_STREAK_REQUIRED = 8  # Giảm xuống 8 frame để nhạy hơn
        self.pose_history = deque(maxlen=60) # Lưu 2 giây lịch sử tư thế
        self.angle_history = deque(maxlen=30) # Lưu 1 giây lịch sử góc lưng
        self.recovery_streak = 0 # Đếm số frame thực sự hồi phục liên tục
        self.RECOVERY_THRESHOLD = 180 # Cần 6 giây (30fps) để xác nhận hồi phục
        self.prev_label = "normal"  # Label trước đó

        # Variance thresholds (calibrated)
        # Nằm yên: < 0.01 | Co giật: 0.01 ~ 0.03 | Bình thường: > 0.03
        self.THR_LOW = 0.01
        self.THR_HIGH = 0.02
        self.THR_NORMAL = 0.03  # Trên ngưỡng này = hoạt động bình thường

        self.last_mp_time = 0
        self.last_torch_time = 0

        # Setup PoseLandmarker (new tasks API)
        print("   [DEBUG] Configuring Mediapipe tasks...")
        try:
            print("   [DEBUG] Mediapipe tasks configured.")

            options = PoseLandmarkerOptions(
                base_options=BaseOptions(
                    model_asset_path="models/pose_landmarker_lite.task"
                ),
                running_mode=RunningMode.VIDEO,
                num_poses=1,
            )
            print("   [DEBUG] Creating PoseLandmarker from options...")
            self.landmarker = PoseLandmarker.create_from_options(options)
            print("   [DEBUG] PoseLandmarker created.")
        except Exception as e:
            print(f"   [ERROR] Failed to init PoseLandmarker: {e}")
            self.landmarker = None
        self.frame_ts = 0

        # YOLO Furniture Detection (Toggleable)
        self.yolo_enabled = False
        self.yolo_model = None
        self.furniture_classes = [56, 57, 59, 63] # chair, couch, bed, dining table
        self.is_on_furniture = False
        
        # Bắt đầu luồng kiểm tra trạng thái Model từ Dashboard
        threading.Thread(target=self._poll_model_status, daemon=True).start()

    def _poll_model_status(self):
        """Hỏi Backend xem các model có được bật không."""
        api_base = "http://localhost:8080/api/v1"
        headers = {"X-API-Key": "ai_secret_key_12345"}
        
        while True:
            try:
                res = requests.get(f"{api_base}/ai-models", headers=headers, timeout=5)
                if res.status_code == 200:
                    models = res.json()
                    for m in models:
                        if m.get("name") == "YOLO Furniture Detector":
                            is_active = m.get("status") == "Active"
                            if is_active and not self.yolo_enabled:
                                print("   [AI] YOLO Furniture Detector ACTIVATED.")
                                from ultralytics import YOLO
                                self.yolo_model = YOLO("yolov11n.pt")
                                self.yolo_enabled = True
                            elif not is_active and self.yolo_enabled:
                                print("   [AI] YOLO Furniture Detector DEACTIVATED.")
                                self.yolo_enabled = False
                                self.yolo_model = None
                
                # Kiểm tra cả trạng thái của chính mình
                for m in models:
                    if m.get("name") == "Fall Detection Engine":
                        if m.get("status") != "Active":
                            # Nếu bị tắt trên Web, ta vẫn chạy loop nhưng ko gửi alert (xử lý ở push_to_go)
                            pass
            except Exception as e:
                print(f"   [WARN] Failed to poll model status: {e}")
            
            time.sleep(5) # Kiểm tra mỗi 5 giây

    def _check_furniture_collision(self, frame, landmarks):
        """Kiểm tra xem người có đang ở trên giường/ghế không."""
        if not self.yolo_enabled or self.yolo_model is None or landmarks is None:
            return False
            
        results = self.yolo_model(frame, verbose=False)[0]
        
        # Lấy tọa độ hông của người làm điểm tham chiếu (landmark 23, 24)
        px = (landmarks[23].x + landmarks[24].x) / 2
        py = (landmarks[23].y + landmarks[24].y) / 2
        
        for box in results.boxes:
            cls = int(box.cls[0])
            if cls in self.furniture_classes:
                # xyxyn trả về tọa độ chuẩn hóa (0-1)
                x1, y1, x2, y2 = box.xyxyn[0].tolist()
                # Thêm biên độ an toàn 5%
                margin = 0.05
                if (x1-margin) < px < (x2+margin) and (y1-margin) < py < (y2+margin):
                    return True
        return False
    def _get_body_angles(self, landmarks):
        """Trả về góc của thân mình và đùi so với phương thẳng đứng."""
        if landmarks is None or len(landmarks) < 27:
            return 0.0, 0.0
        try:
            # 1. Torso Angle
            s_mid_x = (landmarks[11].x + landmarks[12].x) / 2
            s_mid_y = (landmarks[11].y + landmarks[12].y) / 2
            h_mid_x = (landmarks[23].x + landmarks[24].x) / 2
            h_mid_y = (landmarks[23].y + landmarks[24].y) / 2
            dx, dy = h_mid_x - s_mid_x, h_mid_y - s_mid_y
            torso_angle = abs(np.degrees(np.arctan2(dx, dy)))

            # 2. Thigh Angle
            k_mid_x = (landmarks[25].x + landmarks[26].x) / 2
            k_mid_y = (landmarks[25].y + landmarks[26].y) / 2
            dkx, dky = k_mid_x - h_mid_x, k_mid_y - h_mid_y
            thigh_angle = abs(np.degrees(np.arctan2(dkx, dky)))
            return torso_angle, thigh_angle
        except: return 0.0, 0.0

    def _classify_pose_from_angles(self, torso_angle, thigh_angle):
        """Phân loại tư thế đứng, ngồi, nằm dựa trên góc đã tính."""
        if torso_angle > 45: 
            return "di ngu"
        if torso_angle < 30:
            if thigh_angle > 50: return "ngoi"
            else: return "normal"
        return "normal"

    def _classify_pose(self, landmarks):
        """Backward compatibility for existing calls."""
        t, th = self._get_body_angles(landmarks)
        return self._classify_pose_from_angles(t, th)

    def extract_keypoints(self, frame):
        """Extract 33 pose landmarks (x, y, z) = 99 features safely.
        Returns zeros and None on any Mediapipe failure.
        """
        t_start = time.perf_counter()
        image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB),
        )
        self.frame_ts += 33
        if self.landmarker is None: return np.zeros(99), None
        try:
            result = self.landmarker.detect_for_video(image, self.frame_ts)
        except Exception as e:
            return np.zeros(99), None
        
        self.last_mp_time = (time.perf_counter() - t_start) * 1000

        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            keypoints = []
            for lm in result.pose_landmarks[0]:
                keypoints.extend([lm.x, lm.y, lm.z])
            return np.array(keypoints), result.pose_landmarks[0]
        return np.zeros(99), None

    def _model_predict(self):
        t_start = time.perf_counter()
        input_tensor = torch.tensor(
            np.array(self.buffer), dtype=torch.float32
        ).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(input_tensor), dim=1)[0]
        
        self.last_torch_time = (time.perf_counter() - t_start) * 1000
        
        pred_idx = probs.argmax().item()
        conf = probs[pred_idx].item()
        label = self.label_map[str(pred_idx)]
        all_probs = {self.label_map[str(i)]: probs[i].item() for i in range(len(probs))}
        return label, conf, all_probs

    def _compute_variance(self):
        buffer_np = np.array(self.buffer)  # (30, 99)
        std_per_feature = np.std(buffer_np, axis=0)
        total = float(np.mean(std_per_feature))

        # Variance theo nhóm
        arm_feats = [i * 3 + j for i in ARM_IDX for j in range(3)]
        leg_feats = [i * 3 + j for i in LEG_IDX for j in range(3)]
        torso_feats = [i * 3 + j for i in TORSO_IDX for j in range(3)]

        arm_var = float(np.mean(std_per_feature[arm_feats]))
        leg_var = float(np.mean(std_per_feature[leg_feats]))
        torso_var = float(np.mean(std_per_feature[torso_feats]))

        return {
            "total": total,
            "arm": arm_var,
            "leg": leg_var,
            "torso": torso_var,
        }

    def update(self, frame):
        keypoints, landmarks = self.extract_keypoints(frame)
        self.buffer.append(keypoints)

        if len(self.buffer) < self.n_frames:
            return "waiting", 0.0, landmarks, None, self.state

        # ── STATE MACHINE ──────────────────────────────────────

        if self.state == State.MONITORING:
            label, conf, all_probs = self._model_predict()
            var_info = self._compute_variance()
            variance = var_info["total"]

            # Cần N frame liên tục predict "fall" mới chuyển state
            # Tránh ngồi bị nhầm thành fall
            # Lấy góc và tư thế hiện tại
            torso_angle, thigh_angle = self._get_body_angles(landmarks)
            current_pose = self._classify_pose_from_angles(torso_angle, thigh_angle)
            
            self.angle_history.append(torso_angle)
            self.pose_history.append(current_pose)

            # Thuật toán "Bắt chặt" Té ngã đột ngột trong 1s:
            # Nếu 1s trước đang đứng thẳng (<25 độ) mà giờ đã nằm ngang (>60 độ)
            is_sudden_drop = False
            if len(self.angle_history) == self.angle_history.maxlen:
                if self.angle_history[0] < 25 and self.angle_history[-1] > 60:
                    is_sudden_drop = True

            # Kích hoạt trạng thái Té ngã
            model_conf_thr = 0.80
            if is_sudden_drop:
                # Nếu rơi quá nhanh, giảm ngưỡng tin cậy Model xuống để bắt kịp
                model_conf_thr = 0.40 

            # ── YOLO CHECK ──
            # Nếu đang ở trên giường/ghế, ta bỏ qua việc đếm fall_streak để tránh báo động giả
            self.is_on_furniture = self._check_furniture_collision(frame, landmarks)

            if label in ["fall", "unconscious", "seizure"] and conf > model_conf_thr:
                if self.is_on_furniture:
                    self.fall_streak = 0
                    if label == "fall": label = "on furniture"
                else:
                    # Đếm xem trong 2 giây qua có bao nhiêu khung hình là 'ngoi' (ngồi)
                sitting_frames = list(self.pose_history).count("ngoi")
                
                # Nếu đã ngồi một lúc rồi mới nằm, ưu tiên coi là đi ngủ/ngồi nghỉ
                # Ngoại trừ trường hợp rơi cực nhanh (is_sudden_drop)
                if sitting_frames > 15 and not is_sudden_drop:
                    self.fall_streak = 0
                    if label == "fall":
                        label = "di ngu (tu tu)"
                else:
                    # Kiểm tra số landmark đủ (>=15) để có dữ liệu toàn thân
                    if landmarks is not None and len(landmarks) >= 15:
                        if variance > self.THR_LOW:
                            self.fall_streak += 1
                        else:
                            self.fall_streak = 0
                    else:
                        self.fall_streak = 0
            else:
                self.fall_streak = 0

            # Kích hoạt trạng thái FALL_DETECTED
            # Nếu là rơi đột ngột, chỉ cần 3 frame thay vì 8
            required_streak = self.FALL_STREAK_REQUIRED
            if is_sudden_drop: required_streak = 3

            if self.fall_streak >= required_streak:
                self.state = State.FALL_DETECTED
                self.fall_start_time = time.time()
                self.played_audio = False
                self.fall_streak = 0
                prefix = "INSTANT FALL" if is_sudden_drop else "fall"
                return f"{prefix} (pending)", conf, landmarks, all_probs, self.state
                
            # (Đã loại bỏ cảnh báo co giật khi đang đứng/ngồi theo yêu cầu)

            # Nếu model nói "normal", dùng vector để phân biệt chi tiết
            if label == "normal":
                label = current_pose

            self.prev_label = label
            return label, conf, landmarks, all_probs, self.state

        elif self.state == State.FALL_DETECTED:
            elapsed = time.time() - self.fall_start_time
            
            # Kiểm tra trạng thái hiện tại
            label_check, conf_check, _ = self._model_predict()

            # Chỉ coi là "ngã giả" nếu Model báo 'normal' (an toàn) VÀ Vector xác nhận đã Đứng/Ngồi dậy liên tục trong 5-7s.
            if elapsed <= 3.0 and label_check == "normal":
                pose = self._classify_pose(landmarks)
                if pose in ["normal", "ngoi"]: 
                    self.recovery_streak += 1
                else:
                    self.recovery_streak = 0
                
                if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                    self.state = State.MONITORING
                    self.recovery_streak = 0
                    return f"{pose} (hoi phuc)", conf_check, landmarks, None, self.state
            else:
                # Nếu qua 3s mà vẫn ở FALL_DETECTED, reset streak nếu không đứng dậy
                pose = self._classify_pose(landmarks)
                if pose not in ["normal", "ngoi"]:
                    self.recovery_streak = 0

            # Sau 5s nếu vẫn đang ngã, phát Audio hỏi lần 1
            if elapsed >= 5.0 and not self.played_audio:
                self.played_audio = True
                def play_sound():
                    try:
                        import pygame
                        pygame.mixer.init()
                        pygame.mixer.music.load(r"c:\Users\dayla\ai\audio\canhbao_lan1.mp3")
                        pygame.mixer.music.play()
                    except: pass
                import threading
                threading.Thread(target=play_sound, daemon=True).start()

            # Tới mốc 10s mà vẫn chưa đứng thì huỷ việc cảnh cáo châm chước, chuyển sang POST_FALL gọi Web Alert
            if elapsed >= 10.0:
                self.state = State.POST_FALL

            return f"fall ({int(elapsed)}s)", 1.0, landmarks, self._compute_variance(), self.state

        elif self.state == State.POST_FALL:
            var_info = self._compute_variance()
            variance = var_info["total"]

            # Kiểm tra model predict tư thế hiện tại
            label_check, conf_check, _ = self._model_predict()

            # Chỉ coi là hồi phục nếu chuyển động mạnh VÀ phải thực sự Đứng/Ngồi dậy liên tục trong 5-7s.
            if variance > self.THR_NORMAL and label_check == "normal":
                pose = self._classify_pose(landmarks)
                if pose in ["normal", "ngoi"]:
                    self.recovery_streak += 1
                else:
                    self.recovery_streak = 0

                if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                    self.state = State.MONITORING
                    self.recovery_streak = 0
                    return f"{pose} (hoi phuc)", conf_check, landmarks, var_info, self.state
            else:
                # Nếu không duy trì tư thế đứng, reset đếm hồi phục
                pose = self._classify_pose(landmarks)
                if pose not in ["normal", "ngoi"]:
                    self.recovery_streak = 0

            # Phân loại độ co giật dựa trên variance (trong khi người này vẫn đang nằm dưới đất)
            if variance < self.THR_LOW:
                conf_unc = max(0.0, 1.0 - variance / self.THR_LOW)
                return "unconscious", conf_unc, landmarks, var_info, self.state
            elif variance > self.THR_HIGH:
                conf_sei = min(variance / self.THR_HIGH, 1.0)
                return "seizure", conf_sei, landmarks, var_info, self.state
            else:
                return "fall (quan sat)", 0.5, landmarks, var_info, self.state

        return "unknown", 0.0, landmarks, None, self.state


# ── Drawing ────────────────────────────────────────────────────

def draw_landmarks(frame, landmarks):
    if landmarks is None:
        return
    h, w, _ = frame.shape
    CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
        (9, 10), (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
        (11, 23), (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28),
        (27, 29), (28, 30), (29, 31), (30, 32), (15, 17), (15, 19), (15, 21),
        (16, 18), (16, 20), (16, 22), (17, 19), (18, 20),
    ]
    points = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for start, end in CONNECTIONS:
        if start < len(points) and end < len(points):
            cv2.line(frame, points[start], points[end], (0, 255, 128), 2)
    for pt in points:
        cv2.circle(frame, pt, 4, (0, 0, 255), -1)


def draw_variance_bars(frame, var_info, thr_low, thr_high):
    """Draw variance info on screen."""
    if var_info is None or not isinstance(var_info, dict) or "total" not in var_info:
        return

    bar_x = 10
    bar_y = 210
    bar_w = 180
    bar_h = 16

    items = [
        ("Total", var_info["total"], (200, 200, 200)),
        ("Arm",   var_info["arm"],   (0, 165, 255)),
        ("Leg",   var_info["leg"],   (255, 0, 255)),
        ("Torso", var_info["torso"], (0, 255, 128)),
    ]

    # Max scale for bar (set to 0.1 for visibility)
    max_val = 0.1

    for i, (name, val, color) in enumerate(items):
        y = bar_y + i * (bar_h + 6)
        # Background
        cv2.rectangle(frame, (bar_x, y), (bar_x + bar_w, y + bar_h), (40, 40, 40), -1)
        # Filled
        fill = int(bar_w * min(val / max_val, 1.0))
        cv2.rectangle(frame, (bar_x, y), (bar_x + fill, y + bar_h), color, -1)
        # Threshold lines
        thr_low_x = bar_x + int(bar_w * min(thr_low / max_val, 1.0))
        thr_high_x = bar_x + int(bar_w * min(thr_high / max_val, 1.0))
        cv2.line(frame, (thr_low_x, y), (thr_low_x, y + bar_h), (0, 255, 255), 1)
        cv2.line(frame, (thr_high_x, y), (thr_high_x, y + bar_h), (0, 0, 255), 1)
        # Text
        cv2.putText(frame, f"{name}: {val:.4f}", (bar_x + bar_w + 8, y + 13),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)


# ── Main ───────────────────────────────────────────────────────

if __name__ == "__main__":
    print("-> STAGE 1: Checking environment...")
    import sys
    print(f"-> Python Version: {sys.version}")
    
    print("-> STAGE 2: Importing Torch (this is a known hang point)...")
    import torch
    print(f"-> Torch Version: {torch.__version__}")
    
    # 1. Load Model
    print("-> STAGE 3: Loading model architecture...")
    from models.model_def import FallDetectionModel
    model = FallDetectionModel(input_size=99, num_classes=4)
    print("-> STAGE 4: Loading weights from disk...")
    model.load_state_dict(torch.load("models/best_model.pth", map_location="cpu"))
    model.eval()
    print("-> Model ready.")

    # 2. Load Label Map
    with open("models/label_map.json") as f:
        label_map = json.load(f)

    # 3. Create Fall Detector
    print("-> Initializing PoseLandmarker (this may take 10-20s)...")
    detector = FallDetector(model, label_map, n_frames=30)
    print("-> PoseLandmarker initialized.")

    # 4. Open Webcam
    print("=" * 50)
    print("  FALL DETECTION - Hybrid Mode")
    print("  Model: fall/normal | Pose: sitting/sleeping | Var: seizure")
    print("  Nhan 'q' de thoat")
    print("  Nhan 'c' de in variance ra console (calibrate)")
    print("=" * 50)

    print("-> Opening camera...")
    cap = cv2.VideoCapture(0)
    print("-> Camera object created.")
    
    # ── MÁY CHỦ TRUYỀN HÌNH ẢNH ẢO CHO WEB (FLASK MJPEG) ──
    try:
        from flask import Flask, Response
        import threading
        from flask_cors import CORS

        app = Flask(__name__)
        CORS(app)
        global_frame = None

        def generate_frames():
            global global_frame
            while True:
                if global_frame is None:
                    time.sleep(0.05)
                    continue
                ret, buffer = cv2.imencode('.jpg', global_frame)
                if not ret: continue
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

        @app.route('/video_feed')
        def video_feed():
            return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
        
        threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False), daemon=True).start()
    except ImportError:
        pass

    if cap.isOpened():
        print("====== DA KET NOI CAMERA LAPTOP THANH CONG ======")
        try:
            import winsound
            winsound.Beep(1000, 200)
            winsound.Beep(1000, 200)
        except ImportError:
            pass # Bỏ qua nếu không chạy trên Windows

    import requests
    import threading

    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera_id", type=str, help="ID của Camera trong Database")
    args = parser.parse_known_args()[0]

    # Tự động tìm ID của Camera mình vừa tạo trên Web NextJS để trỏ AI vào
    target_cam_id = args.camera_id if args.camera_id else "default_cam_id"
    if not args.camera_id:
        try:
            # Lưu ý: Endpoint này giờ yêu cầu JWT, nên Python script chạy độc lập sẽ bị 401
            # trừ khi ta cung cấp token hoặc dùng ID cố định qua CLI.
            res = requests.get("http://localhost:8080/api/v1/cameras", timeout=2)
            if res.status_code == 200:
                cam_list = res.json()
                if isinstance(cam_list, list) and len(cam_list) > 0:
                    target_cam_id = cam_list[-1]["id"] # Lấy camera tạo gần nhất
                    print(f"-> Lien ket truc tiep với Dashboard thanh cong! Dang stream cho: {cam_list[-1]['name']}")
            else:
                print(f"! Khong the tu dong lay ID camera (HTTP {res.status_code}). Vui long dung --camera_id <id>")
        except Exception as e:
            print(f"! Khong ket noi duoc Backend: {e}")

    def push_to_go(lbl, cnf):
        try:
            requests.post("http://localhost:8080/api/v1/ai-result", 
                json={
                    "CameraID": target_cam_id,
                    "ModelName": "Fall Detection Engine",
                    "Label": lbl,
                    "Confidence": float(cnf)
                }, 
                headers={"X-API-Key": "ai_secret_key_12345"},
                timeout=0.1)
        except: pass

    prev_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Không thể đọc frame từ webcam.")
            break

        # ── TỐI ƯU HÓA: Resize frame cho AI (Giảm tải CPU cực lớn) ──
        # Dùng ảnh nhỏ cho AI nhưng vẫn giữ ảnh gốc để hiển thị/stream
        small_frame = cv2.resize(frame, (640, 480))

        # 5. Predict
        t_loop_start = time.perf_counter()
        label, conf, landmarks, extra, state = detector.update(small_frame)
        t_loop_end = time.perf_counter()

        # ── DIAGNOSTIC: In log khi hệ thống bị chậm (< 10 FPS) ──
        loop_time_ms = (t_loop_end - t_loop_start) * 1000
        if loop_time_ms > 100: # Chậm hơn 10fps
            print(f"[PERF ALERT] Loop={loop_time_ms:.1f}ms | MP={detector.last_mp_time:.1f}ms | Torch={detector.last_torch_time:.1f}ms")

        # Chỉ gửi cảnh báo nếu là các trạng thái nguy hiểm (Fall, Unconscious, Seizure sau khi ngã)
        alert_labels = ["fall", "unconscious", "seizure"]
        is_alert = any(alert in label.lower() for alert in alert_labels)
        
        if is_alert and label != "waiting":
            threading.Thread(target=push_to_go, args=(label, conf)).start()

        # FPS
        curr_time = time.time()
        fps = 1 / max((curr_time - prev_time), 0.001)
        prev_time = curr_time

        # ── FIX: Resize landmarks ngược lại tỉ lệ ảnh gốc để hiển thị đúng ──
        # (MediaPipe trả về tỉ lệ 0.0-1.0 nên landmarks vẫn đúng tọa độ tương đối)
        draw_landmarks(frame, landmarks)

        # ── UI Overlay ──

        # State badge
        state_colors = {
            State.MONITORING: (0, 255, 0),
            State.FALL_DETECTED: (0, 165, 255),
            State.POST_FALL: (0, 0, 255),
        }
        state_color = state_colors.get(state, (200, 200, 200))
        cv2.putText(frame, f"State: {state}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, state_color, 2)

        # FPS
        cv2.putText(frame, f"FPS: {fps:.1f}", (frame.shape[1] - 140, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # Main label
        if label and label != "waiting":
            label_colors = {
                "normal": (0, 255, 0),
                "ngoi": (255, 255, 0),    # Cyan/Yellow
                "di ngu": (255, 128, 0),  # Orange
                "fall": (0, 0, 255),
                "unconscious": (0, 165, 255),
                "seizure": (255, 0, 255),
            }
            # Find base color
            color = (200, 200, 200)
            for key, c in label_colors.items():
                if key in label:
                    color = c
                    break

            text = f"{label} ({conf:.0%})"
            cv2.putText(frame, text, (10, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
            
            # Hiển thị tiến trình hồi phục nếu có
            if detector.recovery_streak > 0:
                prog = detector.recovery_streak / detector.RECOVERY_THRESHOLD
                cv2.putText(frame, f"RECOVERING: {prog:.0%}", (10, 100),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            # Hiển thị trạng thái YOLO
            if detector.yolo_enabled:
                yolo_text = "YOLO: ON"
                if detector.is_on_furniture: yolo_text += " (FURNITURE DETECTED)"
                cv2.putText(frame, yolo_text, (10, frame.shape[0] - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (38, 189, 248), 1)

        # Variance bars (only in POST_FALL state)
        if state == State.POST_FALL and isinstance(extra, dict) and "total" in extra:
            cv2.putText(frame, "Variance Monitor:", (10, 195),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            draw_variance_bars(frame, extra, detector.THR_LOW, detector.THR_HIGH)

        # Lưu bản sao hình ảnh hiện tại cho Web xem
        try:
            global_frame = frame.copy()
        except: pass

        cv2.imshow("Fall Detection - Hybrid", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("c"):
            # Calibrate: print variance to console
            if len(detector.buffer) == detector.n_frames:
                v = detector._compute_variance()
                print(f"[CALIBRATE] total={v['total']:.5f}  arm={v['arm']:.5f}  "
                      f"leg={v['leg']:.5f}  torso={v['torso']:.5f}")

    cap.release()
    cv2.destroyAllWindows()
