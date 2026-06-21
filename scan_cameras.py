import socket
import concurrent.futures
import time
import subprocess
import re

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

def check_ip_active(ip):
    # 1. Thử Ping nhanh (300ms)
    try:
        res = subprocess.run(['ping', '-n', '1', '-w', '300', ip], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode == 0:
            return ip, "Ping"
    except Exception:
        pass
    
    # 2. Thử các cổng phổ biến nếu Ping bị chặn
    common_ports = [80, 443, 554, 8000, 8899, 37777]
    for port in common_ports:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.15)
        result = sock.connect_ex((ip, port))
        sock.close()
        if result == 0:
            return ip, f"Port {port}"
    return None

def scan_network():
    local_ip = get_local_ip()
    print("="*60)
    print(f"[+] CONG CU QUET THIET BI TRONG MANG LAN")
    print("="*60)
    print(f"[*] IP may tinh cua ban: {local_ip}")
    
    parts = local_ip.split('.')
    if len(parts) != 4 or local_ip == '127.0.0.1':
        print("[!] Khong the xac dinh mang noi bo Wifi. Vui long ket noi Wifi truoc!")
        return

    base_ip = f"{parts[0]}.{parts[1]}.{parts[2]}."
    print(f"[*] Dang quet dai mang {base_ip}1 -> {base_ip}254 ...\n")
    
    start_time = time.time()
    active_devices = []
    
    ips_to_scan = [f"{base_ip}{i}" for i in range(1, 255)]
    
    # Sử dụng ThreadPoolExecutor để quét song song
    with concurrent.futures.ThreadPoolExecutor(max_workers=80) as executor:
        results = executor.map(check_ip_active, ips_to_scan)
        for res in results:
            if res:
                ip, method = res
                active_devices.append((ip, method))
                print(f"   [+] DA TIM THAY THIET BI: {ip:<15} (Phan hoi qua: {method})")
                
    print("\n" + "-"*60)
    if active_devices:
        print("[*] BANG CHI TIET THIET BI & DIENT THOAI/CAMERA TRONG MANG:")
        arp_output = subprocess.getoutput("arp -a")
        
        # Parse bảng ARP để lấy địa chỉ MAC
        arp_map = {}
        for line in arp_output.split('\n'):
            line = line.strip()
            if not line:
                continue
            parts_line = line.split()
            if len(parts_line) >= 2:
                ip_arp = parts_line[0]
                mac_arp = parts_line[1].upper()
                arp_map[ip_arp] = mac_arp

        # Định nghĩa các MAC prefix phổ biến của camera
        mac_vendors = {
            "34-5A-60": "Dahua / Imou Camera",
            "3C-E5-A6": "Dahua / Imou Camera",
            "98-F1-70": "Dahua / Imou Camera",
            "A0-BD-CD": "Dahua / Imou Camera",
            "B0-C5-54": "Dahua / Imou Camera",
            "D8-0D-17": "Dahua / Imou Camera",
            "D8-B3-77": "Dahua / Imou Camera",
            "D0-50-99": "Hikvision / Ezviz Camera",
            "A4-14-37": "Hikvision / Ezviz Camera",
            "B4-A3-82": "Hikvision / Ezviz Camera",
            "F4-CF-A2": "Hikvision / Ezviz Camera",
            "04-18-D6": "Hikvision / Ezviz Camera",
            "70-BD-BC": "Hikvision / Ezviz Camera",
            "B8-A3-86": "Hikvision / Ezviz Camera",
            "70-A6-CC": "Ezviz / Hikvision Camera",
            "E0-50-8B": "Ezviz / Hikvision Camera",
            "44-01-BB": "Ezviz / Hikvision Camera",
        }

        for ip, method in active_devices:
            mac = arp_map.get(ip, "(Khong xac dinh)")
            vendor = "Unknown Device"
            if mac != "(Khong xac dinh)":
                for pref, name in mac_vendors.items():
                    if mac.replace(":", "-").startswith(pref):
                        vendor = name
                        break
            
            # Quét cụ thể các cổng quan trọng để phân loại
            open_ports = []
            for p in [80, 554, 8899, 37777, 8000]:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.1)
                if sock.connect_ex((ip, p)) == 0:
                    open_ports.append(str(p))
                sock.close()
            
            ports_str = ", ".join(open_ports) if open_ports else "None"
            print(f"    -> IP: {ip:<15} | MAC: {mac:<17} | Ports: {ports_str:<12} | Vendor: {vendor}")
            
        print("\n[*] HUONG DAN:")
        print("1. Neu thiet bi co mo Port 554, do la camera RTSP.")
        print("   Duong dan RTSP mac dinh thuong la:")
        print("   - Dahua/Imou: rtsp://admin:mat_khau@IP:554/cam/realmonitor?channel=1&subtype=0")
        print("   - Hikvision/Ezviz: rtsp://admin:mat_khau@IP:554/h264/ch1/main/av_stream")
        print("2. Neu la camera Imou/Ezviz ma khong thay Port 554 mo, ban can vao ung dung")
        print("   tren dien thoai va bat tinh nang 'Lien ket ONVIF' hoac 'Lan Link' truoc.")
    else:
        print("[-] KHONG TIM THAY THIET BI NAO HOAT DONG!")
        
    print(f"\n[*] Thoi gian quet: {time.time() - start_time:.2f} giay.")
    print("="*60)

if __name__ == "__main__":
    scan_network()
