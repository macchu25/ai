import torch, json, numpy as np
from models.model_def import FallDetectionModel

# Load model
model = FallDetectionModel(input_size=99, num_classes=4)
model.load_state_dict(
    torch.load('models/best_model.pth', map_location='cpu'))
model.eval()

# Load label map
with open('models/label_map.json') as f:
    label_map = json.load(f)

# Test inference với dummy input
dummy = torch.randn(1, 30, 99)
with torch.no_grad():
    probs = torch.softmax(model(dummy), dim=1)[0]

pred = probs.argmax().item()
print('✅ Model load OK!')
print(f'   Test prediction: {label_map[str(pred)]} ({probs[pred].item():.1%})')
print(f'   Tất cả labels  : {label_map}')