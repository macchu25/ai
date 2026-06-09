from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# Kết nối MongoDB (sử dụng URI từ main.go)
uri = "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
client = MongoClient(uri)
db = client.fall_detection

# Lấy camera đầu tiên trong database để lấy user_id và thông tin camera thực tế
camera = db.cameras.find_one()

if camera:
    user_id = camera.get("user_id")
    camera_id = camera.get("_id")
    camera_name = camera.get("name", "Camera mau")
    if not user_id:
        user = db.users.find_one()
        user_id = user.get("_id") if user else ObjectId()
    print(f"-> Tim thay camera '{camera_name}' (ID: {camera_id}) cua user {user_id}")
else:
    # Fallback nếu chưa có camera nào trong db
    user = db.users.find_one()
    user_id = user.get("_id") if user else ObjectId()
    camera_id = ObjectId()
    camera_name = "Webcam Laptop (Test)"
    print(f"-> Khong tim thay camera nao. Su dung User ID: {user_id}")

# Tạo sự cố mẫu
event = {
    "user_id": user_id,
    "camera_id": str(camera_id),
    "camera_name": camera_name,
    "type": "Fall",
    "confidence_score": 0.98,
    "status": "active",
    "detected_at": datetime.now(),
    "created_at": datetime.now(),
    "description": f"Phát hiện ngã tại {camera_name} vào lúc {datetime.now().strftime('%H:%M:%S')}"
}

res = db.events.insert_one(event)
print(f"Created mock incident with ID: {res.inserted_id} in 'events' collection")
client.close()
