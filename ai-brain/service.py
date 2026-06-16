import chromadb
from chromadb.utils import embedding_functions
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import aiohttp
from imouapi.api import ImouAPIClient
from imouapi.device_entity import ImouCamera

app = FastAPI()

from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Cấu hình Gemini - NÂNG CẤP LÊN 2.5 THEO YÊU CẦU
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in the environment or .env file")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

# Khởi tạo ChromaDB
client_db = chromadb.PersistentClient(path="./chroma_data")
emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

collection = client_db.get_or_create_collection(
    name="casos_intelligence",
    embedding_function=emb_fn
)

class ImouCredentials(BaseModel):
    app_id: str
    app_secret: str
    region: str = "global"

IMOU_GLOBAL_API = "https://openapi.easy4ip.com/openapi"


def extract_imou_stream_url(live_data: dict) -> str:
    """Parse HLS/FLV/RTMP URL from IMOU bindDeviceLive / getLiveStreamInfo responses."""
    if not live_data:
        return ""
    for key in ("hls", "flv", "rtmp"):
        url = live_data.get(key)
        if isinstance(url, str) and url.startswith("http"):
            return url
    streams = live_data.get("streams") or []
    for stream in streams:
        if not isinstance(stream, dict):
            continue
        hls = stream.get("hls", "")
        if isinstance(hls, str) and hls.startswith("http"):
            if str(stream.get("status", "1")) in ("1", "true"):
                return hls
    for stream in streams:
        if not isinstance(stream, dict):
            continue
        hls = stream.get("hls", "")
        if isinstance(hls, str) and hls.startswith("http"):
            return hls
    return ""


async def fetch_imou_live_url(client: ImouAPIClient, device_id: str, device_name: str) -> tuple[str, str]:
    """Return (stream_url, stream_error). Always uses international easy4ip API."""
    last_error = ""
    profiles = [("hd", "HD"), ("sd", "SD")]

    for bind_profile, camera_profile in profiles:
        try:
            live_data = await client.async_api_bindDeviceLive(device_id, bind_profile)
            stream_url = extract_imou_stream_url(live_data)
            if stream_url:
                return stream_url, ""
        except Exception as e:
            err_str = str(e)
            last_error = err_str
            if "LV1001" in err_str:
                try:
                    info_data = await client.async_api_getLiveStreamInfo(device_id)
                    stream_url = extract_imou_stream_url(info_data)
                    if stream_url:
                        return stream_url, ""
                except Exception as info_err:
                    last_error = str(info_err)

    for _, camera_profile in profiles:
        try:
            camera = ImouCamera(client, device_id, device_name, "camera", camera_profile)
            url = await camera.async_get_stream_url()
            if isinstance(url, str) and url.startswith("http"):
                return url, ""
            if isinstance(url, dict):
                nested = url.get("url") or url.get("hls") or ""
                if isinstance(nested, str) and nested.startswith("http"):
                    return nested, ""
        except Exception as e:
            last_error = str(e)

    if "OP1009" in last_error:
        return "", "OP1009: App chưa được cấp quyền Live Stream. Vào IMOU Open Platform → Products & Services → Device Access Service để bật."
    if last_error:
        return "", last_error
    return "", "Không lấy được link live stream từ IMOU. Kiểm tra camera online và quyền Live Stream trên Open Platform."


