import torch
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
