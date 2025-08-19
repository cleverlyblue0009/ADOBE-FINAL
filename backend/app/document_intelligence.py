import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List
from .outline_core import extract_outline_blocks, LineBlock
from . import scoring

# --------------------------------------------------------------------------------------
# Build sections: heading text + concatenated body until next heading
# --------------------------------------------------------------------------------------
def build_sections_from_blocks(title_block, blocks: List[LineBlock], doc_name: str) -> List[Dict[str, Any]]:
    """
    Converts LineBlocks into logical sections for scoring.
    Each section:
      doc, heading, page, text
    """
    sections = []
    current_heading = None
    current_text: List[str] = []
    current_pages = set()

    def flush():
        nonlocal current_heading, current_text, current_pages
        if current_heading:
            sections.append({
                "doc": doc_name,
                "heading": current_heading.text,
                "page": min(current_pages) if current_pages else current_heading.page,
                "text": " ".join(current_text).strip()
            })
        current_heading = None
        current_text = []
        current_pages = set()

    for b in blocks:
        if b.tag == "TITLE":
            continue
        if b.tag == "HEADING":
            flush()
            current_heading = b
            current_text = []
            current_pages = {b.page}
        else:  # BODY
            if current_heading is not None:
                current_text.append(b.text)
                current_pages.add(b.page)
            else:
                # body text before first heading -> ignore
                pass

    flush()

    # fallback: no headings found -> whole doc
    if not sections:
        text_all = " ".join([b.text for b in blocks if b.tag != "TITLE"]).strip()
        sections.append({
            "doc": doc_name,
            "heading": doc_name,
            "page": 1,
            "text": text_all
        })

    return sections

