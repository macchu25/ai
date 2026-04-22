import sys
import os
import time
from concurrent import futures
import json
import torch
import numpy as np
import grpc

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
# Import pb2 files from current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import fall_detection_pb2
import fall_detection_pb2_grpc
from models.model_def import FallDetectionModel

class FallDetectorService(fall_detection_pb2_grpc.FallDetectorServicer):
    def __init__(self):
        print("⏳ Loading model resources for gRPC...")
        model_path = os.path.join(BASE_DIR, "models", "best_model.pth")
        label_map_path = os.path.join(BASE_DIR, "models", "label_map.json")

        with open(label_map_path, "r", encoding="utf-8") as f:
            self.label_map = json.load(f)

        num_classes = len(self.label_map)
        self.model = FallDetectionModel(input_size=99, num_classes=num_classes)
        self.model.load_state_dict(torch.load(model_path, map_location="cpu"))
        self.model.eval()
        print("✅ gRPC Model loaded successfully!")

    def Analyze(self, request, context):
        seq = []
        for frame in request.frames:
            seq.append(list(frame.keypoints))

        if len(seq) != 30:
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(f"Expected exactly 30 frames, got {len(seq)}.")
            return fall_detection_pb2.AnalysisResult()

        if any(len(f) != 99 for f in seq):
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Each frame must contain exactly 99 keypoints.")
            return fall_detection_pb2.AnalysisResult()

        input_tensor = torch.tensor(np.array(seq), dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            output = self.model(input_tensor)
            probs = torch.softmax(output, dim=1)[0]

        pred_idx = probs.argmax().item()
        confidence = probs[pred_idx].item()
        label = self.label_map.get(str(pred_idx), "unknown")

        probabilities = {self.label_map.get(str(i), f"class_{i}"): probs[i].item() for i in range(len(probs))}

        return fall_detection_pb2.AnalysisResult(
            label=label,
            confidence=confidence,
            probabilities=probabilities
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    fall_detection_pb2_grpc.add_FallDetectorServicer_to_server(FallDetectorService(), server)
    port = '[::]:50051'
    server.add_insecure_port(port)
    server.start()
    print(f"🚀 gRPC Server is running on port {port}...")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
