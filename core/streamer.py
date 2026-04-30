import cv2
import time
import threading
from flask import Flask, Response, request
from flask_cors import CORS

class Streamer:
    def __init__(self, api_key="ai_secret_key_12345"):
        self.app = Flask(__name__)
        CORS(self.app)
        self.global_frame = None
        self.api_key = api_key
        
        @self.app.route('/video_feed')
        def video_feed():
            token = request.args.get('token')
            if token != self.api_key:
                return "Unauthorized", 401
            return Response(self.generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

    def generate_frames(self):
        while True:
            if self.global_frame is None:
                time.sleep(0.05)
                continue
            ret, buffer = cv2.imencode('.jpg', self.global_frame)
            if not ret: continue
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    def update_frame(self, frame):
        self.global_frame = frame

    def start(self, host='0.0.0.0', port=5000):
        threading.Thread(target=lambda: self.app.run(host=host, port=port, debug=False, use_reloader=False), daemon=True).start()
