import cv2
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Các IP quét được trong mạng của bạn
IPS = ["192.168.1.64", "192.168.1.116"]

# Các mã an toàn (Safety Code) của camera
SAFETY_CODES = ["L23228B9"]

print("="*60)
print("[*] DANG TU DONG KIEM TRA CAC CAP KET NOI...")
print("="*60)

success_urls = []

for ip in IPS:
    for code in SAFETY_CODES:
        url = f"rtsp://admin:{code}@{ip}:554/cam/realmonitor?channel=1&subtype=1"
        print(f"-> Thu ket noi toi: IP {ip} | Code {code} ...", end="", flush=True)
        
        cap = cv2.VideoCapture(url)
        cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 2000) 
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(" [THANH CONG!]")
                success_urls.append(url)
                cap.release()
                break
            else:
                print(" [THANH CONG NHUNG KHONG DOC ANH]")
        else:
            print(" [THAT BAI - 401/Timeout]")
            
        cap.release()

print("="*60)
if success_urls:
    print(f"[+] CAC DUONG KET NOI THANH CONG:")
    for url in success_urls:
        print(f"    {url}")
else:
    print("[!] KHONG TIM THAY cap IP va Mật khẩu nao trung khop.")
print("="*60)
