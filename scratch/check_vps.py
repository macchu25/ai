import paramiko
import sys

# Target VPS connection details
VPS_IP = "159.89.23.180"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Kt10lmBYM89i"

def safe_write(stream, text):
    encoding = stream.encoding or 'utf-8'
    stream.write(text.encode(encoding, errors='replace').decode(encoding))
    stream.flush()

def run_cmd(ssh, cmd):
    safe_write(sys.stdout, f"\n--- Running: {cmd} ---\n")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        safe_write(sys.stdout, "[STDOUT]\n")
        safe_write(sys.stdout, out)
    if err:
        safe_write(sys.stderr, "[STDERR]\n")
        safe_write(sys.stderr, err)
    safe_write(sys.stdout, f"Exit code: {stdout.channel.recv_exit_status()}\n")

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        safe_write(sys.stdout, "SSH Connection successful!\n")
    except Exception as e:
        safe_write(sys.stdout, f"ERROR: Cannot connect to VPS: {e}\n")
        return

    # 1. Check if processes are running
    run_cmd(ssh, "ps aux | grep python")

    # 2. Check listening ports
    run_cmd(ssh, "ss -tuln | grep -E '8001|5000'")

    # 3. View brain.log
    run_cmd(ssh, "tail -n 50 /root/cardiac-alert/ai-brain/brain.log")

    # 4. View cam.log
    run_cmd(ssh, "tail -n 50 /root/cardiac-alert/cam.log")

    ssh.close()

if __name__ == "__main__":
    main()
