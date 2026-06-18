import cv2
import numpy as np
import time
import json
import requests
import threading
import os
from collections import deque

import torch
torch.set_num_threads(1)
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)

from dotenv import load_dotenv
load_dotenv()

# Cấu hình API Endpoint (Mặc định trỏ về local, có thể ghi đè qua biến môi trường BACKEND_URL)
API_BASE = os.getenv("BACKEND_URL", "http://localhost:8080/api/v1")


# ── State Machine ──────────────────────────────────────────────
class State:
    MONITORING = "monitoring"
    FALL_DETECTED = "fall_detected"
    POST_FALL = "post_fall"


# ── Keypoint group indices ─────────────────────────────────────
ARM_IDX = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
LEG_IDX = [25, 26, 27, 28, 29, 30, 31, 32]
TORSO_IDX = [11, 12, 23, 24]


class TrackedPerson:
    def __init__(self, person_id, model, label_map, n_frames=30):
        self.person_id = person_id
        self.model = model
        self.label_map = label_map
        self.n_frames = n_frames
        self.buffer = deque(maxlen=n_frames)

        # State machine
        self.state = State.MONITORING
        self.fall_start_time = 0
        self.played_audio = False
        self.fall_streak = 0  # Đếm số frame liên tục predict "fall"
        self.FALL_STREAK_REQUIRED = 12  # Tăng lên 12 frame (1.2s) để tăng độ ổn định, tránh báo động giả
        self.pose_history = deque(maxlen=60) # Lưu 2 giây lịch sử tư thế
        self.angle_history = deque(maxlen=30) # Lưu 1 giây lịch sử góc lưng
        self.recovery_streak = 0 # Đếm số frame thực sự hồi phục liên tục
        self.RECOVERY_THRESHOLD = 20 # Cần 2 giây (10fps sau chia 3) để xác nhận hồi phục
        self.prev_label = "normal"  # Label trước đó
        self.last_seen_time = time.time()
        self.centroid = None  # (x, y)

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
        if torso_angle > 65: 
            if thigh_angle < 35:
                return "cui nguoi" # Thân gập nhưng đùi đứng thẳng => cúi người
            return "di ngu" # Cả thân và đùi nằm ngang => nằm đất
        if torso_angle < 55:
            if thigh_angle > 45: return "ngoi"
            else: return "normal"
        return "normal"

    def _classify_pose(self, landmarks):
        t, th = self._get_body_angles(landmarks)
        return self._classify_pose_from_angles(t, th)

    def _model_predict(self):
        input_tensor = torch.tensor(
            np.array(self.buffer), dtype=torch.float32
        ).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(input_tensor), dim=1)[0]
        
        pred_idx = probs.argmax().item()
        conf = probs[pred_idx].item()
        label = self.label_map[str(pred_idx)]
        
        # Map "unconscious" and "seizure" to "fall"
        if label in ["unconscious", "seizure"]:
            label = "fall"
            
        all_probs = {self.label_map[str(i)]: probs[i].item() for i in range(len(probs))}
        return label, conf, all_probs

    def update(self, keypoints, landmarks, is_on_furniture):
        self.last_seen_time = time.time()
        
        # Cập nhật centroid của torso
        if landmarks is not None and len(landmarks) > 24:
            s_mid_x = (landmarks[11].x + landmarks[12].x) / 2
            s_mid_y = (landmarks[11].y + landmarks[12].y) / 2
            h_mid_x = (landmarks[23].x + landmarks[24].x) / 2
            h_mid_y = (landmarks[23].y + landmarks[24].y) / 2
            self.centroid = ((s_mid_x + h_mid_x) / 2, (s_mid_y + h_mid_y) / 2)
        else:
            xs = [keypoints[i] for i in range(0, len(keypoints), 3)]
            ys = [keypoints[i+1] for i in range(0, len(keypoints), 3)]
            self.centroid = (float(np.mean(xs)), float(np.mean(ys)))

        self.buffer.append(keypoints)

        if len(self.buffer) < self.n_frames:
            # Nếu bộ đệm chưa đầy, sử dụng phân tích hình học tức thì để xác định trạng thái an toàn
            pose = self._classify_pose(landmarks)
            if pose in ["normal", "ngoi", "cui nguoi"]:
                return pose, 1.0, landmarks, None, self.state
            return "waiting", 0.0, landmarks, None, self.state

        # ── STATE MACHINE ──────────────────────────────────────

        if self.state == State.MONITORING:
            label, conf, all_probs = self._model_predict()
            
            torso_angle, thigh_angle = self._get_body_angles(landmarks)
            current_pose = self._classify_pose_from_angles(torso_angle, thigh_angle)
            
            self.angle_history.append(torso_angle)
            self.pose_history.append(current_pose)

            # Thuật toán "Bắt chặt" Té ngã đột ngột trong 1s:
            is_sudden_drop = False
            if len(self.angle_history) == self.angle_history.maxlen:
                if self.angle_history[0] < 25 and self.angle_history[-1] > 65:
                    is_sudden_drop = True

            # Kích hoạt trạng thái Té ngã
            model_conf_thr = 0.85
            if is_sudden_drop:
                model_conf_thr = 0.70 

            if label in ["fall"] and conf > model_conf_thr:
                if is_on_furniture:
                    self.fall_streak = 0
                    if label == "fall": label = "on furniture"
                elif current_pose == "cui nguoi":
                    self.fall_streak = 0
                    if label == "fall": label = "cui nguoi"
                else:
                    sitting_frames = list(self.pose_history).count("ngoi")
                    
                    if sitting_frames > 15 and not is_sudden_drop:
                        self.fall_streak = 0
                        if label == "fall":
                            label = "di ngu (tu tu)"
                    else:
                        self.fall_streak += 1
            else:
                self.fall_streak = 0

            # Kích hoạt trạng thái FALL_DETECTED
            required_streak = self.FALL_STREAK_REQUIRED
            if is_sudden_drop: required_streak = 7

            if self.fall_streak >= required_streak:
                self.state = State.FALL_DETECTED
                self.fall_start_time = time.time()
                self.played_audio = False
                self.fall_streak = 0
                prefix = "INSTANT FALL" if is_sudden_drop else "fall"
                return f"{prefix} (pending)", conf, landmarks, all_probs, self.state
                
            if label == "normal":
                label = current_pose

            self.prev_label = label
            return label, conf, landmarks, all_probs, self.state

        elif self.state == State.FALL_DETECTED:
            elapsed = time.time() - self.fall_start_time
            
            label_check, conf_check, _ = self._model_predict()

            pose = self._classify_pose(landmarks)
            if pose in ["normal", "ngoi", "cui nguoi"]: 
                self.recovery_streak += 1
            else:
                self.recovery_streak = 0
            
            if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                self.state = State.MONITORING
                self.recovery_streak = 0
                return f"{pose} (hoi phuc)", conf_check, landmarks, None, self.state

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

            if elapsed >= 10.0:
                self.state = State.POST_FALL

            return f"fall ({int(elapsed)}s)", 1.0, landmarks, None, self.state

        elif self.state == State.POST_FALL:
            label_check, conf_check, _ = self._model_predict()

            pose = self._classify_pose(landmarks)
            if pose in ["normal", "ngoi", "cui nguoi"]: 
                self.recovery_streak += 1
            else:
                self.recovery_streak = 0
            
            if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                self.state = State.MONITORING
                self.recovery_streak = 0
                return f"{pose} (hoi phuc)", conf_check, landmarks, None, self.state

            return "fall", 1.0, landmarks, None, self.state

        return "unknown", 0.0, landmarks, None, self.state


