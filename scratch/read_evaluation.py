import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def read_eval_section(docx_path):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        content = zip_ref.read('word/document.xml')
        root = ET.fromstring(content)
        text_pieces = []
        for node in root.iter():
            if node.tag.endswith('t') and node.text:
                text_pieces.append(node.text)
        
        full_text = "".join(text_pieces)
        
        # We want to search for sections:
        # 1. "Testing, Evaluation, and User Feedback"
        # 2. "rPPG"
        # Let's print out the text between 100000 and 115000
        start_idx = 100000
        end_idx = 115000
        print(f"=== Printing text from {start_idx} to {end_idx} ===")
        print(full_text[start_idx:end_idx])

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    read_eval_section(docx_path)
