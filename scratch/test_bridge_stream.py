import cv2
import requests

API_BASE = "http://localhost:8080/api/v1"
headers = {"X-API-Key": "ai_secret_key_12345"}

try:
    res = requests.get(f"{API_BASE}/cameras", headers=headers, timeout=5)
    if res.status_code == 200:
        cams = res.json()
        bridge_cam = next((c for c in cams if c.get("name") == "Cardiac Sync Camera"), None)
        if bridge_cam:
            url = bridge_cam.get("rtsp_url")
            print(f"Connecting to Bridge URL from DB: {url}...")
            cap = cv2.VideoCapture(url)
            opened = cap.isOpened()
            print(f"isOpened: {opened}")
            if opened:
                ret, frame = cap.read()
                print(f"read returned: {ret}, frame is None? {frame is None}")
                if ret and frame is not None:
                    print(f"Successfully read frame of shape: {frame.shape}")
                cap.release()
            else:
                print("Failed to open stream.")
        else:
            print("No Cardiac Sync Camera found in DB.")
    else:
        print(f"Failed to fetch cameras: HTTP {res.status_code}")
except Exception as e:
    print(f"Error: {e}")
