import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyBHqgYInid1zXVEXh9Ny2_yPaYqcJPvbfk"
genai.configure(api_key=GEMINI_API_KEY)

print("--- AVAILABLE MODELS ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
