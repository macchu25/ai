import socket
import uuid
import re

def ws_discovery():
    # SOAP XML Probe Message
    msg_id = str(uuid.uuid4())
    probe = f"""<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns="http://www.w3.org/2003/05/soap-envelope" xmlns:dn="http://www.onvif.org/ver10/network/wsdl">
  <Header>
    <a:MessageID xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">urn:uuid:{msg_id}</a:MessageID>
    <a:To xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">urn:schemas-xmlsoap-org:relationships:reconciliation</a:To>
    <a:Action xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>
  </Header>
  <Body>
    <Probe xmlns="http://schemas.xmlsoap.org/ws/2005/04/discovery">
      <Types>dn:NetworkVideoTransmitter</Types>
    </Probe>
  </Body>
</Envelope>"""

    # Create socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.settimeout(5.0)
    
    # Enable multicast
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    
    multicast_group = '239.255.255.250'
    port = 3702
    
    print(f"Sending WS-Discovery Probe to {multicast_group}:{port}...")
    sock.sendto(probe.encode('utf-8'), (multicast_group, port))
    
    # Also send a broader probe
    probe_broad = f"""<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://www.w3.org/2003/05/soap-envelope">
  <Header>
    <a:MessageID xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">urn:uuid:{str(uuid.uuid4())}</a:MessageID>
    <a:To xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">urn:schemas-xmlsoap-org:relationships:reconciliation</a:To>
    <a:Action xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>
  </Header>
  <Body>
    <Probe xmlns="http://schemas.xmlsoap.org/ws/2005/04/discovery"/>
  </Body>
</Envelope>"""
    sock.sendto(probe_broad.encode('utf-8'), (multicast_group, port))
    
    devices = {}
    try:
        while True:
            data, addr = sock.recvfrom(65535)
            ip = addr[0]
            xml_str = data.decode('utf-8', errors='ignore')
            print(f"\n[+] Received response from {ip}")
            # Try to parse device info/service URLs
            xaddrs = re.findall(r'<[^:]*:XAddrs>([^<]+)</[^:]*:XAddrs>', xml_str)
            if not xaddrs:
                xaddrs = re.findall(r'XAddrs="([^"]+)"', xml_str)
            types = re.findall(r'<[^:]*:Types>([^<]+)</[^:]*:Types>', xml_str)
            scopes = re.findall(r'<[^:]*:Scopes>([^<]+)</[^:]*:Scopes>', xml_str)
            
            devices[ip] = {
                'ip': ip,
                'xaddrs': xaddrs,
                'types': types,
                'scopes': scopes,
                'raw': xml_str
            }
            print(f"    XAddrs: {xaddrs}")
            print(f"    Types: {types}")
            if scopes:
                scope_list = scopes[0].split()
                name_scope = [s for s in scope_list if 'name/' in s]
                hardware_scope = [s for s in scope_list if 'hardware/' in s]
                print(f"    Name: {name_scope}")
                print(f"    Hardware: {hardware_scope}")
    except socket.timeout:
        print("\nWS-Discovery finished.")
    
    return devices

if __name__ == "__main__":
    ws_discovery()
