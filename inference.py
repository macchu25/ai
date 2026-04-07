import cv2
import numpy as np
import torch
import json
import time
from collections import deque
from models.model_def import FallDetectionModel

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
        self.fall_timer = 0
        self.fall_streak = 0  # Đếm số frame liên tục predict "fall"
        self.FALL_STREAK_REQUIRED = 3  # Cần 3 frame liên tục mới xác nhận fall
        self.FALL_CONFIRM_FRAMES = 30  # 1 giây @ 30fps
        self.prev_label = "normal"  # Label trước đó

        # Variance thresholds (calibrated)
        # Nằm yên: < 0.01 | Co giật: 0.01 ~ 0.03 | Bình thường: > 0.03
        self.THR_LOW = 0.01
        self.THR_HIGH = 0.02
        self.THR_NORMAL = 0.03  # Trên ngưỡng này = hoạt động bình thường

        # Setup PoseLandmarker (new tasks API)
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(
                model_asset_path="models/pose_landmarker_lite.task"
            ),
            running_mode=RunningMode.VIDEO,
            num_poses=1,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)
        self.frame_ts = 0

    def extract_keypoints(self, frame):
        """Extract 33 pose landmarks (x, y, z) = 99 features."""
        image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB),
        )
        self.frame_ts += 33
        result = self.landmarker.detect_for_video(image, self.frame_ts)

        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            keypoints = []
            for lm in result.pose_landmarks[0]:
                keypoints.extend([lm.x, lm.y, lm.z])
            return np.array(keypoints), result.pose_landmarks[0]
        return np.zeros(99), None

    def _model_predict(self):
        input_tensor = torch.tensor(
            np.array(self.buffer), dtype=torch.float32
        ).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(input_tensor), dim=1)[0]
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

            # Cần N frame liên tục predict "fall" mới chuyển state
            # Tránh ngồi bị nhầm thành fall
            if label == "fall" and conf > 0.6:
                self.fall_streak += 1
            else:
                self.fall_streak = 0

            if self.fall_streak >= self.FALL_STREAK_REQUIRED:
                # Chỉ chuyển FALL nếu trước đó đang "normal" (có transition thật)
                self.state = State.FALL_DETECTED
                self.fall_timer = 0
                self.fall_streak = 0
                return "fall", conf, landmarks, all_probs, self.state

            self.prev_label = label
            return label, conf, landmarks, all_probs, self.state

        elif self.state == State.FALL_DETECTED:
            self.fall_timer += 1

            if self.fall_timer < self.FALL_CONFIRM_FRAMES:
                return "fall (xác nhận...)", 0.0, landmarks, None, self.state

            # Chuyển sang POST_FALL
            self.state = State.POST_FALL

        if self.state == State.POST_FALL:
            var_info = self._compute_variance()
            variance = var_info["total"]

            # Variance > 0.03 = hoạt động bình thường → quay lại MONITORING
            if variance > self.THR_NORMAL:
                self.state = State.MONITORING
                return "normal", 0.9, landmarks, var_info, self.state

            # Kiểm tra model predict normal (người đứng dậy)
            label_check, conf_check, _ = self._model_predict()
            if label_check == "normal" and conf_check > 0.7:
                self.state = State.MONITORING
                return "normal (hồi phục)", conf_check, landmarks, None, self.state

            # Phân loại bằng variance
            if variance < self.THR_LOW:
                conf_unc = max(0.0, 1.0 - variance / self.THR_LOW)
                return "unconscious", conf_unc, landmarks, var_info, self.state
            elif variance > self.THR_HIGH:
                conf_sei = min(variance / self.THR_HIGH, 1.0)
                return "seizure", conf_sei, landmarks, var_info, self.state
            else:
                return "fall (quan sát)", 0.5, landmarks, var_info, self.state

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
    # 1. Load Model
    model = FallDetectionModel(input_size=99, num_classes=4)
    model.load_state_dict(torch.load("models/best_model.pth", map_location="cpu"))
    model.eval()

    # 2. Load Label Map
    with open("models/label_map.json") as f:
        label_map = json.load(f)

    # 3. Create Fall Detector
    detector = FallDetector(model, label_map, n_frames=30)

    # 4. Open Webcam
    print("=" * 50)
    print("  FALL DETECTION - Hybrid Mode")
    print("  Model: fall/normal | Variance: unconscious/seizure")
    print("  Nhấn 'q' để thoát")
    print("  Nhấn 'c' để in variance ra console (calibrate)")
    print("=" * 50)

    cap = cv2.VideoCapture(0)
    prev_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Không thể đọc frame từ webcam.")
            break

        # 5. Predict
        label, conf, landmarks, extra, state = detector.update(frame)

        # FPS
        curr_time = time.time()
        fps = 1 / max((curr_time - prev_time), 0.001)
        prev_time = curr_time

        # Draw skeleton
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

        # Variance bars (only in POST_FALL state)
        if state == State.POST_FALL and isinstance(extra, dict) and "total" in extra:
            cv2.putText(frame, "Variance Monitor:", (10, 195),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            draw_variance_bars(frame, extra, detector.THR_LOW, detector.THR_HIGH)

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
