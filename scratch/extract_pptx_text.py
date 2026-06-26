import zipfile
import re
import xml.etree.ElementTree as ET

def extract_text_from_pptx(pptx_path):
    text_runs = []
    try:
        with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
            # List all slide XML files
            slide_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slides/slide')]
            # Sort them numerically
            slide_files.sort(key=lambda x: [int(c) if c.isdigit() else c for c in re.split(r'(\d+)', x)])
            
            for slide_file in slide_files:
                slide_content = zip_ref.read(slide_file)
                root = ET.fromstring(slide_content)
                # Find all text elements
                slide_text = []
                for node in root.iter():
                    if node.tag.endswith('t'): # Text tag in OpenXML is <a:t> or <w:t>
                        if node.text:
                            slide_text.append(node.text)
                text_runs.append((slide_file, " ".join(slide_text)))
    except Exception as e:
        print(f"Error reading pptx: {e}")
    return text_runs

if __name__ == '__main__':
    pptx_path = r"c:\cardiac-alert\outputs\CAS_startup_pitch_deck.pptx"
    slides = extract_text_from_pptx(pptx_path)
    for slide, text in slides:
        print(f"=== {slide} ===")
        print(text)
        print()
