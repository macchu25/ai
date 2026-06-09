import paramiko

VPS_IP = "159.89.23.180"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Kt10lmBYM89i"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Connected! Listing docker containers:")
        stdin, stdout, stderr = ssh.exec_command("docker ps -a")
        print(stdout.read().decode('utf-8'))
        
        print("Listing PM2 processes:")
        stdin, stdout, stderr = ssh.exec_command("pm2 status")
        print(stdout.read().decode('utf-8'))
        
        print("Listing systemd units containing 'cardiac', 'web', 'backend', 'api':")
        stdin, stdout, stderr = ssh.exec_command("systemctl list-units --type=service | grep -E 'cardiac|web|backend|api'")
        print(stdout.read().decode('utf-8'))
        
        print("Listing listening ports:")
        stdin, stdout, stderr = ssh.exec_command("netstat -tuln | grep -E '3000|8080|8001|5000'")
        print(stdout.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    main()
