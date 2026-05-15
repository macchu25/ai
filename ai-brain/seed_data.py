import pymongo
import requests
import os
from datetime import datetime

# Config
MONGO_URI = "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
DB_NAME = "fall_detection"
AI_SERVICE_URL = "http://localhost:8001/index"

def seed_data():
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        print("--- SYNCING DATA FROM DB TO VECTOR AI ---")
        
        # 1. Cameras (Nạp nhiều biến thể để AI dễ hiểu)
        for cam in db.cameras.find():
            name = cam.get('name')
            loc = cam.get('location', 'mặc định')
            texts = [
                f"Hệ thống đang có camera tên là '{name}' tại vị trí {loc}.",
                f"Camera '{name}' hiện đang hoạt động và giám sát tại {loc}.",
                f"Danh sách camera của tôi có camera {name}.",
                f"Camera {name} đang chạy bình thường."
            ]
            for t in texts:
                requests.post(AI_SERVICE_URL, json={"id": f"cam_{cam.get('_id')}_{texts.index(t)}", "text": t, "metadata": {"type": "camera"}})
            print(f" Indexed camera: {name} (with synonyms)")

        # 2. Incidents
        for inc in db.events.find():
            text = inc.get('description', 'Su co khong xac dinh')
            requests.post(AI_SERVICE_URL, json={"id": f"inc_{inc.get('_id')}", "text": text, "metadata": {"type": "incident"}})

        # 3. AI Models
        for model in db.ai_models.find():
            text = f"Model AI: {model.get('name')} ({model.get('version')}), status: {model.get('status')}."
            requests.post(AI_SERVICE_URL, json={"id": f"aim_{model.get('_id')}", "text": text, "metadata": {"type": "ai_model"}})

        # 4. Users & Current Plans
        for user in db.users.find():
            plan = user.get('plan', 'Miễn phí (Free)')
            email = user.get('email')
            texts = [
                f"Tài khoản {email} đang sử dụng gói dịch vụ {plan}.",
                f"Gói đăng ký hiện tại của {email} là {plan}.",
                f"Tôi đang sử dụng gói {plan}.",
                f"Hiện tại tôi thuộc nhóm người dùng gói {plan}."
            ]
            for t in texts:
                requests.post(AI_SERVICE_URL, json={"id": f"usr_{user.get('_id')}_{texts.index(t)}", "text": t, "metadata": {"type": "user"}})

        # 5. System Knowledge (NEW: No more hardcoded data!)
        print("Indexing System Knowledge from DB...")
        for knowledge in db.system_knowledge.find():
            requests.post(AI_SERVICE_URL, json={
                "id": f"knw_{knowledge.get('_id')}", 
                "text": knowledge.get('content'), 
                "metadata": {"category": knowledge.get('category')}
            })

        # 6. Health Profiles
        for profile in db.health_profiles.find():
            text = f"Ho so cua {profile.get('name')}: Nhom mau {profile.get('blood_type')}, Tien su: {profile.get('medical_history')}."
            requests.post(AI_SERVICE_URL, json={"id": f"hp_{profile.get('_id')}", "text": text, "metadata": {"type": "health_profile"}})

        print("SUCCESS: SYSTEM SYNCED WITH DATABASE.")
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    seed_data()
