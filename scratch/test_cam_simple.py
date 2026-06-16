import cv2

url = "rtsp://admin:L23228B9@192.168.1.113:554/cam/realmonitor?channel=1&subtype=1"
print(f"Connecting to {url}...")
cap = cv2.VideoCapture(url)
cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)
opened = cap.isOpened()
print(f"isOpened: {opened}")
if opened:
    ret, frame = cap.read()
    print(f"read returned: {ret}, frame is None? {frame is None}")
    cap.release()
else:
    print("Failed to open stream.")
