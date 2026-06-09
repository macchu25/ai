import paramiko
import os
import sys
import time

VPS_IP = "159.89.23.180"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Kt10lmBYM89i"
REMOTE_DIR = "/root/cardiac-alert/web-app"

def upload_dir_sftp(sftp, local_dir, remote_dir):
    try:
        sftp.mkdir(remote_dir)
        print(f"Created remote directory: {remote_dir}")
    except IOError:
        pass

    for entry in os.listdir(local_dir):
        if entry in ['.git', 'node_modules', '.next', '__pycache__', 'tsconfig.tsbuildinfo']:
            continue
        
        local_path = os.path.join(local_dir, entry)
        remote_path = f"{remote_dir}/{entry}"
        
        if os.path.isdir(local_path):
            upload_dir_sftp(sftp, local_path, remote_path)
        else:
            print(f"Uploading: {local_path} -> {remote_path}")
            sftp.put(local_path, remote_path)

def main():
    print("=" * 60)
    print("       STARTING DEPLOYMENT OF FRONTEND (FE) ONLY")
    print(f"       IP: {VPS_IP} | USER: {VPS_USER}")
    print("=" * 60)

    # 1. SSH Connect
    print("\n[1/3] Connecting to VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print(" -> Connection successful!")
    except Exception as e:
        print(f" -> ERROR: Cannot connect: {e}")
        return

    # 2. Upload Frontend files
    print("\n[2/3] Uploading Frontend files to VPS...")
    sftp = ssh.open_sftp()
    local_base = "c:/cardiac-alert/web-app"
    try:
        upload_dir_sftp(sftp, local_base, REMOTE_DIR)
        print(" -> Upload completed successfully!")
    except Exception as e:
        print(f" -> ERROR during upload: {e}")
        sftp.close()
        ssh.close()
        return
    finally:
        sftp.close()

    # 3. Docker Compose Build & Up for web-app
    print("\n[3/3] Rebuilding & restarting web-app docker container...")
    deploy_cmd = "cd /root/cardiac-alert && docker compose build web-app && docker compose up -d web-app"
    stdin, stdout, stderr = ssh.exec_command(deploy_cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            sys.stdout.write(stdout.channel.recv(1024).decode('utf-8', errors='replace'))
            sys.stdout.flush()
        if stderr.channel.recv_ready():
            sys.stderr.write(stderr.channel.recv(1024).decode('utf-8', errors='replace'))
            sys.stderr.flush()
        time.sleep(1)
        
    exit_code = stdout.channel.recv_exit_status()
    print(f"\n -> Docker deployment completed with exit code: {exit_code}")
    ssh.close()
    
    if exit_code == 0:
        print("=" * 60)
        print("       FRONTEND DEPLOYMENT COMPLETED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == '__main__':
    main()
