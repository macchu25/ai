import pymongo

MONGO_URI = "mongodb://macchu:huuhuu123@ac-8lxi3kt-shard-00-00.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-01.xdt330i.mongodb.net:27017,ac-8lxi3kt-shard-00-02.xdt330i.mongodb.net:27017/?ssl=true&replicaSet=atlas-soiudd-shard-0&authSource=admin&appName=Cluster0"
DB_NAME = "fall_detection"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
col = db["cameras"]

cameras = list(col.find({}))
print("="*60)
print(f"[+] DANH SACH CAMERA TRONG DATABASE ({len(cameras)}):")
print("="*60)
for cam in cameras:
    print(f"ID: {cam['_id']}")
    print(f"Tên: {cam.get('name', 'N/A')}")
    print(f"RTSP URL: {cam.get('rtsp_url', 'N/A')}")
    print("-"*60)
