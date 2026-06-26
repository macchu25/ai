import os
import sys
import io

def inspect_names():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    downloads_dir = r"C:\Users\NHU HUU\Downloads"
    if not os.path.exists(downloads_dir):
        return
        
    print("Files with full names:")
    for f in os.listdir(downloads_dir):
        if "dreamina" in f.lower() or "woman" in f.lower() or "elderly" in f.lower():
            # Check length of name and exact name
            print(f"- Name: {f} (len: {len(f)})")

if __name__ == '__main__':
    inspect_names()
