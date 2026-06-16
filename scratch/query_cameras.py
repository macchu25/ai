import os
import sys
import pymongo
from dotenv import load_dotenv

# Force UTF-8 encoding for stdout
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

# Load .env from go-backend
load_dotenv(dotenv_path="../go-backend/.env")

mongo_uri = os.getenv("MONGODB_URI")
if not mongo_uri:
    print("MONGODB_URI not found in go-backend/.env!")
    exit(1)

print("Connecting to MongoDB...")
client = pymongo.MongoClient(mongo_uri)
db = client["fall_detection"]
cameras_col = db["cameras"]

print("\n--- CAMERAS IN DATABASE ---")
for cam in cameras_col.find():
    print(f"ID: {cam.get('_id')}")
    print(f"Name: {cam.get('name')}")
    print(f"Location: {cam.get('location')}")
    print(f"RTSP/HLS URL: {cam.get('rtsp_url')}")
    print(f"Status: {cam.get('status')}")
    print("-" * 40)
