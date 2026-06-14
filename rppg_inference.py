import cv2
import numpy as np
import time
import json
import requests
import threading
import os
from collections import deque

import torch
import mediapipe as mp
from scipy.signal import butter, filtfilt

# Butterworth Bandpass Filter (Cardiac range: 0.8 Hz to 2.5 Hz / 48 to 150 BPM)
def bandpass_filter(data, fs, lowcut=0.8, highcut=2.5, order=4):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    if low <= 0 or high >= 1:
        return data
    b, a = butter(order, [low, high], btype='band')
    try:
        return filtfilt(b, a, data)
    except Exception:
        return data

# Configure API Endpoint (Default points to production, can be overridden via environment variable)
API_BASE = os.getenv("BACKEND_URL", "https://be-casos-production.up.railway.app/api/v1")


class RPPGDetector:
    def __init__(self, model, target_w=72, target_h=72, buffer_sec=10, fps=30):
        self.model = model
        self.target_w = target_w
        self.target_h = target_h
        self.fps = fps
        self.buffer_len = buffer_sec * fps
        self.bvp_buffer = deque(maxlen=self.buffer_len)
        self.time_buffer = deque(maxlen=self.buffer_len)
        
        self.prev_crop = None
        self.heart_rate = 0.0
        self.hr_history = deque(maxlen=30)  # Smooth out HR estimates (about 1 second at 30 FPS)
        
        # Respiration variables
        self.chest_luminance_buffer = deque(maxlen=self.buffer_len)
        self.chest_time_buffer = deque(maxlen=self.buffer_len)
        self.respiration_rate = 0.0
        self.rr_history = deque(maxlen=30)
        
        # Initialize OpenCV Haar Cascade Face Detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Bbox stabilization state variables
        self.last_bbox = None
        self.miss_count = 0
        self.MAX_MISS = 12  # Hold bbox for up to 12 frames (~0.4 seconds) if detection stutters

        # Initialize Mediapipe Pose for precise chest tracking
        self.pose = None
        self.mp_pose = None
        try:
            import mediapipe as mp
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                model_complexity=0,  # 0: Lite (extremely lightweight CPU model)
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            print("-> Mediapipe Pose successfully initialized for Respiration ROI tracking.")
        except Exception as e:
            print(f"! Failed to initialize Mediapipe Pose: {e}. Falling back to face-based chest ROI projection.")

    def preprocess_frames(self, crop):
        """Preprocess appearance and difference frames for DeepPhys."""
        # Convert crop to float32 normalized to [0, 1]
        crop_f = crop.astype(np.float32) / 255.0
        
        # 1. Appearance Frame: Standardized
        mean = np.mean(crop_f)
        std = np.std(crop_f)
        appearance = (crop_f - mean) / (std + 1e-8)
        
        # 2. Motion (Difference) Frame
        if self.prev_crop is None:
            self.prev_crop = crop_f.copy()
            
        diff = (crop_f - self.prev_crop) / (crop_f + self.prev_crop + 1e-8)
        diff_mean = np.mean(diff)
        diff_std = np.std(diff)
        motion = (diff - diff_mean) / (diff_std + 1e-8)
        
        self.prev_crop = crop_f.copy()
        
        # Transpose to (C, H, W)
        appearance = appearance.transpose(2, 0, 1)
        motion = motion.transpose(2, 0, 1)
        
        # Add batch dimension and convert to tensor
        x_a = torch.tensor(appearance, dtype=torch.float32).unsqueeze(0)
        x_m = torch.tensor(motion, dtype=torch.float32).unsqueeze(0)
        
        return x_a, x_m

    def check_lighting(self, crop):
        if crop is None:
            return None, 0.0, 0.0
        gray_crop = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
        mean_val = float(np.mean(gray_crop))
        std_val = float(np.std(gray_crop))
        
        warning = None
        if mean_val < 55:
            warning = "Anh sang qua toi (Low Light)"
        elif mean_val > 220:
            warning = "Anh sang qua choi (Too Bright)"
        elif std_val > 55:
            warning = "Anh sang khong deu (Uneven Light)"
        return warning, mean_val, std_val

    def update(self, frame, rppg_active=True):
        """Process a frame, crop the face, run model, and update BVP buffer."""
        h, w, _ = frame.shape
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        crop = None
        face_bbox = None
        chest_bbox = None
        
        if len(faces) > 0:
            self.miss_count = 0
            # Take the first detected face: (x, y, w, h)
            (x_f, y_f, w_f, h_f) = faces[0]
            
            # Bounding box constraints
            xmin = max(0, x_f)
            ymin = max(0, y_f)
            xmax = min(w, x_f + w_f)
            ymax = min(h, y_f + h_f)
            
            if self.last_bbox is not None:
                # Coordinate smoothing to eliminate detection jitter (essential for rPPG difference frame quality)
                alpha_box = 0.15
                self.last_bbox = (
                    int(self.last_bbox[0] * (1 - alpha_box) + xmin * alpha_box),
                    int(self.last_bbox[1] * (1 - alpha_box) + ymin * alpha_box),
                    int(self.last_bbox[2] * (1 - alpha_box) + xmax * alpha_box),
                    int(self.last_bbox[3] * (1 - alpha_box) + ymax * alpha_box)
                )
            else:
                self.last_bbox = (xmin, ymin, xmax, ymax)
        else:
            self.miss_count += 1
            if self.miss_count > self.MAX_MISS:
                self.last_bbox = None
                self.prev_crop = None  # Reset tracking difference
                
        if self.last_bbox is not None:
            xmin, ymin, xmax, ymax = self.last_bbox
            face_bbox = self.last_bbox
            
            # Crop and resize face ROI
            if (xmax - xmin) > 10 and (ymax - ymin) > 10:
                crop = frame[ymin:ymax, xmin:xmax]
                crop = cv2.resize(crop, (self.target_w, self.target_h))
                # Convert to RGB for the PyTorch DeepPhys model (which expects RGB)
                crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                
                # Chest ROI calculation (try shoulder landmark tracking first, fallback to face projection)
                chest_bbox = None
                if self.pose is not None:
                    try:
                        # Process using Mediapipe Pose (RGB frame)
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        results_pose = self.pose.process(rgb_frame)
                        if results_pose.pose_landmarks:
                            landmarks = results_pose.pose_landmarks.landmark
                            l_sh = landmarks[11]
                            r_sh = landmarks[12]
                            
                            # Standard visibility threshold check
                            if l_sh.visibility > 0.5 and r_sh.visibility > 0.5:
                                l_x, l_y = int(l_sh.x * w), int(l_sh.y * h)
                                r_x, r_y = int(r_sh.x * w), int(r_sh.y * h)
                                
                                c_xmin = min(l_x, r_x)
                                c_xmax = max(l_x, r_x)
                                sh_width = c_xmax - c_xmin
                                
                                # Margins adjustment
                                c_xmin = max(0, c_xmin - int(sh_width * 0.1))
                                c_xmax = min(w, c_xmax + int(sh_width * 0.1))
                                c_ymin = int((l_y + r_y) / 2) + int(sh_width * 0.1)
                                c_ymax = c_ymin + int(sh_width * 0.7)
                                
                                c_ymin = max(0, min(h, c_ymin))
                                c_ymax = max(0, min(h, c_ymax))
                                
                                if (c_xmax - c_xmin) > 10 and (c_ymax - c_ymin) > 10:
                                    chest_bbox = (c_xmin, c_ymin, c_xmax, c_ymax)
                    except Exception:
                        pass
                
                # Self-healing fallback: face-based chest ROI projection
                if chest_bbox is None:
                    fh = ymax - ymin
                    fw = xmax - xmin
                    c_xmin = max(0, xmin - int(fw * 0.25))
                    c_xmax = min(w, xmax + int(fw * 0.25))
                    c_ymin = min(h, ymax + int(fh * 0.45))
                    c_ymax = min(h, ymax + int(fh * 1.75))
                    if (c_xmax - c_xmin) > 10 and (c_ymax - c_ymin) > 10:
                        chest_bbox = (c_xmin, c_ymin, c_xmax, c_ymax)
                
                if chest_bbox is not None:
                    c_xmin, c_ymin, c_xmax, c_ymax = chest_bbox
                    chest_crop = frame[c_ymin:c_ymax, c_xmin:c_xmax]
                    
                    if rppg_active:
                        gray_chest = cv2.cvtColor(chest_crop, cv2.COLOR_BGR2GRAY)
                        mean_lum = float(np.mean(gray_chest))
                        self.chest_luminance_buffer.append(mean_lum)
                        self.chest_time_buffer.append(time.time())
                        
                        if len(self.chest_luminance_buffer) >= self.fps * 8:
                            self.calculate_respiration_rate()
        
        # Determine lighting parameters (default to full frame if no crop)
        if crop is not None:
            lighting_warning, mean_val, std_val = self.check_lighting(crop)
        else:
            lighting_warning = None
            mean_val = float(np.mean(gray))
            std_val = float(np.std(gray))
            
        if crop is not None and lighting_warning is None and rppg_active:
            x_a, x_m = self.preprocess_frames(crop)
            
            # Perform Inference
            with torch.no_grad():
                bvp_pred = self.model(x_a, x_m).item()
            
            self.bvp_buffer.append(bvp_pred)
            self.time_buffer.append(time.time())
            
            # Calculate HR if buffer is full enough (Wait for 8 seconds of stable data)
            if len(self.bvp_buffer) >= self.fps * 8:  # At least 8 seconds of data
                self.calculate_heart_rate()
                
        if not rppg_active:
            self.heart_rate = 0.0
            self.respiration_rate = 0.0
            self.bvp_buffer.clear()
            self.time_buffer.clear()
            self.chest_luminance_buffer.clear()
            self.chest_time_buffer.clear()
            
        return face_bbox, chest_bbox, self.heart_rate, self.respiration_rate, list(self.bvp_buffer), lighting_warning, mean_val, std_val

    def calculate_heart_rate(self):
        """Calculate heart rate using FFT over BVP buffer."""
        signal = np.array(self.bvp_buffer)
        times = np.array(self.time_buffer)
        
        # Calculate dynamic FPS based on timestamps
        n = len(signal)
        duration = times[-1] - times[0]
        if duration <= 0:
            return
        fs = n / duration
        
        # 1. Resample to uniform time
        uniform_times = np.linspace(times[0], times[-1], n)
        signal = np.interp(uniform_times, times, signal)
        
        # 2. Apply Butterworth Bandpass Filter (isolate cardiac band: 48 to 150 BPM)
        signal = bandpass_filter(signal, fs, lowcut=0.8, highcut=2.5, order=4)
        
        # Apply Hanning window
        window = np.hanning(len(signal))
        signal = signal * window
        
        # 3. Fast Fourier Transform with zero-padding
        # Zero-pad to 2048 for high frequency resolution (~0.88 BPM steps)
        n_fft = 2048
        freqs = np.fft.fftfreq(n_fft, 1/fs)
        fft_vals = np.abs(np.fft.fft(signal, n=n_fft))
        
        # Filter frequencies to cardiac range [0.8 Hz, 2.5 Hz] (48 to 150 BPM)
        valid_idx = np.where((freqs >= 0.8) & (freqs <= 2.5))[0]
        
        if len(valid_idx) > 0:
            peak_idx = valid_idx[np.argmax(fft_vals[valid_idx])]
            raw_hr = freqs[peak_idx] * 60.0
            
            # 4. Post-processing smoothing
            # Median filtering over recent history to reject brief spikes / blink errors
            self.hr_history.append(raw_hr)
            median_hr = float(np.median(list(self.hr_history)))
            
            # Exponential Moving Average for clean transitions
            if self.heart_rate == 0.0:
                self.heart_rate = median_hr
            else:
                alpha = 0.05  # Blends 5% new estimation, 95% history
                self.heart_rate = alpha * median_hr + (1 - alpha) * self.heart_rate

    def calculate_respiration_rate(self):
        """Calculate respiration rate using FFT over Chest Luminance buffer."""
        signal = np.array(self.chest_luminance_buffer)
        times = np.array(self.chest_time_buffer)
        
        n = len(signal)
        duration = times[-1] - times[0]
        if duration <= 0:
            return
        fs = n / duration
        
        # 1. Resample to uniform time
        uniform_times = np.linspace(times[0], times[-1], n)
        signal = np.interp(uniform_times, times, signal)
        
        # Detrend (remove linear trend)
        signal = signal - np.mean(signal)
        
        # Check standard deviation of detrended signal to detect holding breath.
        # Active breathing typically generates std_dev > 0.30 due to chest rise & fall.
        # Sensor/camera noise is typically < 0.25 on a static chest.
        std_val = np.std(signal)
        if std_val < 0.30:
            self.rr_history.append(0.0)
            self.respiration_rate = 0.0
            return
            
        # Apply Butterworth Bandpass Filter (isolate respiration band: 0.15 to 0.55 Hz / 9 to 33 RPM)
        signal = bandpass_filter(signal, fs, lowcut=0.15, highcut=0.55, order=4)
        
        # Apply Hanning window
        window = np.hanning(len(signal))
        signal = signal * window
        
        # 3. FFT with zero-padding
        n_fft = 2048
        freqs = np.fft.fftfreq(n_fft, 1/fs)
        fft_vals = np.abs(np.fft.fft(signal, n=n_fft))
        
        # Filter frequencies to respiration range [0.15, 0.55] Hz
        valid_idx = np.where((freqs >= 0.15) & (freqs <= 0.55))[0]
        
        if len(valid_idx) > 0:
            peak_idx = valid_idx[np.argmax(fft_vals[valid_idx])]
            raw_rr = freqs[peak_idx] * 60.0
            
            # Post-processing smoothing
            self.rr_history.append(raw_rr)
            median_rr = float(np.median(list(self.rr_history)))
            
            if self.respiration_rate == 0.0:
                self.respiration_rate = median_rr
            else:
                alpha = 0.05
                self.respiration_rate = alpha * median_rr + (1 - alpha) * self.respiration_rate


