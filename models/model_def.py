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


class AttentionBlock(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.ELU(),
            nn.Conv2d(16, 1, kernel_size=1),
            nn.Sigmoid()
        )


class DeepPhys(nn.Module):
    def __init__(self):
        super().__init__()
        self.motion = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ELU(),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ELU(),
            nn.AvgPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64)
        )
        self.appearance = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ELU(),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ELU(),
            nn.AvgPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64)
        )
        self.attention = AttentionBlock()
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.5),
            nn.Linear(64, 128),
            nn.ELU(),
            nn.Dropout(0.5),
            nn.Linear(128, 1)
        )

    def forward(self, x_a, x_m):
        feat_a = self.appearance[:6](x_a)
        feat_m = self.motion[:6](x_m)
        
        attn_in = torch.mean(feat_a, dim=1, keepdim=True)
        attn_mask = self.attention.conv(attn_in)
        
        feat_m = feat_m * attn_mask
        
        feat_a_pooled = self.appearance[6](feat_a)
        feat_m_pooled = self.motion[6](feat_m)
        
        out_a = self.appearance[7:9](feat_a_pooled)
        out_m = self.motion[7:9](feat_m_pooled)
        
        out_pooled = torch.mean(out_m, dim=[2, 3])
        out = self.fc(out_pooled)
        return out

class PainDetectionModel(nn.Module):
    def __init__(self, input_size=6, num_classes=1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, num_classes),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.net(x)
