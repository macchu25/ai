from google import genai

GEMINI_API_KEY = "AIzaSyBHqgYInid1zXVEXh9Ny2_yPaYqcJPvbfk"
ai_client = genai.Client(api_key=GEMINI_API_KEY)

print("--- AVAILABLE MODELS ---")
try:
    for m in ai_client.models.list():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
