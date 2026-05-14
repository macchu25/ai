import socket
import concurrent.futures
import time
import subprocess

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Không thực sự gửi gói tin nào, chỉ mượn cơ chế định tuyến để lấy IP LAN
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def check_port(ip, port=554, timeout=1.0):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((ip, port))
    sock.close()
    if result == 0:
        return ip
    return None

def scan_network():
    local_ip = get_local_ip()
    print("="*60)
    print(f"[+] CONG CU QUET CAMERA TRONG MANG LAN")
    print("="*60)
    print(f"[*] IP may tinh cua ban: {local_ip}")
    
    parts = local_ip.split('.')
    if len(parts) != 4 or local_ip == '127.0.0.1':
        print("[!] Khong the xac dinh mang noi bo Wifi. Vui long ket noi Wifi truoc!")
        return

    base_ip = f"{parts[0]}.{parts[1]}.{parts[2]}."
    print(f"[*] Dang quet dai mang {base_ip}1 -> {base_ip}254 ...\n")
    
    start_time = time.time()
    found_cams = []
    
    # Quét tất cả các IP trong mạng LAN xem có mở cổng 554 (RTSP) không
    ips_to_scan = [f"{base_ip}{i}" for i in range(1, 255)]
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        results = executor.map(lambda ip: check_port(ip, 554), ips_to_scan)
        
        for ip in results:
            if ip:
                found_cams.append(ip)
                print(f"   [OK] DA TIM THAY CAMERA TAI IP: {ip}")
                
    print("\n" + "-"*60)
    if found_cams:
        print("[*] THONG TIN MAC ADDRESS:")
        # Chạy lệnh arp -a để lấy MAC address nhằm nhận diện hãng
        arp_output = subprocess.getoutput("arp -a")
        for ip in found_cams:
            found_mac = False
            for line in arp_output.split('\n'):
                if ip in line:
                    parts = line.split()
                    if len(parts) >= 2 and ip == parts[0]:
                        print(f"    -> IP: {ip:<15} | MAC Address: {parts[1].upper()}")
                        found_mac = True
                        break
            if not found_mac:
                print(f"    -> IP: {ip:<15} | MAC Address: (Khong xac dinh)")
        
        print("\n[*] HUONG DAN:")
        print("Hay lay IP o tren va lap vao duong link RTSP de thu tren VLC.")
        print("Vi du: rtsp://192.168.1.xxx:554/stream1")
    else:
        print("[-] KHONG TIM THAY CAMERA NAO! (Khong co IP nao mo port 554)")
        print("\nCac ly do co the:")
        print("1. Camera chua duoc ket noi chung mang Wifi voi may tinh nay.")
        print("2. Camera cua hang nay khong ho tro RTSP (Rat hiem).")
        print("3. Cong RTSP cua hang nay khong phai la 554.")
        
    print(f"\n[*] Thoi gian quet: {time.time() - start_time:.2f} giay.")
    print("="*60)

if __name__ == "__main__":
    scan_network()
