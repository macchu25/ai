import cv2
import json
import time
import os
import requests
import torch

from core.config import load_config
from core.detector import FallDetector, draw_landmarks, draw_variance_bars
from core.streamer import Streamer
from models.model_def import FallDetectionModel

def main():
    # 1. Load Config
    config = load_config()
    
    # 2. Load Model & Label Map
    print(f"-> Loading model from {config['model_path']}...")
    model = FallDetectionModel(input_size=99, num_classes=4)
    model.load_state_dict(torch.load(config['model_path'], map_location="cpu"))
    model.eval()
    
    with open(config['labels_path']) as f:
        label_map = json.load(f)
    
    # 3. Initialize Detector
    detector = FallDetector(model, label_map, n_frames=30)
    
    # 4. Initialize Streamer
    streamer = Streamer(api_key=config['api_key'])
    streamer.start()
    
    # 5. Connect to Backend to find Target Camera ID if not provided
    target_cam_id = config['camera_id']
    if not target_cam_id:
        try:
            res = requests.get(f"{config['api_base']}/cameras", timeout=2)
            if res.status_code == 200:
                cam_list = res.json()
                if isinstance(cam_list, list) and len(cam_list) > 0:
                    target_cam_id = cam_list[-1]["id"]
                    print(f"-> Linked to Dashboard: {cam_list[-1]['name']}")
        except: pass

    def push_to_go(lbl, cnf):
        try:
            requests.post(f"{config['api_base']}/ai-result", 
                json={"CameraID": target_cam_id, "Label": lbl, "Confidence": float(cnf)}, 
                headers={"X-API-Key": config['api_key']},
                timeout=0.1
            )
        except: pass

    # 6. Main Loop
    source = int(config['source']) if config['source'].isdigit() else config['source']
    cap = cv2.VideoCapture(source)
    prev_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        # Inference
        label, conf, landmarks, all_probs, state = detector.update(frame)
        
        # Display
        display_frame = frame.copy()
        draw_landmarks(display_frame, landmarks)
        
        if state != "monitoring":
            var_info = all_probs if isinstance(all_probs, dict) else None
            draw_variance_bars(display_frame, var_info, detector.THR_LOW, detector.THR_HIGH)

        # UI Overlay
        fps = 1.0 / (time.time() - prev_time)
        prev_time = time.time()
        cv2.putText(display_frame, f"FPS: {fps:.1f} | State: {state}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(display_frame, f"LBL: {label} ({conf:.2f})", (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # Push to Dashboard & Stream
        push_to_go(label, conf)
        streamer.update_frame(display_frame)
        
        cv2.imshow("Cardiac Alert AI", display_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
