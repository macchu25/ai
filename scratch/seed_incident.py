from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# Kết nối MongoDB (sử dụng URI từ main.go)
uri = "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
client = MongoClient(uri)
db = client.fall_detection

# Tạo sự cố mẫu
event = {
    "camera_id": "laptop_test_camera",
    "camera_name": "Webcam Laptop (Test)",
    "type": "Fall",
    "confidence_score": 0.98,
    "status": "active",
    "detected_at": datetime.now(),
}

res = db.events.insert_one(event)
print(f"Đã tạo sự cố mẫu với ID: {res.inserted_id}")
client.close()
