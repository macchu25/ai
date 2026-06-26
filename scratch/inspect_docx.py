import zipfile
import re
import xml.etree.ElementTree as ET
import os
import sys
import io

def inspect_docx(docx_path):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    if not os.path.exists(docx_path):
        print("File does not exist.")
        return
    
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        namelist = zip_ref.namelist()
        if 'word/document.xml' in namelist:
            content = zip_ref.read('word/document.xml')
            root = ET.fromstring(content)
            text_pieces = []
            for node in root.iter():
                if node.tag.endswith('t') and node.text:
                    text_pieces.append(node.text)
            
            full_text = "".join(text_pieces)
            print(f"Extracted text length: {len(full_text)} characters")
            
            # Search keywords
            kws = ["MAE", "RMSE", "error", "deviation", "accuracy", "precision", "recall", "oximeter", "smartwatch", "reference", "evaluation", "ground truth", "deviation"]
            print("\nKeyword positions and contexts:")
            for kw in kws:
                pos = 0
                count = 0
                while True:
                    idx = full_text.lower().find(kw.lower(), pos)
                    if idx == -1:
                        break
                    count += 1
                    start = max(0, idx - 150)
                    end = min(len(full_text), idx + 150)
                    snippet = full_text[start:end].replace('\n', ' ')
                    print(f"[{kw}] at char {idx}: ... {snippet} ...")
                    pos = idx + len(kw)
                    if count >= 10: # Show up to 10 occurrences
                        print(f" (truncated further matches for {kw})")
                        break
        else:
            print("No word/document.xml found!")

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    inspect_docx(docx_path)
