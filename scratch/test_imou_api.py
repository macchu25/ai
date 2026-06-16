import sys
import os
import subprocess
import asyncio
import json

# Ensure imouapi is installed
try:
    import imouapi
except ImportError:
    print("Installing missing 'imouapi' package via pip...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "imouapi"])
    import imouapi

import aiohttp
from imouapi.api import ImouAPIClient
from imouapi.device import ImouDiscoverService, ImouDevice

async def run_imou_test(app_id, app_secret):
    print("\n--- IMOU OPEN API TEST ---")
    print(f"App ID: {app_id}")
    print("Connecting to Imou Cloud...")
    
    async with aiohttp.ClientSession() as session:
        client = ImouAPIClient(app_id, app_secret, session)
        try:
            # Connect and authenticate
            await client.async_connect()
            print("Successfully connected & authenticated!")
            # print(f"Access Token: ...")
            
            # Discover devices
            print("\nDiscovering devices...")
            discover_service = ImouDiscoverService(client)
            devices_info = await discover_service.async_discover_devices()
            
            if not devices_info:
                print("No devices found associated with this developer account.")
                return
            
            print(f"Found {len(devices_info)} device(s):")
            for idx, dev in enumerate(devices_info):
                device_id = dev.get("deviceId")
                device_name = dev.get("deviceName", "Unknown Name")
                device_status = dev.get("status", "Unknown Status")
                print(f"[{idx + 1}] ID: {device_id} | Name: {device_name} | Status: {device_status}")
                
                # Fetch detailed device info
                try:
                    device = ImouDevice(client, device_id)
                    await device.async_initialize()
                    print(f"    - Model: {device.model}")
                    print(f"    - Online status: {device.online}")
                    print(f"    - Capabilities: {list(device.capabilities.keys())}")
                except Exception as ex:
                    print(f"    - Error initializing device: {ex}")
                    
        except Exception as e:
            print(f"Error connecting to Imou API: {e}")

if __name__ == "__main__":
    # If app_id and app_secret are provided in command line arguments
    if len(sys.argv) >= 3:
        app_id = sys.argv[1]
        app_secret = sys.argv[2]
    else:
        # Prompt user to enter them or look at environment variables
        app_id = os.environ.get("IMOU_APP_ID")
        app_secret = os.environ.get("IMOU_APP_SECRET")
        
        if not app_id or not app_secret:
            print("Please run this script with App ID and App Secret as arguments:")
            print("python test_imou_api.py <APP_ID> <APP_SECRET>")
            print("\nAlternatively, enter them below:")
            app_id = input("Enter Imou App ID: ").strip()
            app_secret = input("Enter Imou App Secret: ").strip()
            
    if app_id and app_secret:
        asyncio.run(run_imou_test(app_id, app_secret))
    else:
        print("Missing credentials. Exiting.")
