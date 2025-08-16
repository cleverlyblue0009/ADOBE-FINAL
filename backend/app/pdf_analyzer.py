import json
import os
import re
import fitz  # PyMuPDF
from collections import defaultdict
from langdetect import detect
from typing import List, Dict, Any, Optional

def extract_text_with_metadata(pdf_path: str):
    """Extract text blocks with metadata from PDF using PyMuPDF."""
    document = fitz.open(pdf_path)
    text_blocks = []
    for page_num in range(document.page_count):
        page = document.load_page(page_num)
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if b["type"] == 0:
                for line in b["lines"]:
                    full_line_text = " ".join([span["text"] for span in line["spans"]]).strip()
                    if not full_line_text:
                        continue
                    first_span = line["spans"][0]
                    
                    # Extract font formatting information
                    is_bold = False
                    is_italic = False
                    font_name = first_span.get("font", "").lower()
                    
                    # Check for bold/italic in font flags or font name
                    if first_span.get("flags") is not None:
                        flags = first_span["flags"]
                        is_bold = bool(flags & 2**4)  # Bold flag
                        is_italic = bool(flags & 2**1)  # Italic flag
                    
                    # Also check font name for bold/italic indicators
                    if not is_bold:
                        is_bold = any(bold_indicator in font_name for bold_indicator in ['bold', 'black', 'heavy', 'demi'])
                    if not is_italic:
                        is_italic = any(italic_indicator in font_name for italic_indicator in ['italic', 'oblique'])
                    
                    text_blocks.append({
                        "text": full_line_text,
                        "page": page_num,
                        "font_size": first_span["size"],
                        "bbox": line["bbox"],
                        "is_bold": is_bold,
                        "is_italic": is_italic,
                        "font_name": font_name
                    })
    document.close()
    return text_blocks

def get_heading_hierarchy(text_blocks):
    """Determine heading hierarchy based on font sizes."""
    font_size_counts = defaultdict(int)
    for block in text_blocks:
        font_size_counts[round(block["font_size"], 2)] += 1
    unique_sizes = sorted(font_size_counts.keys(), reverse=True)
    if not unique_sizes:
        return {}
    body_text_size = sorted(font_size_counts.items(), key=lambda item: item[1], reverse=True)[0][0]
    heading_candidates = [
        size for size in unique_sizes 
        if size > body_text_size * 1.1 and font_size_counts[size] < len(text_blocks) * 0.10
    ]
    size_to_level_map = {}
    levels = ["H1", "H2", "H3", "H4"] 
    for i, size in enumerate(heading_candidates[:len(levels)]):
        size_to_level_map[size] = levels[i]
    return size_to_level_map

def get_pdf_title(text_blocks):
    """Extract the title from PDF text blocks."""
    if not text_blocks:
        return ""
    first_page_blocks = [b for b in text_blocks if b["page"] == 0]
    if not first_page_blocks:
        return ""
    first_page_blocks.sort(key=lambda x: (x["font_size"], x["bbox"][1]), reverse=True)
    max_font_size = first_page_blocks[0]["font_size"]
    potential_title_lines = [
        b for b in first_page_blocks 
        if b["font_size"] >= max_font_size * 0.9 and b["bbox"][1] < 400 
    ]
    potential_title_lines.sort(key=lambda x: x["bbox"][1])
    combined_title = ""
    last_y = -1
    last_x = -1
    line_count = 0
    title_lines = []
    for block in potential_title_lines:
        text = block["text"].strip()
        if len(text) < 10 or text.lower() == text:
            continue
        if not title_lines:
            title_lines.append(text)
        elif abs(block["bbox"][1] - last_y) < 25:
            title_lines.append(text)
        else:
            break
        last_y = block["bbox"][3]
    combined_title = " ".join(title_lines)
    return combined_title.strip()

def is_form_pdf(text_blocks):
    """Detect if PDF is a form-based document."""
    if len(text_blocks) > 300:
        return False
    if len(text_blocks) < 20:
        return False
    short_lines = sum(1 for b in text_blocks if len(b['text'].split()) <= 5)
    return short_lines / len(text_blocks) > 0.5

