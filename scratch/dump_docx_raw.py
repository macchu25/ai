import zipfile
import xml.etree.ElementTree as ET
import os

def dump_docx_to_txt(docx_path, txt_path):
    if not os.path.exists(docx_path):
        print(f"File {docx_path} does not exist.")
        return
    
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        if 'word/document.xml' in zip_ref.namelist():
            content = zip_ref.read('word/document.xml')
            root = ET.fromstring(content)
            text_pieces = []
            for node in root.iter():
                if node.tag.endswith('t') or node.tag == 't':
                    if node.text:
                        text_pieces.append(node.text)
            
            full_text = "".join(text_pieces)
            
            # Also read headers/footers which might contain text!
            header_footers = [f for f in zip_ref.namelist() if 'header' in f or 'footer' in f]
            hf_texts = []
            for hf in header_footers:
                try:
                    hf_content = zip_ref.read(hf)
                    hf_root = ET.fromstring(hf_content)
                    hf_pieces = []
                    for node in hf_root.iter():
                        if node.tag.endswith('t') or node.tag == 't':
                            if node.text:
                                hf_pieces.append(node.text)
                    hf_texts.append(f"=== {hf} ===\n" + "".join(hf_pieces))
                except Exception as e:
                    print(f"Error reading header/footer {hf}: {e}")
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
                if hf_texts:
                    f.write("\n\n=== HEADERS & FOOTERS ===\n")
                    f.write("\n\n".join(hf_texts))
            print(f"Successfully dumped to {txt_path}. Total length: {len(full_text)} characters.")
        else:
            print("No word/document.xml found.")

if __name__ == '__main__':
    docx_path = r"C:\Users\NHU HUU\Downloads\BaoCao_DATN_MacNhuHuu (1).docx"
    txt_path = r"c:\cardiac-alert\scratch\BaoCao_text.txt"
    dump_docx_to_txt(docx_path, txt_path)
