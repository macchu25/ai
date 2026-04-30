import cv2
import numpy as np
import time
import os
import torch
import mediapipe as mp
from collections import deque
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import (
    PoseLandmarker,
    PoseLandmarkerOptions,
    RunningMode,
)

# ── Keypoint group indices ─────────────────────────────────────
ARM_IDX = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
LEG_IDX = [25, 26, 27, 28, 29, 30, 31, 32]
TORSO_IDX = [11, 12, 23, 24]

class State:
    MONITORING = "monitoring"
    FALL_DETECTED = "fall_detected"
    POST_FALL = "post_fall"

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
        self.fall_streak = 0
        self.FALL_STREAK_REQUIRED = 8
        self.pose_history = deque(maxlen=60)
        self.angle_history = deque(maxlen=30)
        self.recovery_streak = 0
        self.RECOVERY_THRESHOLD = 180
        self.prev_label = "normal"

        self.THR_LOW = 0.01
        self.THR_HIGH = 0.02
        self.THR_NORMAL = 0.03

        self.last_mp_time = 0
        self.last_torch_time = 0
        self.frame_ts = 0

        # Setup PoseLandmarker
        try:
            options = PoseLandmarkerOptions(
                base_options=BaseOptions(model_asset_path="models/pose_landmarker_lite.task"),
                running_mode=RunningMode.VIDEO,
                num_poses=1,
            )
            self.landmarker = PoseLandmarker.create_from_options(options)
        except Exception as e:
            print(f"   [ERROR] Failed to init PoseLandmarker: {e}")
            self.landmarker = None

    def _get_body_angles(self, landmarks):
        if landmarks is None or len(landmarks) < 27:
            return 0.0, 0.0
        try:
            s_mid_x = (landmarks[11].x + landmarks[12].x) / 2
            s_mid_y = (landmarks[11].y + landmarks[12].y) / 2
            h_mid_x = (landmarks[23].x + landmarks[24].x) / 2
            h_mid_y = (landmarks[23].y + landmarks[24].y) / 2
            dx, dy = h_mid_x - s_mid_x, h_mid_y - s_mid_y
            torso_angle = abs(np.degrees(np.arctan2(dx, dy)))

            k_mid_x = (landmarks[25].x + landmarks[26].x) / 2
            k_mid_y = (landmarks[25].y + landmarks[26].y) / 2
            dkx, dky = k_mid_x - h_mid_x, k_mid_y - h_mid_y
            thigh_angle = abs(np.degrees(np.arctan2(dkx, dky)))
            return torso_angle, thigh_angle
        except: return 0.0, 0.0

    def _classify_pose_from_angles(self, torso_angle, thigh_angle):
        if torso_angle > 45: return "di ngu"
        if torso_angle < 30:
            if thigh_angle > 50: return "ngoi"
            else: return "normal"
        return "normal"

    def _classify_pose(self, landmarks):
        t, th = self._get_body_angles(landmarks)
        return self._classify_pose_from_angles(t, th)

    def extract_keypoints(self, frame):
        t_start = time.perf_counter()
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        self.frame_ts += 33
        if self.landmarker is None: return np.zeros(99), None
        try:
            result = self.landmarker.detect_for_video(image, self.frame_ts)
        except:
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
        input_tensor = torch.tensor(np.array(self.buffer), dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(input_tensor), dim=1)[0]
        
        self.last_torch_time = (time.perf_counter() - t_start) * 1000
        pred_idx = probs.argmax().item()
        conf = probs[pred_idx].item()
        label = self.label_map[str(pred_idx)]
        all_probs = {self.label_map[str(i)]: probs[i].item() for i in range(len(probs))}
        return label, conf, all_probs

    def _compute_variance(self):
        buffer_np = np.array(self.buffer)
        std_per_feature = np.std(buffer_np, axis=0)
        total = float(np.mean(std_per_feature))
        arm_feats = [i * 3 + j for i in ARM_IDX for j in range(3)]
        leg_feats = [i * 3 + j for i in LEG_IDX for j in range(3)]
        torso_feats = [i * 3 + j for i in TORSO_IDX for j in range(3)]
        return {
            "total": total,
            "arm": float(np.mean(std_per_feature[arm_feats])),
            "leg": float(np.mean(std_per_feature[leg_feats])),
            "torso": float(np.mean(std_per_feature[torso_feats])),
        }

    def update(self, frame):
        keypoints, landmarks = self.extract_keypoints(frame)
        self.buffer.append(keypoints)
        if len(self.buffer) < self.n_frames:
            return "waiting", 0.0, landmarks, None, self.state

        if self.state == State.MONITORING:
            label, conf, all_probs = self._model_predict()
            var_info = self._compute_variance()
            variance = var_info["total"]
            torso_angle, thigh_angle = self._get_body_angles(landmarks)
            current_pose = self._classify_pose_from_angles(torso_angle, thigh_angle)
            self.angle_history.append(torso_angle)
            self.pose_history.append(current_pose)

            is_sudden_drop = len(self.angle_history) == self.angle_history.maxlen and self.angle_history[0] < 25 and self.angle_history[-1] > 60
            model_conf_thr = 0.40 if is_sudden_drop else 0.80

            if label in ["fall", "unconscious", "seizure"] and conf > model_conf_thr:
                sitting_frames = list(self.pose_history).count("ngoi")
                if sitting_frames > 15 and not is_sudden_drop:
                    self.fall_streak = 0
                    if label == "fall": label = "di ngu (tu tu)"
                else:
                    if landmarks is not None and len(landmarks) >= 15 and variance > self.THR_LOW:
                        self.fall_streak += 1
                    else:
                        self.fall_streak = 0
            else:
                self.fall_streak = 0

            required_streak = 3 if is_sudden_drop else self.FALL_STREAK_REQUIRED
            if self.fall_streak >= required_streak:
                self.state = State.FALL_DETECTED
                self.fall_start_time = time.time()
                self.played_audio = False
                self.fall_streak = 0
                return f"{'INSTANT FALL' if is_sudden_drop else 'fall'} (pending)", conf, landmarks, all_probs, self.state
            
            if label == "normal": label = current_pose
            self.prev_label = label
            return label, conf, landmarks, all_probs, self.state

        elif self.state == State.FALL_DETECTED:
            elapsed = time.time() - self.fall_start_time
            label_check, conf_check, _ = self._model_predict()
            if elapsed <= 3.0 and label_check == "normal":
                pose = self._classify_pose(landmarks)
                if pose in ["normal", "ngoi"]: self.recovery_streak += 1
                else: self.recovery_streak = 0
                if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                    self.state = State.MONITORING
                    self.recovery_streak = 0
                    return f"{pose} (hoi phuc)", conf_check, landmarks, None, self.state
            else:
                if self._classify_pose(landmarks) not in ["normal", "ngoi"]: self.recovery_streak = 0

            if elapsed >= 5.0 and not self.played_audio:
                self.played_audio = True
                self._play_alert_sound()

            if elapsed >= 10.0: self.state = State.POST_FALL
            return f"fall ({int(elapsed)}s)", 1.0, landmarks, self._compute_variance(), self.state

        elif self.state == State.POST_FALL:
            var_info = self._compute_variance()
            label_check, conf_check, _ = self._model_predict()
            if var_info["total"] > self.THR_NORMAL and label_check == "normal":
                pose = self._classify_pose(landmarks)
                if pose in ["normal", "ngoi"]: self.recovery_streak += 1
                else: self.recovery_streak = 0
                if self.recovery_streak >= self.RECOVERY_THRESHOLD:
                    self.state = State.MONITORING
                    self.recovery_streak = 0
                    return f"{pose} (hoi phuc)", conf_check, landmarks, var_info, self.state
            else:
                if self._classify_pose(landmarks) not in ["normal", "ngoi"]: self.recovery_streak = 0

            if var_info["total"] < self.THR_LOW:
                return "unconscious", max(0.0, 1.0 - var_info["total"] / self.THR_LOW), landmarks, var_info, self.state
            elif var_info["total"] > self.THR_HIGH:
                return "seizure", min(var_info["total"] / self.THR_HIGH, 1.0), landmarks, var_info, self.state
            else:
                return "fall (quan sat)", 0.5, landmarks, var_info, self.state

        return "unknown", 0.0, landmarks, None, self.state

    def _play_alert_sound(self):
        def play():
            try:
                import pygame
                pygame.mixer.init()
                path = os.getenv("ALERT_AUDIO_PATH", "audio/canhbao_lan1.mp3")
                if os.path.exists(path):
                    pygame.mixer.music.load(path)
                    pygame.mixer.music.play()
            except: pass
        import threading
        threading.Thread(target=play, daemon=True).start()

