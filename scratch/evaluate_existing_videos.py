import os
import sys
import io
import cv2
import torch
import numpy as np

# Set sys.stdout to handle utf-8 printing properly
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Import models from project
sys.path.append(r"c:\cardiac-alert")
from models.model_def import DeepPhys, PainDetectionModel
from rppg_inference import RPPGDetector, PainDetector

def evaluate_existing_videos():
    # Load Models
    print("-> Loading models...")
    rppg_model = DeepPhys()
    pain_model = PainDetectionModel(input_size=6)
    
    rppg_model.load_state_dict(torch.load(r"c:\cardiac-alert\best_model_rppg.pth", map_location="cpu"))
    rppg_model.eval()
    
    pain_model.load_state_dict(torch.load(r"c:\cardiac-alert\best_model_pain.pth", map_location="cpu"))
    pain_model.eval()
    
    downloads_dir = r"C:\Users\NHU HUU\Downloads"
    dreamina_videos = [f for f in os.listdir(downloads_dir) if f.lower().startswith("dreamina") and f.lower().endswith(".mp4")]
    
    if not dreamina_videos:
        print("No dreamina videos found in Downloads.")
        return
        
    print(f"Found {len(dreamina_videos)} dreamina videos. Evaluating pain scores...")
    
    results = []
    for f in dreamina_videos:
        video_path = os.path.join(downloads_dir, f)
        print(f"\nEvaluating: {f}")
        
        detector = RPPGDetector(rppg_model)
        pain_detector = PainDetector(pain_model)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("  Cannot open video file.")
            continue
            
        pain_scores = []
        frame_count = 0
        max_pain = 0.0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            
            # Run rPPG detector (processes frame and crops face internally)
            bbox, chest_bbox, heart_rate, respiration_rate, bvp_history, lighting_warning, mean_val, std_val = detector.update(frame, rppg_active=True)
            
            # Extract face crop for pain detector
            pain_score = 0.0
            if detector.last_bbox is not None:
                xmin, ymin, xmax, ymax = detector.last_bbox
                if (xmax - xmin) > 10 and (ymax - ymin) > 10:
                    raw_crop = frame[ymin:ymax, xmin:xmax]
                    raw_crop_rgb = cv2.cvtColor(raw_crop, cv2.COLOR_BGR2RGB)
                    pain_score = pain_detector.update(raw_crop_rgb)
                    pain_scores.append(pain_score)
                    if pain_score > max_pain:
                        max_pain = pain_score
            
            # Break early if video is too long to save time (max 150 frames / 5 seconds)
            if frame_count >= 150:
                break
                
        cap.release()
        
        avg_pain = np.mean(pain_scores) if pain_scores else 0.0
        print(f"  Processed {frame_count} frames. Max Pain Score: {max_pain:.2f}, Avg Pain Score: {avg_pain:.2f}")
        results.append((f, max_pain, avg_pain))
        
    print("\n" + "="*50)
    print("SUMMARY OF PAIN SCORES FOR EXISTING VIDEOS:")
    print("="*50)
    # Sort by maximum pain score descending
    results.sort(key=lambda x: x[1], reverse=True)
    for f, max_p, avg_p in results:
        print(f"- {f}\n  Max Pain: {max_p:.2f} | Avg Pain: {avg_p:.2f}")
        print("-" * 50)

if __name__ == '__main__':
    evaluate_existing_videos()
