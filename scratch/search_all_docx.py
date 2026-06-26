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

def search_in_file(file_path):
    if not os.path.exists(file_path):
        return
    try:
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            if 'word/document.xml' in zip_ref.namelist():
                content = zip_ref.read('word/document.xml')
                text = extract_text_from_xml(content)
                
                # Check for rPPG error, MAE, RMSE, deviation, difference, oximeter, smartwatch, etc.
                kws = ["MAE", "RMSE", "error", "deviation", "accuracy", "oximeter", "smartwatch", "difference", "ground truth", "pulse"]
                sentences = re.split(r'(?<=[.!?])\s+', text)
                
                found = []
                for s in sentences:
                    s_lower = s.lower()
                    # We want to find sentences mentioning rppg or heart rate or vital signs, and having some numbers or error terms
                    if ("rppg" in s_lower or "heart" in s_lower or "vital" in s_lower or "vitals" in s_lower or "nhip tim" in s_lower or "nhịp tim" in s_lower) and any(kw.lower() in s_lower for kw in kws):
                        found.append(s)
                
                if found:
                    print(f"\n=========================================")
                    print(f"FILE: {file_path}")
                    print(f"=========================================")
                    for idx, s in enumerate(found[:20]):
                        print(f"{idx+1}. {s.strip()}")
                        print("-" * 30)
            else:
                print(f"FILE: {file_path} (No word/document.xml)")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    files = [
        r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx",
        r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu.docx",
        r"C:\Users\NHU HUU\Downloads\BaoCaoThucTapTotNghiep_MacNhuHuu_22ITEB037.docx",
        r"C:\Users\NHU HUU\Downloads\BaoCaoThucTapTotNghiep_MacNhuHuu_22ITEB037 (1).docx",
        r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_NguyenHau_AnhHoang6.docx"
    ]
    for f in files:
        search_in_file(f)
