import sys
import os
import grpc

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Append thư mục ai-service để import được code sinh ra từ proto
sys.path.append(os.path.join(BASE_DIR, "ai-service"))

import fall_detection_pb2
import fall_detection_pb2_grpc

def run():
    print("Đang kết nối tới gRPC server tại localhost:50051...")
    # Tạo kết nối insecure (không mã hóa) tới cổng 50051
    channel = grpc.insecure_channel('localhost:50051')
    stub = fall_detection_pb2_grpc.FallDetectorStub(channel)

    # Tạo mảng giả lập 30 khung hình, 99 số 0
    frames = []
    for _ in range(30):
        frame = fall_detection_pb2.Frame(keypoints=[0.0] * 99)
        frames.append(frame)

    # Đóng gói thành Request theo Message cấu trúc
    request = fall_detection_pb2.FrameRequest(frames=frames)

    try:
        print("Đang gửi yêu cầu gRPC...")
        response = stub.Analyze(request)
        print("✅ Kết quả phân tích thành công:")
        print(f" Nhãn (Label): {response.label}")
        print(f" Độ tự tin  : {response.confidence:.4f}")
        print(" Chi tiết xác suất:")
        for k, v in response.probabilities.items():
            print(f"  - {k}: {v:.4f}")
    except grpc.RpcError as e:
        print(f"Lỗi kết nối gRPC: {e.code()} - {e.details()}")

if __name__ == '__main__':
    run()