@app.post("/imou/devices")
async def get_imou_devices(creds: ImouCredentials):
    try:
        async with aiohttp.ClientSession() as session:
            client = ImouAPIClient(creds.app_id, creds.app_secret, session)
            # Camera IMOU tại Việt Nam dùng nền tảng quốc tế (easy4ip), không dùng lechange.cn
            client.set_base_url(IMOU_GLOBAL_API)
            await client.async_connect()
            
            # Fetch devices
            devices_data = await client.async_api_deviceBaseList()
            print("--- RAW DEVICES DATA FROM IMOU ---")
            print(devices_data)
            
            # Write debug info to a file
            try:
                import json as json_debug
                debug_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scratch", "imou_debug.json")
                os.makedirs(os.path.dirname(debug_path), exist_ok=True)
                with open(debug_path, "w", encoding="utf-8") as f:
                    json_debug.dump(devices_data, f, indent=2, ensure_ascii=False)
            except Exception as debug_err:
                print(f"Failed to write debug file: {debug_err}")
                
            device_list = devices_data.get("deviceList", [])
            
            results = []
            for dev_data in device_list:
                device_id = dev_data.get("deviceId")
                
                # Resolve device name (often located inside channels list on domestic platform)
                channels = dev_data.get("channels", [])
                channel_name = ""
                if channels and len(channels) > 0:
                    channel_name = channels[0].get("channelName", "")
                
                device_name = dev_data.get("name")
                if not device_name:
                    device_name = dev_data.get("deviceName")
                if not device_name:
                    device_name = channel_name
                if not device_name:
                    device_name = "IMOU Camera"
                
                # Query actual online/offline status from deviceOnline API
                is_online = False
                try:
                    status_data = await client.async_api_deviceOnline(device_id)
                    print(f"--- DEVICE ONLINE STATUS FOR {device_id} ---")
                    print(status_data)
                    online_val = status_data.get("onLine", "0")
                    is_online = str(online_val) in ["1", "4", "online", "true"]
                except Exception as status_err:
                    print(f"Error querying status for device {device_id}: {status_err}")
                    # Fallback to dev_data properties
                    raw_status = dev_data.get("status")
                    if raw_status is None:
                        raw_status = dev_data.get("statusStatus", "0")
                    is_online = str(raw_status).lower() in ["1", "4", "online", "true"]
                
                stream_url = ""
                stream_error = ""
                if is_online:
                    stream_url, stream_error = await fetch_imou_live_url(client, device_id, device_name)
                    print(f"--- LIVE URL FOR {device_id}: {stream_url[:80] if stream_url else 'EMPTY'} ---")
                    if stream_error:
                        print(f"--- LIVE URL ERROR: {stream_error} ---")

                
                results.append({
                    "id": device_id,
                    "name": device_name,
                    "status": "online" if is_online else "offline",
                    "stream_url": stream_url,
                    "stream_error": stream_error
                })

            return {"success": True, "devices": results, "raw_devices": device_list}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

class DocumentItem(BaseModel):
    id: str
    text: str
    metadata: dict

class ChatRequest(BaseModel):
    query: str

@app.post("/index")
async def index_document(item: DocumentItem):
    try:
        collection.add(
            ids=[item.id],
            documents=[item.text],
            metadatas=[item.metadata]
        )
        return {"status": "success", "message": f"Indexed document {item.id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # 1. Tìm kiếm ngữ cảnh từ Vector DB (Giảm xuống 4 kết quả để giảm latency)
        results = collection.query(
            query_texts=[request.query],
            n_results=4
        )
        
        context_docs = results['documents'][0]
        context_text = "\n".join(context_docs)
        
        # 2. Tạo prompt cho Gemini: Lịch sự, đầy đủ chủ ngữ vị ngữ
        prompt = f"""
        Bạn là trợ lý AI chuyên nghiệp của hệ thống 'Casos'. 
        Nhiệm vụ: Trả lời câu hỏi dựa trên NGỮ CẢNH được cung cấp.
        
        Quy tắc trả lời:
        - Trả lời đầy đủ câu, có chủ ngữ và vị ngữ rõ ràng (Lịch sự).
        - Nếu người dùng hỏi về danh sách (ví dụ: các camera, các gói), hãy liệt kê TOÀN BỘ mục tìm thấy.
        - PHÂN BIỆT: Các hướng dẫn sử dụng (như Hủy gói, Kết nối Telegram, Sơ cứu) là thông tin công khai, CẦN trả lời chi tiết. 
        - TUYỆT ĐỐI KHÔNG tiết lộ các bí mật kỹ thuật (như DB, Redis, cấu trúc code, thuật toán chi tiết).
        - Nếu bị hỏi về bí mật kỹ thuật, hãy khéo léo từ chối và hướng dẫn họ liên hệ bộ phận hỗ trợ kỹ thuật.
        - Trình bày sạch sẽ, sử dụng dấu gạch đầu dòng (-) cho danh sách.
        - Ngôn ngữ: Tiếng Việt.

        NGỮ CẢNH HỆ THỐNG:
        {context_text}

        CÂU HỎI CỦA NGƯỜI DÙNG:
        {request.query}
        """

        # 3. Gọi Gemini API
        response = model.generate_content(prompt)
        
        return {
            "query": request.query,
            "context": context_text,
            "answer": response.text.strip()
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            "query": request.query,
            "answer": f"Lỗi AI 2.5: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
