import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def print_eval_detail(docx_path):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        content = zip_ref.read('word/document.xml')
        root = ET.fromstring(content)
        text_pieces = []
        for node in root.iter():
            if node.tag.endswith('t') and node.text:
                text_pieces.append(node.text)
        
        full_text = "".join(text_pieces)
        
        # Print from character 101600 to 105000
        start = 101600
        end = 105000
        print(f"=== Printing text from {start} to {end} ===")
        print(full_text[start:end])

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    print_eval_detail(docx_path)
