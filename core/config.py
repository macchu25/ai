import os
import argparse
from dotenv import load_dotenv

def load_config():
    """Load configuration from .env and command line arguments."""
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="AI Fall Detection System")
    parser.add_argument("--camera_id", type=str, help="ID of the camera from dashboard")
    parser.add_argument("--source", type=str, default="0", help="Camera source (0 for webcam or RTSP link)")
    parser.add_argument("--model", type=str, default="models/best_model.pth", help="Path to PyTorch model")
    parser.add_argument("--labels", type=str, default="models/labels.json", help="Path to labels.json")
    
    args = parser.parse_args()
    
    # Environment variable fallbacks
    config = {
        "camera_id": args.camera_id,
        "source": args.source,
        "model_path": args.model,
        "labels_path": args.labels,
        "api_base": os.getenv("BACKEND_API_URL", "http://localhost:8080/api/v1"),
        "api_key": os.getenv("INTERNAL_API_KEY", "ai_secret_key_12345"),
        "conf_threshold": float(os.getenv("CONFIDENCE_THRESHOLD", 0.85))
    }
    
    return config
