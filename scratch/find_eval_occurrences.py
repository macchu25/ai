import zipfile
import xml.etree.ElementTree as ET
import sys
import io

def find_eval_occurrences(docx_path):
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
        
        # Find all occurrences of target
        idx = 0
        while True:
            idx = full_text.find(target, idx)
            if idx == -1:
                break
            print(f"Found occurrence at character {idx}:")
            snippet = full_text[idx:idx+250]
            print(f"Snippet: {snippet}")
            print("-" * 50)
            idx += len(target)

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    find_eval_occurrences(docx_path)
