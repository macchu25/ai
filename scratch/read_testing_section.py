import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def read_testing_section(docx_path):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        content = zip_ref.read('word/document.xml')
        root = ET.fromstring(content)
        text_pieces = []
        for node in root.iter():
            if node.tag.endswith('t') and node.text:
                text_pieces.append(node.text)
        
        full_text = "".join(text_pieces)
        
        target = "Testing, Evaluation, and User Feedback"
        idx = full_text.find(target)
        if idx != -1:
            print(f"Found target '{target}' at character {idx}")
            print("=== Section Content ===")
            print(full_text[idx:idx+15000])
        else:
            print("Target not found!")

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    read_testing_section(docx_path)