def draw_landmarks(frame, landmarks):
    if landmarks is None: return
    h, w, _ = frame.shape
    CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
        (9, 10), (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
        (11, 23), (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28),
        (27, 29), (28, 30), (29, 31), (30, 32), (15, 17), (15, 19), (15, 21),
        (16, 18), (16, 20), (16, 22), (17, 19), (18, 20),
    ]
    points = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for s, e in CONNECTIONS:
        if s < len(points) and e < len(points):
            cv2.line(frame, points[s], points[e], (0, 255, 128), 2)
    for pt in points: cv2.circle(frame, pt, 4, (0, 0, 255), -1)

def draw_variance_bars(frame, var_info, thr_low, thr_high):
    if var_info is None or "total" not in var_info: return
    bx, by, bw, bh = 10, 210, 180, 16
    items = [("Total", var_info["total"], (200, 200, 200)), ("Arm", var_info["arm"], (0, 165, 255)),
             ("Leg", var_info["leg"], (255, 0, 255)), ("Torso", var_info["torso"], (0, 255, 128))]
    mv = 0.1
    for i, (n, v, c) in enumerate(items):
        y = by + i * (bh + 6)
        cv2.rectangle(frame, (bx, y), (bx + bw, y + bh), (40, 40, 40), -1)
        fill = int(bw * min(v / mv, 1.0))
        cv2.rectangle(frame, (bx, y), (bx + fill, y + bh), c, -1)
        cv2.putText(frame, f"{n}: {v:.4f}", (bx + bw + 8, y + 13), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)
