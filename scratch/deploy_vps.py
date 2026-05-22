import paramiko
import os
import sys
import time

# Target VPS connection details
# THAY ĐỔI CÁC THÔNG TIN DƯỚI ĐÂY KHI CÓ VPS MỚI
VPS_IP = "159.89.23.180"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Kt10lmBYM89i"
REMOTE_DIR = "/root/cardiac-alert"

def safe_write(stream, text):
    encoding = stream.encoding or 'utf-8'
    stream.write(text.encode(encoding, errors='replace').decode(encoding))
    stream.flush()

def progress(filename, size, sent):
    msg = f"\rUploading {os.path.basename(filename)}... {sent/size*100:.1f}%"
    safe_write(sys.stdout, msg)

def upload_dir_sftp(sftp, local_dir, remote_dir):
    try:
        sftp.mkdir(remote_dir)
        print(f"Created remote directory: {remote_dir}")
    except IOError:
        # Directory might already exist
        pass

    for entry in os.listdir(local_dir):
        # Loại trừ các thư mục không cần thiết để tránh upload nặng
        if entry in ['.git', 'venv', '__pycache__', 'node_modules', '.next', '.gemini', 'tests', 'web-app', 'mobile-app', 'go-backend', 'android-alert-player', 'bridge-tool', 'platform-tools', 'scratch']:
            continue
        
        local_path = os.path.join(local_dir, entry)
        # Sử dụng dấu gạch chéo xuôi cho Linux
        remote_path = f"{remote_dir}/{entry}"
        
        if os.path.isdir(local_path):
            upload_dir_sftp(sftp, local_path, remote_path)
        else:
            print(f"Uploading: {local_path} -> {remote_path}")
            sftp.put(local_path, remote_path)

def main():
    print("=" * 60)
    print("       STARTING AUTOMATIC DEPLOYMENT TO VPS")
    print(f"       IP: {VPS_IP} | USER: {VPS_USER}")
    print("=" * 60)

    # 1. Kết nối SSH
    print("\n[1/5] Connecting to VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print(" -> Connection successful!")
    except Exception as e:
        print(f" -> ERROR: Cannot connect to VPS: {e}")
        return

    # 2. Thiết lập Swap Space (RAM ảo 2GB)
    print("\n[2/5] Setting up Swap Space (to prevent out-of-memory)...")
    swap_commands = [
        "if [ ! -f /swapfile ]; then "
        "echo 'Creating 2GB swap file...'; "
        "fallocate -l 2G /swapfile && "
        "chmod 600 /swapfile && "
        "mkswap /swapfile && "
        "swapon /swapfile && "
        "echo '/swapfile none swap sw 0 0' >> /etc/fstab && "
        "echo 'Swap created successfully!'; "
        "else "
        "echo 'Swap already exists.'; "
        "fi"
    ]
    for cmd in swap_commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if out: print(f" -> {out}")
        if err: print(f" -> ERROR/WARN: {err}")

    # 3. Cài đặt các thư viện hệ thống
    print("\n[3/5] Installing system dependencies (Python3, pip, venv, ffmpeg, OpenGL)...")
    apt_cmd = "apt update && apt install -y python3 python3-pip python3-venv libgl1-mesa-glx libglib2.0-0 ffmpeg libgles2 libgles2-mesa libegl1-mesa libegl1"
    stdin, stdout, stderr = ssh.exec_command(apt_cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            text = stdout.channel.recv(1024).decode('utf-8', errors='replace')
            safe_write(sys.stdout, text)
        if stderr.channel.recv_ready():
            text = stderr.channel.recv(1024).decode('utf-8', errors='replace')
            safe_write(sys.stderr, text)
        time.sleep(0.5)
    print(f"\n -> System dependencies installed. Exit code: {stdout.channel.recv_exit_status()}")

    # 4. Upload code qua SFTP
    print("\n[4/5] Preparing and uploading AI & CAM files to VPS...")
    sftp = ssh.open_sftp()
    local_base = "c:/cardiac-alert"
    
    try:
        try:
            sftp.mkdir(REMOTE_DIR)
        except IOError:
            pass
            
        upload_dir_sftp(sftp, local_base, REMOTE_DIR)
        print("\n -> File upload completed successfully!")
    except Exception as e:
        print(f"\n -> ERROR during upload: {e}")
        sftp.close()
        ssh.close()
        return
    finally:
        sftp.close()

    # 5. Tạo môi trường ảo và cài đặt thư viện Python
    print("\n[5/5] Creating Shared Python Virtual Environment & Installing libraries...")
    setup_env_cmd = (
        f"cd {REMOTE_DIR} && "
        "python3 -m venv venv && "
        "./venv/bin/pip install --upgrade pip && "
        "./venv/bin/pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && "
        "./venv/bin/pip install opencv-python-headless numpy requests mediapipe ultralytics flask flask-cors fastapi uvicorn chromadb google-generativeai pydantic sentence-transformers python-dotenv"
    )
    print("Executing virtual environment setup (this will take 2-4 minutes)...")
    stdin, stdout, stderr = ssh.exec_command(setup_env_cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            text = stdout.channel.recv(1024).decode('utf-8', errors='replace')
            safe_write(sys.stdout, text)
        if stderr.channel.recv_ready():
            text = stderr.channel.recv(1024).decode('utf-8', errors='replace')
            safe_write(sys.stderr, text)
        time.sleep(1)
    
    exit_code = stdout.channel.recv_exit_status()
    print(f"\n -> Python environment installation completed. Exit code: {exit_code}")
    if exit_code != 0:
        print(" -> ERROR during pip install. Check stdout/stderr above.")
        ssh.close()
        return

    # 6. Khởi chạy tiến trình chạy ngầm
    print("\n[6/5 (Bonus)] Starting AI Brain & CAM Services...")
    
    # Giải phóng cổng 8001 và 5000
    print(" -> Stopping any running service on ports 8001 and 5000...")
    ssh.exec_command("fuser -k 8001/tcp 5000/tcp || true")
    time.sleep(2)
    
    # Run AI Brain Service (port 8001)
    print(" -> Starting AI Brain Service (port 8001)...")
    start_brain_cmd = f"cd {REMOTE_DIR}/ai-brain && nohup ../venv/bin/python service.py > brain.log 2>&1 &"
    ssh.exec_command(start_brain_cmd)
    time.sleep(2)
    
    # Run CAM (Inference Engine) on Port 5000
    print(" -> Starting CAM Service (port 5000)...")
    start_cam_cmd = f"cd {REMOTE_DIR} && nohup ./venv/bin/python inference.py --headless --source 0 --camera-id 1 > cam.log 2>&1 &"
    ssh.exec_command(start_cam_cmd)
    time.sleep(2)
    
    # Kiểm tra tiến trình
    print("\n -> Verifying running processes:")
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep python")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    print("\n============================================================")
    print("        DEPLOYMENT COMPLETED SUCCESSFULLY!")
    print("============================================================")
    print("AI Brain: Running on port 8001 (FastAPI)")
    print("CAM Inference: Running on port 5000 (MJPEG Stream)")
    print("============================================================")
    
    ssh.close()

if __name__ == "__main__":
    main()
