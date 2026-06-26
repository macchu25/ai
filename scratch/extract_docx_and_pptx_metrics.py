import zipfile
import re
import xml.etree.ElementTree as ET
import os

def extract_text_from_xml(xml_content):
    root = ET.fromstring(xml_content)
    # The namespaces in word/document.xml or ppt/slides/slide*.xml
    # We can just iterate all elements and find tags that end with 't'
    text_pieces = []
    for node in root.iter():
        if node.tag.endswith('}t') or node.tag == 't':
            if node.text:
                text_pieces.append(node.text)
    return " ".join(text_pieces)

def search_docx(docx_path):
    print(f"--- Searching Docx: {docx_path} ---")
    if not os.path.exists(docx_path):
        print("File does not exist.")
        return
    
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            # Main document body is in word/document.xml
            if 'word/document.xml' in zip_ref.namelist():
                doc_content = zip_ref.read('word/document.xml')
                text = extract_text_from_xml(doc_content)
                search_text(text)
            else:
                print("No word/document.xml found.")
    except Exception as e:
        print(f"Error: {e}")

def search_pptx(pptx_path):
    print(f"--- Searching Pptx: {pptx_path} ---")
    if not os.path.exists(pptx_path):
        print("File does not exist.")
        return
    
    try:
        with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
            slide_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slides/slide')]
            slide_files.sort(key=lambda x: [int(c) if c.isdigit() else c for c in re.split(r'(\d+)', x)])
            
            all_slide_texts = []
            for slide_file in slide_files:
                slide_content = zip_ref.read(slide_file)
                text = extract_text_from_xml(slide_content)
                all_slide_texts.append(text)
            
            full_pptx_text = " \n ".join(all_slide_texts)
            search_text(full_pptx_text)
    except Exception as e:
        print(f"Error: {e}")

def search_text(text):
    # Find matching sentences or surrounding text for key phrases
    keywords = ["MAE", "RMSE", "lệch", "sai số", "nhịp tim", "rPPG", "độ chính xác"]
    # Split text into sentences using simple regex
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    matches = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw.lower() in s_lower for kw in keywords):
            # Check if it has numbers, which might indicate error metrics
            if re.search(r'\d', s):
                matches.append(s)
                
    print(f"Found {len(matches)} matches:")
    for i, match in enumerate(matches[:40]):
        # Print with UTF-8 encoding safely in Python on Windows
        print(f"{i+1}. {match.strip()}")
        print("-" * 40)

if __name__ == '__main__':
    # Set sys.stdout to handle utf-8 printing properly
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    docx_path1 = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    docx_path2 = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu.docx"
    pptx_path = r"c:\cardiac-alert\outputs\CAS_startup_pitch_deck.pptx"
    
    search_docx(docx_path1)
    print("\n" + "="*80 + "\n")
    search_pptx(pptx_path)