class FallDetector:
    def __init__(self, model, label_map, n_frames=30):
        self.model = model
        self.label_map = label_map
        self.n_frames = n_frames
        
        self.tracked_people = {}
        self.next_person_id = 1
        self.max_people = 1
        
        self.last_mp_time = 0
        self.last_torch_time = 0

        print("   [DEBUG] Configuring Mediapipe tasks for multi-pose tracking...")
        try:
            print("   [DEBUG] Mediapipe tasks configured.")

            options = PoseLandmarkerOptions(
                base_options=BaseOptions(
                    model_asset_path="models/pose_landmarker_lite.task"
                ),
                running_mode=RunningMode.VIDEO,
                num_poses=self.max_people,
                min_pose_detection_confidence=0.5,
                min_pose_presence_confidence=0.5,
                min_tracking_confidence=0.5,
            )
            print("   [DEBUG] Creating PoseLandmarker from options...")
            self.landmarker = PoseLandmarker.create_from_options(options)
            print("   [DEBUG] PoseLandmarker created.")
        except Exception as e:
            print(f"   [ERROR] Failed to init PoseLandmarker: {e}")
            self.landmarker = None
        self.frame_ts = 0

        self.yolo_enabled = False
        self.yolo_model = None
        self.furniture_classes = [56, 57, 59, 60] # chair, couch, bed, dining table
        self.is_on_furniture = False
        self.current_yolo_results = None
        
        threading.Thread(target=self._poll_model_status, daemon=True).start()

    def _poll_model_status(self):
        """Hỏi Backend xem các model có được bật không."""
        api_base = API_BASE
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
                                try:
                                    from ultralytics import YOLO
                                    print("   [AI] YOLO Furniture Detector ACTIVATED.")
                                    self.yolo_model = YOLO("yolo11n.pt")
                                    self.yolo_enabled = True
                                except (ImportError, ModuleNotFoundError):
                                    print("   [WARN] Không thể kích hoạt YOLO Furniture Detector vì thiếu thư viện 'ultralytics'.")
                                    print("          Vui lòng cài đặt bằng lệnh: pip install ultralytics")
                                    # Tránh spam log liên tục bằng cách set tạm thời yolo_enabled về False
                                    self.yolo_enabled = False
                            elif not is_active and self.yolo_enabled:
                                print("   [AI] YOLO Furniture Detector DEACTIVATED.")
                                self.yolo_enabled = False
                                self.yolo_model = None
            except Exception as e:
                # Tránh in log lỗi lặp lại nếu chỉ là lỗi thiếu import đã được handle ở trên
                if "No module named 'ultralytics'" not in str(e):
                    print(f"   [WARN] Failed to poll model status: {e}")
            
            time.sleep(5)

    def _check_furniture_collision(self, landmarks):
        """Kiểm tra xem người có đang ở trên giường/ghế không."""
        if not self.yolo_enabled or self.current_yolo_results is None or landmarks is None:
            return False
            
        px = (landmarks[23].x + landmarks[24].x) / 2
        py = (landmarks[23].y + landmarks[24].y) / 2
        
        for box in self.current_yolo_results.boxes:
            cls = int(box.cls[0])
            if cls in self.furniture_classes:
                x1, y1, x2, y2 = box.xyxyn[0].tolist()
                margin = 0.05
                if (x1-margin) < px < (x2+margin) and (y1-margin) < py < (y2+margin):
                    return True
        return False


    def extract_multi_keypoints(self, frame):
        """Trích xuất tối đa 3 tư thế landmarks từ ảnh."""
        t_start = time.perf_counter()
        image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB),
        )
        self.frame_ts += 33
        if self.landmarker is None: return []
        try:
            result = self.landmarker.detect_for_video(image, self.frame_ts)
        except Exception as e:
            return []
        
        self.last_mp_time = (time.perf_counter() - t_start) * 1000

        detected_poses = []
        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            for raw_landmarks in result.pose_landmarks:
                # Sắp xếp độ tin cậy của các khớp từ cao xuống thấp
                visibilities = sorted([lm.visibility for lm in raw_landmarks], reverse=True)
                # Lấy trung bình của 10 khớp xương rõ nhất (giúp giữ liên kết ổn định khi ngồi nghiêng hoặc bị che khuất một phía)
                top_visibility = sum(visibilities[:10]) / 10 if len(visibilities) >= 10 else 0.0
                
                # Cột nhà hoặc nhiễu tĩnh sẽ không có điểm nào đạt độ tin cậy cao (tất cả các điểm đều thấp < 30%)
                if top_visibility < 0.53:
                    continue
                
                keypoints = []
                for lm in raw_landmarks:
                    keypoints.extend([lm.x, lm.y, lm.z])
                detected_poses.append((np.array(keypoints), raw_landmarks))
        return detected_poses

    def update(self, frame):
        detected_poses = self.extract_multi_keypoints(frame)
        current_time = time.time()
        
        # Chạy YOLO một lần duy nhất cho toàn bộ frame để tối ưu hiệu năng
        self.current_yolo_results = None
        if self.yolo_enabled and self.yolo_model is not None and len(detected_poses) > 0:
            t_start = time.perf_counter()
            self.current_yolo_results = self.yolo_model(frame, verbose=False)[0]
            self.last_torch_time = (time.perf_counter() - t_start) * 1000
        
        detected_centroids = []
        for keypoints, landmarks in detected_poses:
            if landmarks is not None and len(landmarks) > 24:
                s_mid_x = (landmarks[11].x + landmarks[12].x) / 2
                s_mid_y = (landmarks[11].y + landmarks[12].y) / 2
                h_mid_x = (landmarks[23].x + landmarks[24].x) / 2
                h_mid_y = (landmarks[23].y + landmarks[24].y) / 2
                centroid = ((s_mid_x + h_mid_x) / 2, (s_mid_y + h_mid_y) / 2)
            else:
                xs = [keypoints[i] for i in range(0, len(keypoints), 3)]
                ys = [keypoints[i+1] for i in range(0, len(keypoints), 3)]
                centroid = (float(np.mean(xs)), float(np.mean(ys)))
            detected_centroids.append(centroid)

        unmatched_detections = list(range(len(detected_poses)))
        matched_people = {}

        DIST_THRESHOLD = 0.45

        for pid, person in list(self.tracked_people.items()):
            if person.centroid is None:
                continue
            best_dist = float('inf')
            best_idx = -1
            for idx in unmatched_detections:
                det_centroid = detected_centroids[idx]
                dist = np.sqrt((person.centroid[0] - det_centroid[0])**2 + (person.centroid[1] - det_centroid[1])**2)
                if dist < best_dist:
                    best_dist = dist
                    best_idx = idx

            if best_idx != -1 and best_dist < DIST_THRESHOLD:
                matched_people[pid] = best_idx
                unmatched_detections.remove(best_idx)

        results = []
        any_on_furniture = False

        for pid, idx in matched_people.items():
            keypoints, landmarks = detected_poses[idx]
            person = self.tracked_people[pid]
            is_on_furniture = self._check_furniture_collision(landmarks)
            if is_on_furniture:
                any_on_furniture = True
            label, conf, landmarks, all_probs, state = person.update(keypoints, landmarks, is_on_furniture)
            results.append((label, conf, landmarks, all_probs, state, pid))

        for idx in unmatched_detections:
            keypoints, landmarks = detected_poses[idx]
            if len(self.tracked_people) < self.max_people:
                pid = self.next_person_id
                self.next_person_id += 1
                person = TrackedPerson(pid, self.model, self.label_map, self.n_frames)
                is_on_furniture = self._check_furniture_collision(landmarks)
                if is_on_furniture:
                    any_on_furniture = True
                label, conf, landmarks, all_probs, state = person.update(keypoints, landmarks, is_on_furniture)
                self.tracked_people[pid] = person
                results.append((label, conf, landmarks, all_probs, state, pid))

        self.is_on_furniture = any_on_furniture

        stale_pids = []
        for pid, person in list(self.tracked_people.items()):
            if pid not in matched_people:
                if current_time - person.last_seen_time > 3.0:
                    stale_pids.append(pid)

        for pid in stale_pids:
            del self.tracked_people[pid]

        return results



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





