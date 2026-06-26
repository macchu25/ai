import os
import sys
import io

def list_videos():
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    search_dirs = [
        r"C:\Users\NHU HUU\Downloads",
        r"C:\Users\NHU HUU\Desktop",
        r"C:\cardiac-alert"
    ]
    
    extensions = (".mp4", ".avi", ".mov", ".webm", ".mkv")
    
    found_videos = []
    for d in search_dirs:
        if not os.path.exists(d):
            continue
        print(f"Scanning {d}...")
        for root, dirs, files in os.walk(d):
            # Exclude node_modules or large hidden folders to speed up
            if any(p in root for p in ["node_modules", ".git", ".next", "venv", "env"]):
                continue
            for f in files:
                if f.lower().endswith(extensions):
                    path = os.path.join(root, f)
                    try:
                        size = os.path.getsize(path) / (1024 * 1024) # MB
                        found_videos.append((path, size))
                    except Exception:
                        pass
                        
    print(f"\nFound {len(found_videos)} video files:")
    for path, size in found_videos:
        print(f"- {path} ({size:.2f} MB)")

if __name__ == '__main__':
    list_videos()
