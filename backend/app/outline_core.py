# outline_core.py
import re
import fitz
from dataclasses import dataclass
from typing import List, Tuple, Optional
from collections import defaultdict

# Enhanced thresholds for better heading detection
MAX_WORDS_HEADING = 20  # Increased to catch longer headings
UPPERCASE_RATIO_MIN = 0.2  # Significantly lowered to catch mixed case headings
MIN_HEADING_SCORE = 1.0  # Lowered to be more inclusive
GAP_THRESH = 3  # Lowered to detect headings with smaller gaps

BULLET_START_TOKENS = ("•", "-", "–", "*", "·", "o", "●", "◦")
PUNCT = set(",.;:!?()[]{}'\"")

@dataclass
class LineBlock:
    text: str
    page: int
    bbox: Tuple[float, float, float, float]
    font_size: float
    is_bold: bool
    caps_ratio: float
    font_rank: int
    tag: str = "BODY"   # BODY | HEADING | TITLE

def _clean_space(t: str) -> str:
    import re
    return re.sub(r"\s+", " ", t).strip()

def _caps_ratio(t: str) -> float:
    letters = [c for c in t if c.isalpha()]
    if not letters: 
        return 0.0
    return sum(c.isupper() for c in letters) / len(letters)

def _is_bullet(t: str) -> bool:
    t = t.lstrip()
    if t.startswith(BULLET_START_TOKENS): 
        return True
    return bool(re.match(r"^\d+[\.\)]\s+", t))

def _is_bold_font(font_name: str) -> bool:
    """Enhanced bold detection with more font variations."""
    font_lower = font_name.lower()
    bold_indicators = [
        'bold', 'black', 'semibold', 'demibold', 'heavy', 'extrabold', 
        'ultrabold', 'thick', 'dark', 'medium', 'semib', 'demi'
    ]
    return any(indicator in font_lower for indicator in bold_indicators)

def _extract_page_lines(page):
    out = []
    d = page.get_text("dict")
    for blk in d.get("blocks", []):
        if blk.get("type", 0) != 0: 
            continue
        for ln in blk.get("lines", []):
            spans = ln.get("spans", [])
            if not spans: 
                continue
            parts = []
            max_sz = 0.0
            is_bold = False
            bold_weight = 0
            x0 = y0 = x1 = y1 = None
            
            for s in spans:
                txt = s.get("text", "")
                if txt: 
                    parts.append(txt)
                sz = float(s.get("size", 0))
                if sz > max_sz: 
                    max_sz = sz
                
                # Enhanced bold detection
                fn = s.get("font", "")
                font_flags = s.get("flags", 0)
                
                # Check font name for bold indicators
                if _is_bold_font(fn):
                    bold_weight += 2
                
                # Check font flags (bit 4 = bold in some PDFs)
                if font_flags & (1 << 4):  # Bold flag
                    bold_weight += 2
                
                # Check font weight if available
                font_weight = s.get("weight", 400)
                if font_weight >= 600:  # Semi-bold or bold
                    bold_weight += 1
                elif font_weight >= 500:  # Medium weight
                    bold_weight += 0.5
                
                sx0, sy0, sx1, sy1 = s.get("bbox", (0, 0, 0, 0))
                x0 = sx0 if x0 is None else min(x0, sx0)
                y0 = sy0 if y0 is None else min(y0, sy0)
                x1 = sx1 if x1 is None else max(x1, sx1)
                y1 = sy1 if y1 is None else max(y1, sy1)
            
            # Determine if text is bold based on accumulated weight
            is_bold = bold_weight >= 1
            
            text = _clean_space(" ".join(parts))
            if not text: 
                continue
            out.append((text, (x0, y0, x1, y1), is_bold, max_sz))
    return out