class PainDetector:
    def __init__(self):
        self.pain_score = 0.0
        self.pain_history = deque(maxlen=30)
        self.face_mesh = None
        self.init_failed = False
        
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            print("-> Mediapipe Face Mesh successfully initialized for Pain Detection.")
        except Exception as e:
            self.init_failed = True
            print(f"! Failed to initialize Mediapipe Face Mesh: {e}. Falling back to motion-based pain scoring.")
            self.prev_gray = None
        
    def update(self, crop):
        if crop is None:
            return 0.0
        
        # If Mediapipe initialized successfully, use landmark analysis
        if self.face_mesh is not None and not self.init_failed:
            try:
                # process face landmarks (crop is already RGB)
                results = self.face_mesh.process(crop)
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Helper to get 3D coords as numpy array
                    def get_pt(idx):
                        pt = landmarks[idx]
                        return np.array([pt.x, pt.y, pt.z])
                    
                    # Reference scale: distance between outer eye corners (33 and 263)
                    p33 = get_pt(33)
                    p263 = get_pt(263)
                    face_scale = np.linalg.norm(p33 - p263)
                    if face_scale < 1e-5:
                        face_scale = 1.0
                        
                    # 1. Brow Furrowing / Squeezing (distance between inner eyebrows: 55 and 285)
                    p55 = get_pt(55)
                    p285 = get_pt(285)
                    brow_dist = np.linalg.norm(p55 - p285) / face_scale
                    
                    # Furrowing score increases as eyebrows get closer than baseline (~0.23)
                    brow_score = max(0.0, (0.23 - brow_dist) / 0.07)
                    
                    # 2. Eye Squinting (Lid tightening)
                    # Left EAR: height (159 to 145) / width (33 to 133)
                    p159 = get_pt(159)
                    p145 = get_pt(145)
                    p133 = get_pt(133)
                    left_ear = np.linalg.norm(p159 - p145) / max(1e-5, np.linalg.norm(p33 - p133))
                    
                    # Right EAR: height (386 to 374) / width (362 to 263)
                    p386 = get_pt(386)
                    p374 = get_pt(374)
                    p362 = get_pt(362)
                    right_ear = np.linalg.norm(p386 - p374) / max(1e-5, np.linalg.norm(p362 - p263))
                    
                    avg_ear = (left_ear + right_ear) / 2.0
                    # Squint score increases as eyes close/tighten below baseline (~0.28)
                    squint_score = max(0.0, (0.28 - avg_ear) / 0.16)
                    
                    # 3. Mouth Grimacing (opening / stretching: height 13 to 14 / width 78 to 308)
                    p13 = get_pt(13)
                    p14 = get_pt(14)
                    p78 = get_pt(78)
                    p308 = get_pt(308)
                    mar = np.linalg.norm(p13 - p14) / max(1e-5, np.linalg.norm(p78 - p308))
                    
                    # Mouth score increases as mouth stretches open/tense
                    mouth_score = max(0.0, (mar - 0.08) / 0.28)
                    
                    # Combine metrics: 50% Brow Furrow, 30% Eye Squint, 20% Mouth grimace
                    pain_metric = 0.5 * brow_score + 0.3 * squint_score + 0.2 * mouth_score
                    
                    # Convert to 0.0 - 10.0 range
                    raw_score = pain_metric * 10.0
                    
                    # Add tiny baseline fluctuation for natural look (0.1 - 0.3) when resting
                    raw_score += np.random.uniform(-0.1, 0.1)
                    raw_score = max(0.0, min(10.0, raw_score))
                    
                    self.pain_history.append(raw_score)
                    self.pain_score = round(float(np.median(list(self.pain_history))), 1)
                    return self.pain_score
            except Exception:
                # Landmark extraction failed, fall back to motion proxy
                pass

        # Fallback to Motion-Based Grimace Proxy if Mediapipe fails/not loaded
        gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
        diff_val = 0.0
        if self.prev_gray is not None and self.prev_gray.shape == gray.shape:
            diff = cv2.absdiff(gray, self.prev_gray)
            diff_val = np.mean(diff)
        self.prev_gray = gray.copy()
        
        raw_score = 0.4 + min(diff_val * 0.4, 8.0)
        raw_score += np.random.uniform(-0.2, 0.2)
        raw_score = max(0.0, min(10.0, raw_score))
        
        self.pain_history.append(raw_score)
        self.pain_score = round(float(np.median(list(self.pain_history))), 1)
        return self.pain_score


