import requests
import numpy as np

# Tạo một mảng 0 giả lập: 30 khung hình, mỗi khung có 99 điểm keypoint 
dummy_data = np.zeros((30, 99)).tolist()

url = "http://127.0.0.1:8000/analyze"
payload = {
    "keypoints_seq": dummy_data
}

print("Đang gửi yêu cầu POST tới API...")
try:
    response = requests.post(url, json=payload)
    print("Mã trạng thái:", response.status_code)
    print("Kết quả trả về:", response.json())
except Exception as e:
    print("Không kết nối được, hãy đảm bảo uvicorn đang chạy!", e)
