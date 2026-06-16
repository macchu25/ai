import asyncio
import aiohttp
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'ai-brain', '.env'))

APP_ID = os.getenv("IMOU_APP_ID", "")
APP_SECRET = os.getenv("IMOU_APP_SECRET", "")

ENDPOINTS = [
    ("GLOBAL (easy4ip)", "https://openapi.easy4ip.com/openapi"),
    ("CHINA  (lechange)", "https://openapi.lechange.cn/openapi"),
]

async def try_endpoint(app_id, app_secret, label, base_url):
    print(f"\n{'='*50}")
    print(f"[TEST] {label}")
    print(f"       URL: {base_url}")
    print(f"{'='*50}")
    try:
        async with aiohttp.ClientSession() as session:
            from imouapi.api import ImouAPIClient
            client = ImouAPIClient(app_id, app_secret, session)
            client.set_base_url(base_url)
            await client.async_connect()
            print(f"[OK] Auth success!")

            # Get devices
            devices_data = await client.async_api_deviceBaseList()
            device_list = devices_data.get("deviceList", [])
            print(f"[OK] Found {len(device_list)} device(s)")

            for dev in device_list:
                device_id = dev.get("deviceId")
                channels = dev.get("channels", [])
                name = channels[0].get("channelName", device_id) if channels else device_id
                print(f"\n     Device: [{device_id}] {name}")

                # Online check
                try:
                    status = await client.async_api_deviceOnline(device_id)
                    is_online = str(status.get("onLine", "0")) in ["1", "4"]
                    print(f"     Status: {'ONLINE' if is_online else 'OFFLINE'}")
                except Exception as e:
                    print(f"     Status error: {e}")
                    is_online = False

                if not is_online:
                    continue

                # bindDeviceLive HD
                print(f"     [>] bindDeviceLive(hd)...")
                try:
                    live = await client.async_api_bindDeviceLive(device_id, "hd")
                    print(f"     Result: {json.dumps(live, indent=6)}")
                    hls = live.get("hls", "")
                    if hls:
                        print(f"     [!!] HLS URL: {hls}")
                except Exception as e:
                    print(f"     ERROR: {e}")

                # bindDeviceLive SD
                print(f"     [>] bindDeviceLive(sd)...")
                try:
                    live = await client.async_api_bindDeviceLive(device_id, "sd")
                    print(f"     Result: {json.dumps(live, indent=6)}")
                except Exception as e:
                    print(f"     ERROR: {e}")

                # getLiveStreamInfo
                print(f"     [>] getLiveStreamInfo...")
                try:
                    info = await client.async_api_getLiveStreamInfo(device_id)
                    print(f"     Result: {json.dumps(info, indent=6)}")
                except Exception as e:
                    print(f"     ERROR: {e}")

            return True
    except Exception as e:
        print(f"[FAIL] {label}: {e}")
        return False

async def main():
    print(f"App ID: {APP_ID}")
    print(f"App Secret: {APP_SECRET[:6]}...")
    for label, url in ENDPOINTS:
        ok = await try_endpoint(APP_ID, APP_SECRET, label, url)
        if ok:
            print(f"\n>>> SUCCESS with {label} <<<")
            break

asyncio.run(main())