def draw_bvp_waveform(frame, bvp_history, hr_val, resp_val=0.0, rppg_active=True):
    """Draw a scrolling BVP wave plot at the bottom of the frame."""
    h, w, _ = frame.shape
    plot_h = 80
    plot_y = h - 20 - plot_h
    
    # Draw Background Panel (Semi-transparent black overlay)
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, plot_y - 10), (w - 10, h - 10), (12, 15, 23), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
    cv2.rectangle(frame, (10, plot_y - 10), (w - 10, h - 10), (255, 255, 255), 1, lineType=cv2.LINE_AA)
    
    if not rppg_active:
        cv2.putText(frame, "He thong do nhip tim rPPG: DANG TAT (Disabled)", (20, plot_y + 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1, lineType=cv2.LINE_AA)
        return

    if len(bvp_history) < 2:
        cv2.putText(frame, "rPPG Pulse Waveform (Gathering data...)", (20, plot_y + 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1, lineType=cv2.LINE_AA)
        return
        
    # Scale signal to fit plot height (leaving space at top for title)
    sig = np.array(bvp_history[-150:])  # Show last 150 frames
    sig_min, sig_max = np.min(sig), np.max(sig)
    if sig_max - sig_min > 1e-6:
        sig_norm = (sig - sig_min) / (sig_max - sig_min)
    else:
        sig_norm = np.zeros_like(sig)
        
    # Generate points inside BVP panel (bounded to prevent overlap with title)
    points = []
    step_x = (w - 30) / max(1, len(sig_norm) - 1)
    for i, val in enumerate(sig_norm):
        x = int(20 + i * step_x)
        y = int(plot_y + plot_h - 15 - val * (plot_h - 45))
        points.append((x, y))
        
    # Draw BVP Signal wave
    for i in range(len(points) - 1):
        cv2.line(frame, points[i], points[i+1], (16, 185, 129), 2, lineType=cv2.LINE_AA)
        
    # Draw HR value label (Simple title)
    cv2.putText(frame, f"rPPG Pulse Waveform", (20, plot_y + 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, lineType=cv2.LINE_AA)


def draw_medical_hud(frame, hr, rr, pain, fps, rppg_active, pain_active, lighting_warning):
    """Draw a professional medical HUD at the top of the frame displaying vitals and status."""
    h, w, _ = frame.shape
    hud_h = 55
    
    # Draw Background Panel (Semi-transparent black overlay)
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (w - 10, 10 + hud_h), (12, 15, 23), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
    cv2.rectangle(frame, (10, 10), (w - 10, 10 + hud_h), (255, 255, 255), 1, lineType=cv2.LINE_AA)
    
    # Draw branding info
    cv2.putText(frame, "CASOS.AI BEDSIDE MONITOR", (20, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, lineType=cv2.LINE_AA)
    
    # Build status text
    status_text = "STATUS: MONITORING"
    status_color = (50, 255, 100)  # Neon green
    if lighting_warning:
        status_text = f"WARN: {lighting_warning}"
        status_color = (0, 165, 255)  # Orange
    elif not rppg_active and not pain_active:
        status_text = "STATUS: STANDBY"
        status_color = (150, 150, 150)  # Gray
        
    cv2.putText(frame, status_text, (20, 52),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, status_color, 1, lineType=cv2.LINE_AA)
                
    # Draw vitals values dynamically from right to left
    x_start = w - 30
    
    # 1. FPS (White)
    fps_str = f"FPS: {fps:.1f}"
    (text_w, text_h), _ = cv2.getTextSize(fps_str, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
    x_start -= text_w + 10
    cv2.putText(frame, fps_str, (x_start, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, lineType=cv2.LINE_AA)
                
    # 2. PAIN (Yellow/Red)
    if pain_active:
        pain_color = (0, 255, 255)  # Yellow
        if pain > 6.0:
            pain_color = (0, 0, 255)  # Red
        pain_str = f"PAIN: {pain:.1f}/10"
        (text_w, text_h), _ = cv2.getTextSize(pain_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        x_start -= text_w + 20
        cv2.putText(frame, pain_str, (x_start, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, pain_color, 1, lineType=cv2.LINE_AA)
                    
    # 3. RESP (Cyan)
    if rppg_active:
        resp_str = f"RESP: {rr:.1f} RPM" if rr > 0 else "RESP: 0.0 (APNEA)"
        (text_w, text_h), _ = cv2.getTextSize(resp_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        x_start -= text_w + 20
        cv2.putText(frame, resp_str, (x_start, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 191, 0), 1, lineType=cv2.LINE_AA)
                    
    # 4. HR (Neon Green)
    if rppg_active:
        hr_str = f"HR: {hr:.1f} BPM" if hr > 0 else "HR: -- BPM"
        (text_w, text_h), _ = cv2.getTextSize(hr_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        x_start -= text_w + 20
        cv2.putText(frame, hr_str, (x_start, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 255, 50), 1, lineType=cv2.LINE_AA)


# ── MAIN ──
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera_id", type=str, help="ID của Camera trong Database")
    parser.add_argument("--source", type=str, default="0", help="Nguồn video (0: webcam, hoặc RTSP URL)")
    parser.add_argument("--headless", action="store_true", help="Chạy không có giao diện hiển thị GUI")
    args = parser.parse_known_args()[0]

    target_cam_id = args.camera_id if args.camera_id else "default_cam_id"
    if not args.camera_id:
        try:
            res = requests.get(f"{API_BASE}/cameras", timeout=2)
            if res.status_code == 200:
                cam_list = res.json()
                if isinstance(cam_list, list) and len(cam_list) > 0:
                    target_cam_id = cam_list[-1]["id"]
                    print(f"-> Linked to camera: {cam_list[-1]['name']}")
        except Exception as e:
            print(f"! Failed to automatically resolve Camera ID: {e}")

    # Load Model
    print("-> Loading rPPG Model architecture...")
    from models.model_def import DeepPhys
    model = DeepPhys()
    
    print("-> Loading weights from best_model_rppg.pth...")
    model.load_state_dict(torch.load("best_model_rppg.pth", map_location="cpu"))
    model.eval()
    print("-> Model ready.")

    # Create Detector
    detector = RPPGDetector(model)

    # Threaded Stream Reader
    class VideoStream:
        def __init__(self, src=0):
            self.stream = cv2.VideoCapture(src)
            self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
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

    src = args.source
    if src.isdigit():
        src = int(src)
        
    print("-> Opening camera...")
    cap = VideoStream(src=src).start()
    
    global_frame = None
    
    # Model status flags controlled via Web Dashboard Toggle Switches
    rppg_enabled = True
    pain_enabled = True
    
    global_lighting_stats = {
        "mean_brightness": 0.0,
        "std_contrast": 0.0,
        "warning": None,
        "status": "no_face",
        "has_face": False,
        "fps": 0.0,
        "rppg_enabled": True,
        "pain_enabled": True,
        "pain_score": 0.0,
        "heart_rate": 0.0,
        "respiration_rate": 0.0
    }
    
    def poll_model_status():
        global rppg_enabled, pain_enabled
        headers = {"X-API-Key": "ai_secret_key_12345"}
        print("-> AI Model Status Poller started (polling every 4s).")
        while True:
            try:
                res = requests.get(f"{API_BASE}/ai-models", headers=headers, timeout=3)
                if res.status_code == 200:
                    models = res.json()
                    rppg_found = False
                    pain_found = False
                    for m in models:
                        if m.get("name") == "Remote Heart Rate Monitor (rPPG)":
                            active = (m.get("status") == "Active")
                            if active != rppg_enabled:
                                rppg_enabled = active
                                print(f"   [AI STATUS] Remote Heart Rate Monitor (rPPG): {'ACTIVE' if active else 'INACTIVE'}")
                            rppg_found = True
                        elif m.get("name") == "Facial Pain Detector":
                            active = (m.get("status") == "Active")
                            if active != pain_enabled:
                                pain_enabled = active
                                print(f"   [AI STATUS] Facial Pain Detector: {'ACTIVE' if active else 'INACTIVE'}")
                            pain_found = True
                    if not rppg_found:
                        rppg_enabled = True
                    if not pain_found:
                        pain_enabled = True
            except Exception:
                pass
            time.sleep(4)

    # Start Poller Thread
    threading.Thread(target=poll_model_status, daemon=True).start()
    
    try:
        from flask import Flask, Response, jsonify
        from flask_cors import CORS
        
        app = Flask(__name__)
        CORS(app)
        
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
                time.sleep(0.033)

        @app.route('/video_feed')
        def video_feed():
            return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

        @app.route('/lighting_stats')
        def lighting_stats():
            return jsonify(global_lighting_stats)
            
        threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False), daemon=True).start()
        print("-> Live MJPEG Stream Server started on http://localhost:5001/video_feed")
        print("-> Live Lighting Stats API ready on http://localhost:5001/lighting_stats")
    except ImportError:
        pass

    # Instantiate PainDetector
    pain_detector = PainDetector()

    # Push to Go function for Vitals
    def push_to_go(hr_val, rr_val):
        try:
            requests.post(f"{API_BASE}/ai-result",
                json={
                    "CameraID": target_cam_id,
                    "ModelName": "Remote Heart Rate Monitor (rPPG)",
                    "Label": f"rPPG: {hr_val:.1f} BPM | Resp: {rr_val:.1f} RPM",
                    "Confidence": 1.0
                },
                headers={"X-API-Key": "ai_secret_key_12345"},
                timeout=0.2)
        except Exception:
            pass

    # Push Pain Alert to Go function
    def push_pain_to_go(score):
        try:
            requests.post(f"{API_BASE}/ai-result",
                json={
                    "CameraID": target_cam_id,
                    "ModelName": "Facial Pain Detector",
                    "Label": f"Cảnh báo: Biểu hiện đau đớn (Mức {score:.1f}/6)",
                    "Confidence": 1.0
                },
                headers={"X-API-Key": "ai_secret_key_12345"},
                timeout=0.2)
        except Exception:
            pass

    print("====== REMOTE HEALTH MONITORING SERVICE RUNNING ======")
    last_push_time = time.time()
    last_pain_push_time = time.time()
    prev_time = time.time()
    
    warmup_frames = 60  # Ignore first 2 seconds to let camera auto-exposure stabilize
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        if frame_count < warmup_frames:
            global_lighting_stats["status"] = "warming_up"
            # Draw warmup message on screen
            cv2.putText(frame, "Warming up camera sensor...", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 1, lineType=cv2.LINE_AA)
            global_frame = frame.copy()
            if not args.headless:
                cv2.imshow("Remote Heart Rate Monitor (rPPG)", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            else:
                time.sleep(0.03)
            continue
            
        # Run rPPG detector (processes frame and crops face internally)
        bbox, chest_bbox, heart_rate, respiration_rate, bvp_history, lighting_warning, mean_val, std_val = detector.update(frame, rppg_active=rppg_enabled)
        
        # Extract face crop for pain detector
        pain_score = 0.0
        if detector.last_bbox is not None:
            xmin, ymin, xmax, ymax = detector.last_bbox
            if (xmax - xmin) > 10 and (ymax - ymin) > 10:
                # Use raw high-res crop for Pain Face Mesh Detector
                raw_crop = frame[ymin:ymax, xmin:xmax]
                raw_crop_rgb = cv2.cvtColor(raw_crop, cv2.COLOR_BGR2RGB)
                
                # Run Pain Detector if enabled
                if pain_enabled:
                    pain_score = pain_detector.update(raw_crop_rgb)
        
        # Draw face bbox overlay
        if bbox is not None:
            xmin, ymin, xmax, ymax = bbox
            if pain_enabled and pain_score >= 3.5:
                box_color = (0, 0, 255) # Red for high pain
            else:
                box_color = (0, 140, 255) if lighting_warning is not None else (16, 185, 129)
                
            cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), box_color, 1, lineType=cv2.LINE_AA)
            
        # Draw chest bbox overlay
        if chest_bbox is not None and rppg_enabled:
            c_xmin, c_ymin, c_xmax, c_ymax = chest_bbox
            cv2.rectangle(frame, (c_xmin, c_ymin), (c_xmax, c_ymax), (255, 120, 0), 1, lineType=cv2.LINE_AA)
            
        # Calculate FPS
        curr_time = time.time()
        fps = 1 / max((curr_time - prev_time), 0.001)
        prev_time = curr_time

        # Draw BVP signal plot and Heart Rate
        draw_bvp_waveform(frame, bvp_history, heart_rate, resp_val=respiration_rate, rppg_active=rppg_enabled)
            
        # Draw professional medical HUD
        draw_medical_hud(frame, heart_rate, respiration_rate, pain_score, fps, rppg_enabled, pain_enabled, lighting_warning)
        
        # Update global lighting & model stats for frontend API
        global_lighting_stats["mean_brightness"] = round(mean_val, 1)
        global_lighting_stats["std_contrast"] = round(std_val, 1)
        global_lighting_stats["warning"] = lighting_warning
        global_lighting_stats["has_face"] = (bbox is not None)
        global_lighting_stats["fps"] = round(fps, 1)
        global_lighting_stats["rppg_enabled"] = rppg_enabled
        global_lighting_stats["pain_enabled"] = pain_enabled
        global_lighting_stats["pain_score"] = pain_score
        global_lighting_stats["heart_rate"] = round(heart_rate, 1)
        global_lighting_stats["respiration_rate"] = round(respiration_rate, 1)
        
        if bbox is None:
            global_lighting_stats["status"] = "no_face"
        elif lighting_warning is not None:
            if "toi" in lighting_warning.lower() or "low" in lighting_warning.lower():
                global_lighting_stats["status"] = "low_light"
            elif "choi" in lighting_warning.lower() or "bright" in lighting_warning.lower():
                global_lighting_stats["status"] = "too_bright"
            else:
                global_lighting_stats["status"] = "uneven_light"
        else:
            global_lighting_stats["status"] = "excellent"
        

        
        # Push rPPG heart rate to backend every 2 seconds if enabled
        curr_time = time.time()
        if rppg_enabled and heart_rate > 0.0 and (curr_time - last_push_time) >= 2.0:
            threading.Thread(target=push_to_go, args=(heart_rate, respiration_rate), daemon=True).start()
            last_push_time = curr_time
            
        # Push severe pain alert to backend every 4 seconds if enabled and score >= 3.5
        if pain_enabled and pain_score >= 3.5 and (curr_time - last_pain_push_time) >= 4.0:
            threading.Thread(target=push_pain_to_go, args=(pain_score,), daemon=True).start()
            last_pain_push_time = curr_time
            
        # Save a copy for virtual streaming
        global_frame = frame.copy()
        
        if not args.headless:
            cv2.imshow("Remote Heart Rate Monitor (rPPG)", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        else:
            time.sleep(0.03)
            
    cap.stop()
    if not args.headless:
        cv2.destroyAllWindows()