# ── Main ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import requests
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera_id", type=str, help="ID của Camera trong Database")
    parser.add_argument("--source", type=str, default=None, help="Nguồn video (0: webcam, hoặc RTSP URL, hoặc file video)")
    parser.add_argument("--headless", action="store_true", help="Chạy không có giao diện hiển thị GUI")
    parser.add_argument("--port", type=int, default=5000, help="Cổng chạy server MJPEG stream")
    args = parser.parse_known_args()[0]

    # Tự động tìm ID của Camera mình vừa tạo trên Web NextJS để trỏ AI vào
    target_cam_id = args.camera_id if args.camera_id else "default_cam_id"
    try:
        # Gọi API lấy danh sách camera kèm X-API-Key bảo mật
        headers = {"X-API-Key": "ai_secret_key_12345"}
        res = requests.get(f"{API_BASE}/cameras", headers=headers, timeout=2)
        if res.status_code == 200:
            cam_list = res.json()
            selected_cam = None
            if args.camera_id:
                # Tìm camera theo ID được truyền vào
                selected_cam = next((c for c in cam_list if c.get("id") == args.camera_id), None)
            else:
                # Tự động tìm camera có cấu hình RTSP URL hợp lệ đầu tiên
                for cam in cam_list:
                    rtsp_val = cam.get("rtsp_url")
                    if rtsp_val and rtsp_val != "webcam" and rtsp_val.startswith("rtsp://"):
                        selected_cam = cam
                        break
                if not selected_cam and isinstance(cam_list, list) and len(cam_list) > 0:
                    selected_cam = cam_list[-1]
            
            if selected_cam:
                target_cam_id = selected_cam["id"]
                print(f"-> Lien ket truc tiep voi Dashboard thanh cong! Dang stream cho: {selected_cam.get('name')}")
                
            # Xác định nguồn video: ưu tiên tham số dòng lệnh nếu có truyền vào
            if args.source is None:
                if selected_cam and selected_cam.get("rtsp_url") and selected_cam.get("rtsp_url") != "webcam":
                    args.source = selected_cam["rtsp_url"]
                    print(f"-> Tu dong phat hien nguon RTSP camera tu database: {args.source}")
                else:
                    args.source = "0"
                    print("-> Mac dinh su dung webcam local (0)")
            else:
                print(f"-> Su dung nguon video chi dinh tu dong lenh: {args.source}")
        else:
            print(f"! Khong the lay thong tin camera (HTTP {res.status_code}).")
            if args.source is None:
                args.source = "0"
    except Exception as e:
        print(f"! Khong ket noi duoc Backend hoac lay thong tin camera: {e}")
        if args.source is None:
            args.source = "0"

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

    # ── TỐI ƯU: Lớp đọc Webcam bằng luồng riêng để xóa bỏ độ trễ bộ đệm (0ms Latency) ──
    class VideoStream:
        def __init__(self, src=0):
            self.stream = cv2.VideoCapture(src)
            self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1) # Giới hạn bộ đệm tối thiểu
            (self.grabbed, self.frame) = self.stream.read()
            self.stopped = False
            self.t = threading.Thread(target=self.update, args=(), daemon=True)

        def start(self):
            self.t.start()
            return self

        def update(self):
            while not self.stopped:
                (self.grabbed, self.frame) = self.stream.read()

        def read(self):
            return self.grabbed, self.frame

        def isOpened(self):
            return self.stream.isOpened()

        def stop(self):
            self.stopped = True
            self.stream.release()

    print("-> Opening camera with Threaded Stream...")
    src = args.source
    if src.isdigit():
        src = int(src)
    cap = VideoStream(src=src).start()
    print(f"-> Camera Thread started on source: {src}")
    
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
                if not ret: 
                    time.sleep(0.033)
                    continue
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                time.sleep(0.033)  # Giới hạn 30 FPS để không làm nghẽn luồng ffmpeg

        @app.route('/video_feed')
        def video_feed():
            return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
        
        threading.Thread(target=lambda: app.run(host='0.0.0.0', port=args.port, debug=False, use_reloader=False), daemon=True).start()
    except ImportError:
        pass

    if cap.isOpened():
        print("====== DA KET NOI CAMERA THANH CONG ======")
        try:
            import winsound
            winsound.Beep(1000, 200)
            winsound.Beep(1000, 200)
        except ImportError:
            pass # Bỏ qua nếu không chạy trên Windows

    import requests
    import threading
    import queue

    request_queue = queue.Queue()

    def web_sender_worker():
        session = requests.Session()
        while True:
            try:
                url, payload, headers, timeout = request_queue.get()
                try:
                    session.post(url, json=payload, headers=headers, timeout=timeout)
                except:
                    pass
                request_queue.task_done()
            except Exception:
                time.sleep(0.1)

    threading.Thread(target=web_sender_worker, daemon=True).start()

    def push_to_go(lbl, cnf, img_frame=None):
        try:
            payload = {
                "CameraID": target_cam_id,
                "ModelName": "Fall Detection Engine",
                "Label": lbl,
                "Confidence": float(cnf)
            }
            if img_frame is not None:
                import base64
                ret, jpeg_buffer = cv2.imencode('.jpg', img_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if ret:
                    payload["EvidenceImage"] = base64.b64encode(jpeg_buffer).decode('utf-8')
            
            request_queue.put((
                f"{API_BASE}/ai-result",
                payload,
                {"X-API-Key": "ai_secret_key_12345"},
                2.0
            ))
        except: pass

    prev_time = time.time()

    frame_count = 0
    last_pushed_is_alert = False
    last_results = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame is None or frame.size == 0:
            time.sleep(0.03)
            continue

        frame_count += 1
        
        # ── TỐI ƯU HÓA: Chỉ chạy AI mỗi 3 frame để Video chạy mượt 30 FPS ──
        if frame_count % 3 == 0:
            try:
                small_frame = cv2.resize(frame, (640, 480))
            except Exception as e:
                print(f"[WARN] Failed to resize frame: {e}")
                continue
            
            t_loop_start = time.perf_counter()
            results = detector.update(small_frame)
            t_loop_end = time.perf_counter()

            loop_time_ms = (t_loop_end - t_loop_start) * 1000
            if loop_time_ms > 150: # Chậm hơn 6fps
                print(f"[PERF ALERT] Loop={loop_time_ms:.1f}ms | MP={detector.last_mp_time:.1f}ms | Torch={detector.last_torch_time:.1f}ms")

            # Chỉ gửi cảnh báo nếu là các trạng thái nguy hiểm
            any_alert_this_frame = False
            for label, conf, landmarks, all_probs, state, pid in results:
                alert_labels = ["fall"]
                is_alert = any(alert in label.lower() for alert in alert_labels)
                
                if is_alert and label != "waiting":
                    any_alert_this_frame = True
                    frame_copy = small_frame.copy() if small_frame is not None else None
                    alert_label = f"Person {pid} Fall"
                    
                    now = time.time()
                    # Chỉ gửi gói ngã tối đa 1 lần mỗi 0.5 giây để tránh quá tải mạng/CPU của backend, trừ phi là gói đầu tiên
                    if not last_pushed_is_alert or (now - last_pushed_time >= 0.5):
                        last_pushed_time = now
                        push_to_go(alert_label, conf, frame_copy)
            
            # GỬI LỆNH CLEAR ALERT KHI NẠN NHÂN ĐÃ HỒI PHỤC/BÌNH THƯỜNG
            if not any_alert_this_frame and last_pushed_is_alert:
                print("   [AI] Người dùng đã bình thường. Gửi lệnh reset cảnh báo về backend.")
                last_pushed_time = 0.0
                push_to_go("normal", 1.0, None)
                
            last_pushed_is_alert = any_alert_this_frame
            last_results = results

        # Áp dụng kết quả AI gần nhất để vẽ lên hình
        for label, conf, landmarks, all_probs, state, pid in last_results:
            draw_landmarks(frame, landmarks)
            
            # Vẽ nhãn cho từng người ngay trên đầu của họ
            if landmarks is not None and len(landmarks) > 0:
                h, w, _ = frame.shape
                head_x = int(landmarks[0].x * w)
                head_y = int(landmarks[0].y * h) - 20
                
                color = (0, 255, 0)
                if "fall" in label.lower():
                    color = (0, 0, 255)
                elif "ngoi" in label.lower():
                    color = (255, 255, 0)
                elif "di ngu" in label.lower():
                    color = (255, 128, 0)
                
                text = f"P{pid}: {label} ({conf:.0%})"
                cv2.putText(frame, text, (max(10, head_x - 50), max(20, head_y)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2, cv2.LINE_AA)


        # FPS
        curr_time = time.time()
        fps = 1 / max((curr_time - prev_time), 0.001)
        prev_time = curr_time

        # ── UI Overlay ──
        
        # Đồng hồ thời gian thực (Góc dưới bên phải)
        from datetime import datetime
        time_str = datetime.now().strftime("%H:%M:%S")
        cv2.putText(frame, time_str, (frame.shape[1] - 140, frame.shape[0] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        # Trạng thái tổng quát của detector
        cv2.putText(frame, f"Tracking: {len(last_results)} pose(s)", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # FPS
        cv2.putText(frame, f"FPS: {fps:.1f}", (frame.shape[1] - 140, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # Hiển thị trạng thái YOLO
        if detector.yolo_enabled:
            yolo_text = "YOLO: ON"
            if detector.is_on_furniture: yolo_text += " (FURNITURE DETECTED)"
            cv2.putText(frame, yolo_text, (10, frame.shape[0] - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (38, 189, 248), 1)



        # Lưu bản sao hình ảnh hiện tại cho Web xem
        try:
            # Thu nhỏ ảnh xuống 640x480 để giảm tải CPU khi mã hóa JPEG truyền về Web
            global_frame = cv2.resize(frame, (640, 480))
        except: pass

        if not args.headless:
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
        else:
            # Chế độ chạy ẩn (headless): nghỉ nhẹ 30ms để tránh vòng lặp quá nhanh gây quá tải CPU
            time.sleep(0.03)

    cap.stop() if hasattr(cap, 'stop') else cap.release()
    if not args.headless:
        cv2.destroyAllWindows()
