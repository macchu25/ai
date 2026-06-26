import zipfile
import re
import xml.etree.ElementTree as ET
import os
import sys
import io

def extract_text_from_xml(xml_content):
    root = ET.fromstring(xml_content)
    text_pieces = []
    for node in root.iter():
        if node.tag.endswith('t') or node.tag == 't':
            if node.text:
                text_pieces.append(node.text)
    return "".join(text_pieces)

def search_docx_unconstrained(file_path):
    if not os.path.exists(file_path):
        return
    try:
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            if 'word/document.xml' in zip_ref.namelist():
                content = zip_ref.read('word/document.xml')
                text = extract_text_from_xml(content)
                
                # Split text into sentences using simple regex
                sentences = re.split(r'(?<=[.!?])\s+', text)
                
                kws = ["MAE", "RMSE", "mean absolute", "deviation", "error", "accuracy", "bpm"]
                found = []
                for s in sentences:
                    s_lower = s.lower()
                    if any(kw.lower() in s_lower for kw in kws):
                        # Filter to sentences containing numbers, as metrics usually have numbers (like 1.5, 2%, etc.)
                        if re.search(r'\d', s):
                            found.append(s)
                
                print(f"\n=========================================")
                print(f"FILE: {file_path} - Found {len(found)} matches")
                print(f"=========================================")
                for idx, s in enumerate(found[:50]): # Print up to 50 matches
                    print(f"{idx+1}. {s.strip()}")
                    print("-" * 30)
            else:
                print(f"FILE: {file_path} (No word/document.xml)")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    search_docx_unconstrained(docx_path)