# --------------------------------------------------------------------------------------
# Rank sections by persona+job relevance
# --------------------------------------------------------------------------------------
def rank_sections(persona: str, job: str, sections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    query = scoring.build_query(persona, job)
    kw = scoring.build_keywords(persona, job)
    headings = [s["heading"] for s in sections]
    texts = [s["text"] for s in sections]
    scores = scoring.combined_scores(query, headings, texts, kw)
    for s, sc in zip(sections, scores):
        s["score"] = float(sc)
    sections.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(sections, start=1):
        s["importance_rank"] = i
    return sections

# --------------------------------------------------------------------------------------
# Sub-section drilldown (snippets)
# --------------------------------------------------------------------------------------
SNIP_SPLIT_RE = re.compile(r"(?<=[\.!?])\s+|[\r\n]+|•")

def extract_subsections(section: Dict[str, Any],
                        persona: str,
                        job: str,
                        max_snips: int = 3) -> List[Dict[str, Any]]:
    """
    Break section text into candidate snippets and score them quickly
    against the persona+job query. Returns top snippets.
    """
    text = section["text"]
    if not text:
        return []

    # candidate splits
    parts = []
    for seg in SNIP_SPLIT_RE.split(text):
        seg = seg.strip()
        if not seg:
            continue
        # de-bullet
        seg = re.sub(r"^[•\-\*\u2022●◦]\s*", "", seg)
        parts.append(seg)

    if not parts:
        return []

    # score snippets using TF-IDF vs query
    query = scoring.build_query(persona, job)
    scores = scoring.tfidf_scores(query, parts)
    order = scores.argsort()[::-1]  # high->low

    out = []
    base_page = section["page"]  # cheap fallback; we don't track fine-grained snippet pages
    for idx in order[:max_snips]:
        out.append({
            "document": section["doc"],
            "refined_text": parts[idx],
            "page_number": base_page
        })
    return out

# --------------------------------------------------------------------------------------
# Main document intelligence processing
# --------------------------------------------------------------------------------------
def process_documents_intelligence(pdf_paths: List[str], 
                                   persona: str, 
                                   job: str,
                                   topk_sections: int = 20,
                                   max_snips_per_section: int = 3) -> Dict[str, Any]:
    """
    Process multiple PDFs using document intelligence to find relevant sections.
    Returns structured output with ranked sections and subsections.
    """
    start = time.time()

    # --- per-PDF section extraction ---
    all_sections: List[Dict[str, Any]] = []
    for pdf_path in pdf_paths:
        doc_name = os.path.basename(pdf_path)
        try:
            title, blocks = extract_outline_blocks(pdf_path)
        except Exception as e:
            print(f"ERROR: Failed to parse '{doc_name}': {e}")
            continue
        secs = build_sections_from_blocks(title, blocks, doc_name)
        all_sections.extend(secs)

    if not all_sections:
        return {
            "metadata": {
                "input_documents": [],
                "persona": persona,
                "job_to_be_done": job,
                "processing_timestamp": datetime.utcnow().isoformat()
            },
            "extracted_sections": [],
            "subsection_analysis": []
        }

    # --- rank sections ---
    ranked = rank_sections(persona, job, all_sections)

    # --- select top K ---
    top_sections = ranked[: min(len(ranked), topk_sections)]

    # --- sub-section analysis ---
    all_sub = []
    for sec in top_sections:
        subs = extract_subsections(sec, persona, job, max_snips=max_snips_per_section)
        all_sub.extend(subs)

    # --- output JSON (hackathon expected format) ---
    out = {
        "metadata": {
            "input_documents": [os.path.basename(p) for p in pdf_paths],
            "persona": persona,
            "job_to_be_done": job,
            "processing_timestamp": datetime.utcnow().isoformat()
        },
        "extracted_sections": [
            {
                "document": s["doc"],
                "section_title": s["heading"],
                "importance_rank": s["importance_rank"],
                "page_number": s["page"],
                "relevance_score": s["score"]
            }
            for s in top_sections
        ],
        "subsection_analysis": all_sub
    }

    elapsed = time.time() - start
    print(f"Document intelligence: processed {len(pdf_paths)} PDFs in {elapsed:.2f}s")
    
    return out

def find_related_sections(current_page: int, 
                         current_section: str,
                         persona: str,
                         job: str,
                         all_sections: List[Dict[str, Any]],
                         limit: int = 3) -> List[Dict[str, Any]]:
    """
    Find sections related to the current reading position using Round 1B logic.
    This implements a multi-pass approach with enhanced scoring and contextual analysis.
    """
    if not all_sections:
        return []
    
    # Round 1B Logic: Multi-pass relevance scoring
    
    # Pass 1: Basic filtering and initial scoring
    filtered_sections = [s for s in all_sections if s.get("page_number", s.get("page", 0)) != current_page]
    
    if not filtered_sections:
        return []
    
    # Pass 2: Enhanced contextual scoring
    if current_section:
        # Build enhanced query with context
        query = f"{persona} {job} {current_section}"
        kw = scoring.build_keywords(persona, job) | scoring.keyword_set(current_section)
        
        # Get section data for scoring
        headings = [s.get("section_title", "Unknown Section") for s in filtered_sections]
        texts = [s.get("section_title", "") + " " + s.get("text", "") for s in filtered_sections]
        
        # Calculate multiple scoring dimensions
        base_scores = scoring.combined_scores(query, headings, texts, kw)
        
        # Pass 3: Contextual boosting based on section relationships
        for i, section in enumerate(filtered_sections):
            base_score = float(base_scores[i])
            
            # Boost score based on document proximity (same document sections are more relevant)
            current_doc = _get_current_document_from_page(current_page, all_sections)
            if current_doc and section.get("document") == current_doc:
                base_score *= 1.3  # 30% boost for same document
            
            # Boost score based on importance rank if available
            importance_rank = section.get("importance_rank", 10)
            if importance_rank <= 5:
                base_score *= 1.2  # 20% boost for high importance
            
            # Boost score based on section type/level
            section_title = section.get("section_title", "")
            if any(indicator in section_title.lower() for indicator in ["conclusion", "summary", "key", "important"]):
                base_score *= 1.15  # 15% boost for key sections
            
            section["contextual_score"] = base_score
        
        # Pass 4: Diversification - ensure we don't get all sections from the same document
        filtered_sections.sort(key=lambda x: x.get("contextual_score", 0), reverse=True)
        
        # Apply diversification to avoid clustering
        diversified_sections = []
        seen_documents = set()
        
        for section in filtered_sections:
            doc_name = section.get("document", "Unknown")
            if len(diversified_sections) < limit:
                diversified_sections.append(section)
                seen_documents.add(doc_name)
            elif doc_name not in seen_documents and len(diversified_sections) < limit * 2:
                # Add diverse sections up to 2x limit, then trim
                diversified_sections.append(section)
                seen_documents.add(doc_name)
        
        # Final selection: take top sections with diversity
        filtered_sections = diversified_sections[:limit]
    else:
        # Fallback: use original relevance scores if available
        filtered_sections.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        filtered_sections = filtered_sections[:limit]
    
    # Pass 5: Generate enhanced explanations
    related = []
    for i, section in enumerate(filtered_sections):
        explanation = generate_enhanced_relevance_explanation(section, current_section, persona, job)
        related.append({
            "document": section.get("document", "Unknown Document"),
            "section_title": section.get("section_title", "Unknown Section"),
            "page_number": section.get("page_number", 1),
            "relevance_score": section.get("contextual_score", section.get("relevance_score", 0)),
            "explanation": explanation
        })
    
    return related

def _get_current_document_from_page(current_page: int, all_sections: List[Dict[str, Any]]) -> str:
    """Helper function to determine which document the current page belongs to."""
    for section in all_sections:
        if section.get("page_number", section.get("page", 0)) == current_page:
            return section.get("document", "Unknown Document")
    return None

def generate_enhanced_relevance_explanation(section: Dict[str, Any], 
                                         current_section: str,
                                         persona: str, 
                                         job: str) -> str:
    """
    Generate an enhanced explanation of why a section is relevant using Round 1B logic.
    """
    section_text = section.get("text", "")
    section_title = section.get("section_title", "")
    document = section.get("document", "Unknown Document")
    relevance_score = section.get("contextual_score", section.get("relevance_score", 0))
    
    # Enhanced keyword analysis
    persona_keywords = scoring.keyword_set(persona)
    job_keywords = scoring.keyword_set(job)
    current_keywords = scoring.keyword_set(current_section) if current_section else set()
    section_keywords = scoring.keyword_set(section_text + " " + section_title)
    
    # Find overlapping concepts
    common_persona = persona_keywords & section_keywords
    common_job = job_keywords & section_keywords
    common_current = current_keywords & section_keywords
    
    # Determine relationship type
    relationship_type = "complementary"
    if relevance_score > 0.8:
        relationship_type = "highly relevant"
    elif relevance_score > 0.6:
        relationship_type = "closely related"
    elif common_current:
        relationship_type = "topically connected"
    
    # Build contextual explanation
    explanation_parts = []
    
    # Primary relevance reason
    if common_persona and common_job:
        key_terms = list((common_persona | common_job))[:3]
        explanation_parts.append(f"Addresses {', '.join(key_terms)} directly relevant to your role and objectives")
    elif common_current and len(common_current) >= 2:
        key_terms = list(common_current)[:2]
        explanation_parts.append(f"Builds upon concepts like {', '.join(key_terms)} from your current reading")
    elif common_persona:
        key_terms = list(common_persona)[:2]
        explanation_parts.append(f"Contains insights about {', '.join(key_terms)} relevant to your {persona.lower()} role")
    elif common_job:
        key_terms = list(common_job)[:2]
        explanation_parts.append(f"Provides information about {', '.join(key_terms)} for your {job.lower()}")
    
    # Add document context if different document
    if document and current_section:
        if "current document" not in document.lower():
            explanation_parts.append(f"from {document}")
    
    # Add relevance qualifier
    if relevance_score > 0.7:
        explanation_parts.append("with high contextual relevance")
    elif relevance_score > 0.5:
        explanation_parts.append("with moderate contextual relevance")
    
    # Combine explanation parts
    if explanation_parts:
        explanation = " ".join(explanation_parts).capitalize()
        if not explanation.endswith('.'):
            explanation += "."
        return explanation
    else:
        # Fallback to original logic
        return generate_relevance_explanation(section, current_section, persona, job)

def generate_relevance_explanation(section: Dict[str, Any], 
                                 current_section: str,
                                 persona: str, 
                                 job: str) -> str:
    """
    Generate a brief explanation of why a section is relevant (fallback method).
    """
    # Simple heuristic-based explanation generation
    section_text = section.get("text", "")
    section_title = section.get("section_title", "")
    
    # Check for common keywords
    persona_keywords = scoring.keyword_set(persona)
    job_keywords = scoring.keyword_set(job)
    section_keywords = scoring.keyword_set(section_text + " " + section_title)
    
    common_persona = persona_keywords & section_keywords
    common_job = job_keywords & section_keywords
    
    if common_persona and common_job:
        return f"Contains relevant information about {', '.join(list(common_persona)[:2])} related to your {job.lower()}."
    elif common_persona:
        return f"Discusses {', '.join(list(common_persona)[:2])} which aligns with your role as {persona.lower()}."
    elif common_job:
        return f"Provides insights relevant to {', '.join(list(common_job)[:2])} for your task."
    else:
        return f"Contains complementary information that may support your understanding."