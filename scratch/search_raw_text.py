import sys
import io
import re

def search_text_file(txt_path):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    with open(txt_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # We want to find:
    # 1. heart rate / HR / BPM / rPPG error/deviation/accuracy/RMSE/MAE/lệch
    # Let's search for "BPM" or "Bvp" or "rPPG" or "heart rate" or "accuracy"
    kws = ["MAE", "RMSE", "error", "deviation", "accuracy", "oximeter", "smartwatch", "bpm", "pulse", "lệch", "sai số"]
    
    print(f"Total text length: {len(text)}")
    
    for kw in kws:
        matches = [m.start() for m in re.finditer(re.escape(kw), text, re.IGNORECASE)]
        print(f"\nKeyword '{kw}' found {len(matches)} times:")
        for idx in matches[:10]: # Limit to first 10 occurrences
            start = max(0, idx - 150)
            end = min(len(text), idx + 150)
            snippet = text[start:end].replace('\n', ' ')
            print(f"  - [{idx}]: ... {snippet} ...")

if __name__ == '__main__':
    search_text_file(r"c:\cardiac-alert\scratch\BaoCao_text.txt")
