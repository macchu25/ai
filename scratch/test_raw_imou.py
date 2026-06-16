"""
Raw IMOU API test - bypass imouapi library, call directly with HMAC
"""
import asyncio
import aiohttp
import hashlib
import json
import os
import sys
import time
import random
import string

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'ai-brain', '.env'))

APP_ID = os.getenv("IMOU_APP_ID", "")
APP_SECRET = os.getenv("IMOU_APP_SECRET", "")

def build_sign(app_id, app_secret, nonce, timestamp):
    """Build IMOU API signature"""
    content = f"time:{timestamp},nonce:{nonce},appSecret:{app_secret}"
    return hashlib.md5(content.encode()).hexdigest()

async def call_api(session, base_url, app_id, app_secret, api_name, params=None):
    if params is None:
        params = {}
    timestamp = str(int(time.time()))
    nonce = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    sign = build_sign(app_id, app_secret, nonce, timestamp)
    
    payload = {
        "system": {
            "ver": "1.0",
            "sign": sign,
            "appId": app_id,
            "time": int(timestamp),
            "nonce": nonce
        },
        "params": params
    }
    url = f"{base_url}/{api_name}"
    print(f"  POST {url}")
    print(f"  Payload: {json.dumps(payload, indent=4)}")
    async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
        text = await resp.text()
        print(f"  HTTP {resp.status}: {text[:500]}")
        return resp.status, text

async def main():
    print(f"App ID:     {APP_ID}")
    print(f"App Secret: {APP_SECRET[:8]}...")
    print()
    
    endpoints = [
        ("GLOBAL easy4ip",         "https://openapi.easy4ip.com/openapi"),
        ("EAST ASIA (sg) easy4ip",  "https://openapi-sg.easy4ip.com/openapi"),
        ("CENTRAL EUROPE (fk) easy4ip", "https://openapi-fk.easy4ip.com/openapi"),
        ("WESTERN AMERICA (or) easy4ip", "https://openapi-or.easy4ip.com/openapi"),
        ("CHINA lechange",          "https://openapi.lechange.cn/openapi"),
    ]
    
    async with aiohttp.ClientSession() as session:
        for label, base_url in endpoints:
            print(f"\n{'='*60}")
            print(f"[{label}] {base_url}")
            print(f"{'='*60}")
            try:
                status, body = await call_api(session, base_url, APP_ID, APP_SECRET, "accessToken")
                data = json.loads(body)
                result = data.get("result", {})
                code = result.get("code", "")
                msg = result.get("msg", "")
                if code == "0":
                    token = data.get("data", {}).get("data", {}).get("accessToken", "")
                    print(f"  [SUCCESS] Token: {token[:16]}...")
                    break
                else:
                    print(f"  [ERROR] code={code} msg={msg}")
            except Exception as e:
                print(f"  [EXCEPTION] {type(e).__name__}: {e}")

asyncio.run(main())
