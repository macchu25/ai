import os

BASE = '.'

model_def = '''import torch
import torch.nn as nn

class FallDetectionModel(nn.Module):
    def __init__(self, input_size=99, num_classes=4):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv1d(input_size, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.3),
        )
        self.lstm = nn.LSTM(
            input_size=256, hidden_size=256,
            num_layers=2, batch_first=True, dropout=0.3
        )
        self.fc = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = x.permute(0, 2, 1)
        x = self.cnn(x)
        x = x.permute(0, 2, 1)
        _, (h, _) = self.lstm(x)
        return self.fc(h[-1])
'''

with open(f'{BASE}/models/model_def.py', 'w') as f:
    f.write(model_def)

print('✅ model_def.py đã lưu vào local')
print(f'\n4 files cần download về local:')
for fname in ['best_model.pth', 'label_map.json', 'model_info.json', 'model_def.py']:
    path = f'{BASE}/models/{fname}'
    try:
        size = os.path.getsize(path) / 1024
        print(f'  {fname:25s}: {size:.1f} KB')
    except Exception as e:
        print(f'  {fname:25s}: Không tìm thấy file ({e})')