def _score_line(text, caps, font_rank, is_bold, gap_above):
    # Enhanced scoring with more inclusive approach
    s = 0.0
    
    # Skip obvious bullet points
    if _is_bullet(text): 
        return -5.0
    
    # Less penalty for lowercase start (many headings are sentence case)
    if text and text[0].islower(): 
        s -= 1.0  # Reduced penalty
    
    # Reduced penalty for common prepositions
    if text.lower().startswith(("in ", "on ", "at ", "for ", "of ", "to ", "by ")): 
        s -= 0.5  # Reduced penalty
    
    # Enhanced font rank scoring
    if font_rank == 0: 
        s += 2.0  # Increased bonus for largest font
    elif font_rank == 1: 
        s += 1.5  # Increased bonus
    elif font_rank == 2: 
        s += 1.2  # Increased bonus
    elif font_rank == 3:
        s += 1.0  # Increased bonus
    elif font_rank == 4:
        s += 0.8  # Added scoring for 5th largest font
    elif font_rank <= 6:
        s += 0.5  # Some bonus for reasonably large fonts
    
    # Significantly increased bold bonus
    if is_bold: 
        s += 1.5  # Major bonus for bold text
    
    w = len(text.split())
    if w <= MAX_WORDS_HEADING: 
        s += 1.5
    if w <= 5: 
        s += 1.0  # Increased bonus for short text
    if w <= 8:  # Additional bonus for medium-short headings
        s += 0.5
        
    # More lenient capitalization scoring
    if caps >= 0.8:  # Very high caps
        s += 1.2
    elif caps >= UPPERCASE_RATIO_MIN: 
        s += 0.8
    elif caps >= 0.1:  # Some caps
        s += 0.3
    # No penalty for low caps - many headings are sentence case
    
    # Enhanced pattern-based bonuses
    import re
    # Numbered sections (more patterns)
    if re.match(r'^\d+\.?\d*\.?\s', text):  # 1., 1.1, 1.1.1, etc.
        s += 1.5
    elif re.match(r'^[A-Z]\.?\s', text):  # A., B., etc.
        s += 1.2
    elif re.match(r'^[IVX]+\.?\s', text):  # I., II., III., etc.
        s += 1.2
    elif re.match(r'^\([a-zA-Z0-9]+\)', text):  # (a), (1), etc.
        s += 1.0
    
    # Common heading words (expanded list)
    heading_words = [
        'chapter', 'section', 'introduction', 'conclusion', 'summary', 
        'overview', 'background', 'methodology', 'results', 'discussion',
        'abstract', 'appendix', 'references', 'bibliography', 'executive',
        'table of contents', 'contents', 'index', 'glossary', 'preface',
        'acknowledgments', 'foreword', 'part', 'volume', 'book', 'unit',
        'lesson', 'exercise', 'problem', 'solution', 'example', 'case',
        'study', 'analysis', 'evaluation', 'assessment', 'review',
        'objective', 'goal', 'purpose', 'scope', 'definition', 'concept',
        'theory', 'principle', 'method', 'approach', 'technique', 'process',
        'procedure', 'step', 'phase', 'stage', 'level', 'degree', 'grade',
        'key', 'main', 'primary', 'secondary', 'important', 'critical',
        'essential', 'fundamental', 'basic', 'advanced', 'final', 'initial'
    ]
    text_lower = text.lower()
    if any(word in text_lower for word in heading_words):
        s += 1.0  # Increased bonus
    
    # Question headings
    if text.endswith('?') and w <= 12:  # Increased word limit
        s += 0.8
    
    # Colon endings (often indicate section headers)
    if text.endswith(':') and w <= 10:
        s += 0.8
    
    # All caps short text (likely headings)
    if caps >= 0.9 and w <= 6:
        s += 1.0
    
    # Punctuation analysis (more lenient)
    punct = sum(ch in PUNCT for ch in text)
    if punct >= 4:  # Only penalize heavy punctuation
        s -= 0.3
    elif punct == 0 and w > 1:  # Bonus for no punctuation in multi-word text
        s += 0.5
        
    # Gap analysis (more sensitive)
    if gap_above > GAP_THRESH * 2: 
        s += 1.0  # Large gap bonus
    elif gap_above > GAP_THRESH: 
        s += 0.7
    elif gap_above > GAP_THRESH / 2:
        s += 0.4
    
    # Length-based adjustments (more lenient)
    if len(text) < 3:  # Very short text penalty
        s -= 1.5
    elif 3 <= len(text) <= 80:  # Good heading length bonus
        s += 0.5
    elif len(text) > 150:  # Too long penalty
        s -= 0.8
    
    # Bonus for text that looks like a heading structurally
    if text.count('.') <= 1 and not text.endswith('.') and w >= 2:
        s += 0.3
    
    # Bonus for centered or indented text (common in headings)
    # This would require bbox analysis which we have available
    
    return s

def extract_outline_blocks(pdf_path: str):
    doc = fitz.open(pdf_path)
    # collect raw
    raw = []
    for pidx in range(doc.page_count):
        page = doc.load_page(pidx)
        for text, bbox, is_bold, max_sz in _extract_page_lines(page):
            raw.append({
                "text": text,
                "page": pidx + 1,  # Convert to 1-based page numbering
                "bbox": bbox,
                "is_bold": is_bold,
                "font_size": max_sz
            })
    doc.close()
    
    if not raw:
        return None, []
    
    # rank font sizes
    uniq = sorted({round(r["font_size"], 2) for r in raw}, reverse=True)
    rankmap = {sz: i for i, sz in enumerate(uniq)}
    
    # build block objects
    blocks = []
    for r in raw:
        text = r["text"]
        caps = _caps_ratio(text)
        blocks.append(LineBlock(
            text=text,
            page=r["page"],  # Already 1-based from _extract_page_lines
            bbox=r["bbox"],
            font_size=r["font_size"],
            is_bold=r["is_bold"],
            caps_ratio=caps,
            font_rank=rankmap[round(r["font_size"], 2)],
        ))
    
    # compute gaps & score
    title = None
    for i, b in enumerate(blocks):
        prev = blocks[i-1] if i > 0 else None
        if prev is None or prev.page != b.page:
            gap_above = 9999
        else:
            gap_above = b.bbox[1] - prev.bbox[3]
        s = _score_line(b.text, b.caps_ratio, b.font_rank, b.is_bold, gap_above)
        if b.page == 1 and b.caps_ratio > 0.7 and (title is None or b.font_size > title.font_size):
            title = b
        if s >= MIN_HEADING_SCORE: 
            b.tag = "HEADING"
    
    if title: 
        title.tag = "TITLE"
    
    return title, blocks