def detect_headings(text_blocks, title):
    """Detect headings in the PDF text blocks."""
    if not text_blocks:
        return []
    if is_form_pdf(text_blocks):
        large_blocks = [b for b in text_blocks if b['font_size'] > 15 and len(b['text'].split()) > 2]
        if not large_blocks:
            return []
    outline = []
    size_to_level_map = get_heading_hierarchy(text_blocks)
    seen_headings_on_page = defaultdict(set) 
    font_size_counts = defaultdict(int)
    for block in text_blocks:
        font_size_counts[round(block["font_size"], 2)] += 1
    body_text_size = sorted(font_size_counts, key=font_size_counts.get, reverse=True)[0]
    
    # Enhanced heading detection with more criteria and lower thresholds
    for block in text_blocks:
        text = block["text"].strip()
        page = block["page"]
        font_size = round(block["font_size"], 2)
        
        # Skip title and page numbers
        if text == title or text in title:
            continue
        if re.match(r'^\s*Page\s+\d+\s*$', text, re.IGNORECASE):
            continue
        if re.match(r'^\s*\d+\s*$', text):  # Skip standalone numbers
            continue
        if len(text) > 150 and font_size < max(size_to_level_map.keys()) if size_to_level_map else False:
            continue

        level = None
        
        # Pattern-based detection (numbered sections) - expanded patterns
        if re.match(r'^\d+\.\d+\.\d+\.\d+\s', text): 
            level = "H4"
        elif re.match(r'^\d+\.\d+\.\d+\s', text): 
            level = "H3"
        elif re.match(r'^\d+\.\d+\s', text): 
            level = "H2"
        elif re.match(r'^\d+\.\s', text) and len(text.split()) > 1:
            level = "H1"
        
        # Roman numeral patterns
        elif re.match(r'^[IVX]+\.\s', text) and len(text.split()) > 1:
            level = "H1"
        elif re.match(r'^[ivx]+\.\s', text) and len(text.split()) > 1:
            level = "H2"
            
        # Letter patterns
        elif re.match(r'^[A-Z]\.\s', text) and len(text.split()) > 1:
            level = "H2"
        elif re.match(r'^[a-z]\.\s', text) and len(text.split()) > 1:
            level = "H3"
        
        # Parenthetical numbering
        elif re.match(r'^\(\d+\)\s', text) and len(text.split()) > 1:
            level = "H3"
        elif re.match(r'^\([a-z]\)\s', text) and len(text.split()) > 1:
            level = "H4"
            
        # Skip lines that are clearly not headings
        if ':' in text and len(text.split(':')[-1].strip().split()) > 6:
            continue
            
        # Font-size based detection (improved with lower thresholds)
        if level is None and font_size >= body_text_size:
            word_count = len(text.split())
            
            # All uppercase short text (likely headings) - more lenient
            if text.isupper() and 1 <= word_count <= 12:
                if font_size > body_text_size * 1.05:
                    level = "H1"
                else:
                    level = "H2"
            # Mixed case but larger font - more lenient thresholds
            elif font_size > body_text_size * 1.15 and 1 <= word_count <= 15:
                level = "H1"
            elif font_size > body_text_size * 1.08 and 1 <= word_count <= 15:
                level = "H2"
            # Even slightly larger font with moderate word count
            elif font_size > body_text_size * 1.02 and 1 <= word_count <= 12:
                level = "H3"
                
        # Font size mapping from hierarchy (more lenient)
        if level is None and font_size in size_to_level_map:
            if len(text) < 120 and text.count('.') < 4 and text.count(' ') < 25:
                level = size_to_level_map[font_size]
        
        # Enhanced bold text detection using actual font formatting
        if level is None:
            word_count = len(text.split())
            is_bold = block.get("is_bold", False)
            
            # Bold text is a strong indicator of headings
            if is_bold and 1 <= word_count <= 25:
                # Bold text with larger font size
                if font_size >= body_text_size * 1.15:
                    level = "H1"
                elif font_size >= body_text_size * 1.05:
                    level = "H2"
                elif font_size >= body_text_size * 0.95:
                    level = "H3"
                # Even bold text at normal size can be a heading if it looks like one
                elif text[0].isupper() and 3 <= word_count <= 15:
                    level = "H3"
            
            # Fallback to font size based detection for non-bold text
            elif not is_bold and font_size >= body_text_size * 1.01:
                if 1 <= word_count <= 20 and not text.lower() == text:
                    # Check if it looks like a heading (starts with capital, reasonable length)
                    if text[0].isupper() and 8 <= len(text) <= 100:
                        level = "H3"
        
        # Additional patterns for common heading styles
        if level is None:
            word_count = len(text.split())
            # Chapter/Section patterns
            if re.match(r'^(Chapter|Section|Part|Appendix|Article|Unit)\s+\d+', text, re.IGNORECASE):
                level = "H1"
            elif re.match(r'^(Summary|Conclusion|Introduction|Abstract|Overview|Background|Methodology|Results|Discussion|References|Bibliography|Acknowledgments)', text, re.IGNORECASE):
                level = "H1"
            # Question patterns
            elif text.endswith('?') and 3 <= word_count <= 15:
                level = "H3"
            # Title case patterns (more lenient)
            elif text.istitle() and 2 <= word_count <= 12 and font_size >= body_text_size:
                level = "H3"
            # Colon endings (common in headings)
            elif text.endswith(':') and 1 <= word_count <= 8 and font_size >= body_text_size:
                level = "H3"
        
        # Position-based hints (beginning of page, significant whitespace)
        if level is None and font_size >= body_text_size * 0.98:
            word_count = len(text.split())
            # If it's at the top of a page and reasonably formatted
            if block.get("bbox") and block["bbox"][1] < 150:  # Near top of page
                if 2 <= word_count <= 15 and text[0].isupper():
                    level = "H3"
        
        # Skip very short or very long texts that don't look like headings
        if len(text.strip()) < 2:
            continue
        if level is None and len(text) > 120:
            continue
            
        if level:
            item_key = (text, page)
            if item_key not in seen_headings_on_page[page]:
                cleaned_text = text.rstrip(" .")
                outline.append({
                    "level": level,
                    "text": cleaned_text,
                    "page": page + 1  # Convert to 1-based page numbering for frontend
                })
                seen_headings_on_page[page].add(item_key)
    return outline

