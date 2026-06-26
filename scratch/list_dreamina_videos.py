import os
import sys
import io

def list_dreamina():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    downloads_dir = r"C:\Users\NHU HUU\Downloads"
    if not os.path.exists(downloads_dir):
        print("Downloads folder not found.")
        return
        
    print("Files starting with 'dreamina' in Downloads:")
    for f in os.listdir(downloads_dir):
        if f.lower().startswith("dreamina"):
            print(f"- {f}")

if __name__ == '__main__':
    list_dreamina()
