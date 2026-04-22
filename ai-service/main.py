from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import json
import numpy as np
import sys
import os

# Ensure the root directory is in the path so we can import 'models'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from models.model_def import FallDetectionModel

app = FastAPI(title="Fall Detection API")

# Global variables for caching the model and label mapping
model = None
label_map = {}

class AnalyzeRequest(BaseModel):
    # Expects a 30-frame sequence, where each frame has 99 float values (keypoints)
    keypoints_seq: list[list[float]]

@app.on_event("startup")
def load_model_on_startup():
    global model, label_map
    print("⏳ Loading model resources...")

    model_path = os.path.join(BASE_DIR, "models", "best_model.pth")
    label_map_path = os.path.join(BASE_DIR, "models", "label_map.json")

    # Load Label Map
    with open(label_map_path, "r", encoding="utf-8") as f:
        label_map = json.load(f)

    num_classes = len(label_map)

    # Load Model Base
    model = FallDetectionModel(input_size=99, num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    
    print("✅ Model loaded successfully!")

@app.post("/analyze")
def analyze_sequence(request: AnalyzeRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded properly.")

    seq = request.keypoints_seq

    # 1. Validation
    if len(seq) != 30:
        raise HTTPException(status_code=400, detail=f"Expected exactly 30 frames, but got {len(seq)}.")
    
    for i, frame in enumerate(seq):
        if len(frame) != 99:
            raise HTTPException(status_code=400, detail=f"Frame at index {i} does not have exactly 99 keypoints (got {len(frame)}).")

    # 2. Convert Data Structure
    # input_tensor expected shape is (batch_size, sequence_length, features) => (1, 30, 99)
    input_tensor = torch.tensor(np.array(seq), dtype=torch.float32).unsqueeze(0)

    # 3. Model Prediction
    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.softmax(output, dim=1)[0]
    
    # 4. Process Results
    pred_idx = probs.argmax().item()
    confidence = probs[pred_idx].item()
    label = label_map.get(str(pred_idx), "unknown")

    # Dictionary mapping class names to probabilities
    probabilities = {label_map.get(str(i), f"class_{i}"): probs[i].item() for i in range(len(probs))}

    return {
        "label": label,
        "confidence": confidence,
        "probabilities": probabilities
    }