def analyze_pdf(pdf_path: str):
    """Analyze PDF and extract title and outline structure."""
    try:
        text_blocks = extract_text_with_metadata(pdf_path)
        sample_text = " ".join([b['text'] for b in text_blocks[:30]])
        try:
            doc_language = detect(sample_text)
        except:
            doc_language = "unknown"
        print(f"Detected language: {doc_language}")

        title = get_pdf_title(text_blocks)
        outline = detect_headings(text_blocks, title)

        if not outline and text_blocks:
            first_page_blocks = [b for b in text_blocks if b["page"] == 0]
            if first_page_blocks:
                largest = max(first_page_blocks, key=lambda b: b["font_size"])
                if largest["text"].strip() and largest["text"].strip() != title:
                    outline = [{
                        "level": "H1",
                        "text": largest["text"].strip(),
                        "page": 0
                    }]
        return {
            "title": title,
            "outline": outline,
            "language": doc_language,
            "text_blocks": text_blocks
        }
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return {"title": "", "outline": [], "language": "unknown", "text_blocks": []}

def extract_full_text(pdf_path: str) -> str:
    """Extract full text content from PDF for search and analysis."""
    try:
        document = fitz.open(pdf_path)
        full_text = ""
        for page_num in range(document.page_count):
            page = document.load_page(page_num)
            full_text += page.get_text() + "\n"
        document.close()
        return full_text
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return ""