import chromadb
from chromadb.utils import embedding_functions
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import google.generativeai as genai

app = FastAPI()

# Cấu hình Gemini - NÂNG CẤP LÊN 2.5 THEO YÊU CẦU
GEMINI_API_KEY = "AIzaSyBHqgYInid1zXVEXh9Ny2_yPaYqcJPvbfk"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

# Khởi tạo ChromaDB
client_db = chromadb.PersistentClient(path="./chroma_data")
emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

collection = client_db.get_or_create_collection(
    name="casos_intelligence",
    embedding_function=emb_fn
)

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
        # 1. Tìm kiếm ngữ cảnh từ Vector DB (Tăng lên 10 kết quả để chính xác hơn)
        results = collection.query(
            query_texts=[request.query],
            n_results=10
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
