import os
import asyncio
import aiofiles
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import json

# Local imports
from .pdf_analyzer import analyze_pdf, extract_full_text
from .document_intelligence import process_documents_intelligence, find_related_sections
from .llm_services import LLMService
from .tts_service import TTSService

app = FastAPI(title="DocuSense API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Adjust for your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for documents and analysis results
documents_store: Dict[str, Dict[str, Any]] = {}
analysis_cache: Dict[str, Dict[str, Any]] = {}

# Pydantic models
class DocumentInfo(BaseModel):
    id: str
    name: str
    title: str
    outline: List[Dict[str, Any]]
    language: str
    upload_timestamp: str
    persona: Optional[str] = None
    job_to_be_done: Optional[str] = None
    tags: List[str] = []

class AnalysisRequest(BaseModel):
    document_ids: List[str]
    persona: str
    job_to_be_done: str

class RelatedSectionsRequest(BaseModel):
    document_ids: List[str]
    current_page: int
    current_section: str
    persona: str
    job_to_be_done: str

class InsightsRequest(BaseModel):
    text: str
    persona: str
    job_to_be_done: str
    document_context: Optional[str] = None

class PodcastRequest(BaseModel):
    text: str
    related_sections: List[str]
    insights: List[str]

class SimplifyTextRequest(BaseModel):
    text: str
    difficulty_level: str = "simple"  # simple, moderate, advanced

class TermDefinitionRequest(BaseModel):
    term: str
    context: str

# Initialize services
llm_service = LLMService()
tts_service = TTSService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("audio_cache", exist_ok=True)
    print("DocuSense API started successfully")

@app.get("/")
async def root():
    return {"message": "DocuSense API is running", "version": "1.0.0"}

@app.post("/upload-pdfs", response_model=List[DocumentInfo])
async def upload_pdfs(
    files: List[UploadFile] = File(...),
    persona: str = Form(None),
    job_to_be_done: str = Form(None)
):
    """Upload and process multiple PDF files with persona and job context."""
    uploaded_docs = []
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            continue
            
        # Generate unique ID and save file
        doc_id = str(uuid.uuid4())
        file_path = f"uploads/{doc_id}.pdf"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Analyze PDF
        try:
            analysis = analyze_pdf(file_path)
            
            doc_info = DocumentInfo(
                id=doc_id,
                name=file.filename,
                title=analysis["title"] or file.filename,
                outline=analysis["outline"],
                language=analysis.get("language", "unknown"),
                upload_timestamp=datetime.utcnow().isoformat(),
                persona=persona,
                job_to_be_done=job_to_be_done,
                tags=[]
            )
            
            # Store document info and analysis
            documents_store[doc_id] = {
                "info": doc_info.dict(),
                "file_path": file_path,
                "analysis": analysis
            }
            
            uploaded_docs.append(doc_info)
            
        except Exception as e:
            print(f"Error analyzing {file.filename}: {e}")
            # Clean up failed upload
            if os.path.exists(file_path):
                os.remove(file_path)
            continue
    
    return uploaded_docs

@app.get("/documents", response_model=List[DocumentInfo])
async def get_documents():
    """Get list of all uploaded documents."""
    return [doc["info"] for doc in documents_store.values()]

@app.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """Get specific document information."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents_store[doc_id]["info"]

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file
    file_path = documents_store[doc_id]["file_path"]
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Remove from store
    del documents_store[doc_id]
    
    return {"message": "Document deleted successfully"}

@app.post("/analyze-documents")
async def analyze_documents(request: AnalysisRequest):
    """Analyze documents using persona and job context."""
    # Validate document IDs
    pdf_paths = []
    for doc_id in request.document_ids:
        if doc_id not in documents_store:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
        pdf_paths.append(documents_store[doc_id]["file_path"])
    
    # Process with document intelligence
    try:
        analysis_result = process_documents_intelligence(
            pdf_paths=pdf_paths,
            persona=request.persona,
            job=request.job_to_be_done,
            topk_sections=20,
            max_snips_per_section=3
        )
        
        # Cache analysis result
        cache_key = f"{'-'.join(request.document_ids)}_{request.persona}_{request.job_to_be_done}"
        analysis_cache[cache_key] = analysis_result
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/related-sections")
async def get_related_sections(request: RelatedSectionsRequest):
    """Get sections related to current reading position."""
    # Find cached analysis or run new analysis
    cache_key = f"{'-'.join(request.document_ids)}_{request.persona}_{request.job_to_be_done}"
    
    if cache_key not in analysis_cache:
        # Run analysis first
        pdf_paths = []
        for doc_id in request.document_ids:
            if doc_id not in documents_store:
                raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
            pdf_paths.append(documents_store[doc_id]["file_path"])
        
        analysis_result = process_documents_intelligence(
            pdf_paths=pdf_paths,
            persona=request.persona,
            job=request.job_to_be_done
        )
        analysis_cache[cache_key] = analysis_result
    
    analysis_result = analysis_cache[cache_key]
    all_sections = analysis_result.get("extracted_sections", [])
    
    # Find related sections
    related = find_related_sections(
        current_page=request.current_page,
        current_section=request.current_section,
        persona=request.persona,
        job=request.job_to_be_done,
        all_sections=all_sections,
        limit=3
    )
    
    return {"related_sections": related}

@app.post("/insights")
async def generate_insights(request: InsightsRequest):
    """Generate AI insights for current text using LLM."""
    try:
        insights = await llm_service.generate_insights(
            text=request.text,
            persona=request.persona,
            job_to_be_done=request.job_to_be_done,
            context=request.document_context
        )
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")

@app.post("/comprehensive-insights")
async def generate_comprehensive_insights(request: InsightsRequest):
    """Generate comprehensive AI insights with web search and persona analysis."""
    try:
        comprehensive_insights = await llm_service.generate_comprehensive_insights(
            text=request.text,
            persona=request.persona,
            job_to_be_done=request.job_to_be_done,
            document_context=request.document_context
        )
        return comprehensive_insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive insights generation failed: {str(e)}")

@app.post("/podcast")
async def generate_podcast(request: PodcastRequest):
    """Generate podcast audio for current section."""
    try:
        # Generate script using LLM
        script = await llm_service.generate_podcast_script(
            text=request.text,
            related_sections=request.related_sections,
            insights=request.insights
        )
        
        # Generate audio using TTS
        audio_file = await tts_service.generate_audio(script)
        
        return {"script": script, "audio_url": f"/audio/{audio_file}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Podcast generation failed: {str(e)}")

@app.post("/simplify-text")
async def simplify_text(request: SimplifyTextRequest):
    """Simplify text difficulty using LLM."""
    try:
        simplified = await llm_service.simplify_text(
            text=request.text,
            difficulty_level=request.difficulty_level
        )
        return {"simplified_text": simplified}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text simplification failed: {str(e)}")

@app.post("/define-term")
async def define_term(request: TermDefinitionRequest):
    """Get definition for a complex term."""
    try:
        definition = await llm_service.define_term(
            term=request.term,
            context=request.context
        )
        return {"definition": definition}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Term definition failed: {str(e)}")

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio files."""
    file_path = f"audio_cache/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")

@app.get("/pdf/{doc_id}")
async def get_pdf(doc_id: str):
    """Serve PDF files."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = documents_store[doc_id]["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(file_path, media_type="application/pdf")

@app.post("/reading-progress")
async def track_reading_progress(doc_id: str = Form(...), 
                               current_page: int = Form(...),
                               total_pages: int = Form(...),
                               time_spent: int = Form(...)):
    """Track reading progress for a document."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Simple progress calculation
    progress_percentage = (current_page / total_pages) * 100
    estimated_total_time = (time_spent / current_page) * total_pages if current_page > 0 else 0
    remaining_time = estimated_total_time - time_spent
    
    return {
        "progress_percentage": progress_percentage,
        "time_spent_minutes": time_spent // 60,
        "estimated_remaining_minutes": max(0, remaining_time // 60),
        "estimated_total_minutes": estimated_total_time // 60
    }

@app.get("/library/documents")
async def get_library_documents(persona: Optional[str] = None, job_to_be_done: Optional[str] = None):
    """Get documents for library view, optionally filtered by persona or job."""
    docs = []
    for doc_data in documents_store.values():
        doc_info = doc_data["info"].copy()  # Create a copy to avoid modifying original
        
        # Apply filters if provided
        if persona and doc_info.get("persona") != persona:
            continue
        if job_to_be_done and doc_info.get("job_to_be_done") != job_to_be_done:
            continue
        
        # Limit outline data for faster loading - only send essential info
        if "outline" in doc_info and len(doc_info["outline"]) > 10:
            doc_info["outline"] = doc_info["outline"][:10]  # Limit to first 10 sections
            doc_info["outline_truncated"] = True
        
        docs.append(doc_info)
    
    # Sort by upload timestamp (newest first)
    docs.sort(key=lambda x: x.get("upload_timestamp", ""), reverse=True)
    return docs

@app.get("/library/personas")
async def get_personas():
    """Get all unique personas from uploaded documents."""
    personas = set()
    for doc_data in documents_store.values():
        persona = doc_data["info"].get("persona")
        if persona:
            personas.add(persona)
    return sorted(list(personas))

@app.get("/library/jobs")
async def get_jobs():
    """Get all unique job_to_be_done values from uploaded documents."""
    jobs = set()
    for doc_data in documents_store.values():
        job = doc_data["info"].get("job_to_be_done")
        if job:
            jobs.add(job)
    return sorted(list(jobs))

@app.get("/cross-connections/{doc_id}")
async def get_cross_connections(doc_id: str):
    """Get cross-document connections for a specific document with enhanced analysis."""
    if doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not llm_service.is_available():
        # Provide fallback analysis even without LLM
        return await _fallback_cross_connections_analysis(doc_id)
    
    current_doc = documents_store[doc_id]
    current_text = extract_full_text(current_doc["file_path"])
    current_info = current_doc["info"]
    
    print(f"Analyzing cross-connections for document: {current_info.get('title', 'Unknown')}")
    print(f"Available documents in store: {len(documents_store)}")
    
    # Find related documents
    related_docs = []
    insights = []
    contradictions = []
    
    # Process all other documents
    other_documents = [(other_id, other_data) for other_id, other_data in documents_store.items() if other_id != doc_id]
    print(f"Comparing with {len(other_documents)} other documents")
    
    for other_id, other_data in other_documents:
        other_info = other_data["info"]
        other_text = extract_full_text(other_data["file_path"])
        
        print(f"Analyzing connection with: {other_info.get('title', 'Unknown')}")
        
        # Enhanced connection analysis with multiple approaches
        connection_found = False
        connection_analysis = {}
        
        try:
            # Primary LLM analysis with more generous parameters
            connection_analysis = await llm_service.find_document_connections(
                current_text[:6000],  # Increased text limit for better analysis
                other_text[:6000],
                current_info.get("title", "Current Document"),
                other_info.get("title", "Other Document"),
                current_info.get("persona", "General User"),
                current_info.get("job_to_be_done", "Document Analysis")
            )
            
            print(f"LLM analysis result: {connection_analysis.get('has_connection', False)}, relevance: {connection_analysis.get('relevance_score', 0)}")
            
            # Very generous threshold for connections
            if (connection_analysis.get("has_connection", False) or 
                connection_analysis.get("relevance_score", 0) > 0.1 or
                connection_analysis.get("similarities") or
                connection_analysis.get("complementary_insights")):
                connection_found = True
                
        except Exception as e:
            print(f"LLM analysis failed for {other_id}: {e}")
            # Fallback to simpler analysis
            connection_analysis = await _simple_connection_analysis(
                current_text, other_text, 
                current_info.get("title", ""), other_info.get("title", "")
            )
            connection_found = connection_analysis.get("has_connection", False)
        
        # If still no connection, try keyword-based analysis
        if not connection_found:
            keyword_analysis = _keyword_based_connection_analysis(
                current_text, other_text,
                current_info.get("title", ""), other_info.get("title", "")
            )
            if keyword_analysis.get("has_connection", False):
                connection_found = True
                # Merge analyses
                for key, value in keyword_analysis.items():
                    if key not in connection_analysis or not connection_analysis[key]:
                        connection_analysis[key] = value
        
        if connection_found:
            related_doc = {
                "document_id": other_id,
                "document_title": other_info.get("title", "Unknown Document"),
                "connection_type": connection_analysis.get("connection_type", "related"),
                "relevance_score": max(connection_analysis.get("relevance_score", 0.25), 0.25),  # Minimum relevance
                "explanation": connection_analysis.get("explanation", "Documents share common themes, concepts, or are relevant to your role and objectives."),
                "key_sections": connection_analysis.get("key_sections", []),
                "similarities": connection_analysis.get("similarities", []),
                "complementary_insights": connection_analysis.get("complementary_insights", [])
            }
            
            # Add transferable concepts if available
            if connection_analysis.get("transferable_concepts"):
                related_doc["transferable_concepts"] = connection_analysis["transferable_concepts"]
            
            related_docs.append(related_doc)
            print(f"Added connection: {other_info.get('title', 'Unknown')} (score: {related_doc['relevance_score']})")
            
        # Enhanced contradiction detection
        if connection_analysis.get("has_contradiction", False):
            # Add detailed contradictions from the enhanced analysis
            detailed_contradictions = connection_analysis.get("contradictions", [])
            if detailed_contradictions:
                for contradiction in detailed_contradictions:
                    contradictions.append({
                        "document_id": other_id,
                        "document_title": other_info.get("title", "Unknown Document"),
                        "contradiction": contradiction.get("explanation", "Contradictory information found"),
                        "severity": contradiction.get("severity", "low"),
                        "doc1_quote": contradiction.get("doc1_quote", ""),
                        "doc2_quote": contradiction.get("doc2_quote", ""),
                        "contradiction_type": contradiction.get("contradiction_type", "direct"),
                        "topic": contradiction.get("topic", "General")
                    })
                    print(f"Added contradiction: {contradiction.get('topic', 'General')} ({contradiction.get('severity', 'low')} severity)")
            else:
                # Fallback to overall contradiction
                if connection_analysis.get("overall_contradiction"):
                    contradictions.append({
                        "document_id": other_id,
                        "document_title": other_info.get("title", "Unknown Document"),
                        "contradiction": connection_analysis.get("overall_contradiction", ""),
                        "severity": connection_analysis.get("severity", "low"),
                        "doc1_quote": "",
                        "doc2_quote": "",
                        "contradiction_type": "general",
                        "topic": "General"
                    })
                    print(f"Added general contradiction with: {other_info.get('title', 'Unknown')}")
    
    # If we still have very few connections, add some based on document types or themes
    if len(related_docs) < 2 and len(other_documents) > 0:
        print("Adding thematic connections to ensure useful results...")
        additional_connections = await _add_thematic_connections(
            doc_id, current_info, other_documents, related_docs
        )
        related_docs.extend(additional_connections)
    
    # Generate additional insights if we have related documents
    if related_docs:
        try:
            additional_insights = await llm_service.generate_cross_document_insights(
                current_text[:8000],  # Increased context
                [doc["document_title"] for doc in related_docs[:5]],
                current_info.get("persona", "General User"),
                current_info.get("job_to_be_done", "Document Analysis")
            )
            insights.extend(additional_insights.get("insights", []))
            print(f"Generated {len(additional_insights.get('insights', []))} additional insights")
        except Exception as e:
            print(f"Error generating cross-document insights: {e}")
            # Add basic insights as fallback
            insights.append({
                "type": "pattern",
                "content": f"Found {len(related_docs)} related documents that share common themes or concepts with your current document.",
                "confidence": 0.8
            })
    
    # Sort related documents by relevance score
    related_docs.sort(key=lambda x: x["relevance_score"], reverse=True)
    
    result = {
        "document_id": doc_id,
        "related_documents": related_docs[:10],  # Return more related documents
        "contradictions": contradictions,
        "insights": insights,
        "total_connections": len(related_docs)
    }
    
    print(f"Final result: {len(related_docs)} connections, {len(contradictions)} contradictions, {len(insights)} insights")
    return result

async def _fallback_cross_connections_analysis(doc_id: str):
    """Fallback analysis when LLM is not available."""
    current_doc = documents_store[doc_id]
    current_info = current_doc["info"]
    other_documents = [(other_id, other_data) for other_id, other_data in documents_store.items() if other_id != doc_id]
    
    related_docs = []
    for other_id, other_data in other_documents[:5]:  # Limit to avoid overwhelming
        other_info = other_data["info"]
        related_docs.append({
            "document_id": other_id,
            "document_title": other_info.get("title", "Unknown Document"),
            "connection_type": "related",
            "relevance_score": 0.3,
            "explanation": "Documents are part of your document collection and may contain related information.",
            "key_sections": [],
            "similarities": [],
            "complementary_insights": []
        })
    
    return {
        "document_id": doc_id,
        "related_documents": related_docs,
        "contradictions": [],
        "insights": [{"type": "info", "content": "LLM service unavailable. Showing basic document relationships.", "confidence": 0.5}],
        "total_connections": len(related_docs)
    }

async def _simple_connection_analysis(text1: str, text2: str, title1: str, title2: str):
    """Simple keyword and structural analysis for connections."""
    # Extract key terms from both documents
    import re
    from collections import Counter
    
    # Simple keyword extraction
    words1 = re.findall(r'\b[a-zA-Z]{4,}\b', text1.lower())
    words2 = re.findall(r'\b[a-zA-Z]{4,}\b', text2.lower())
    
    # Find common words (excluding common stop words)
    stop_words = {'that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
    
    counter1 = Counter([w for w in words1 if w not in stop_words])
    counter2 = Counter([w for w in words2 if w not in stop_words])
    
    # Find overlap
    common_words = set(counter1.keys()) & set(counter2.keys())
    
    if len(common_words) >= 5:  # If at least 5 common meaningful words
        relevance_score = min(len(common_words) / 20, 0.8)  # Cap at 0.8
        return {
            "has_connection": True,
            "connection_type": "thematic",
            "relevance_score": relevance_score,
            "explanation": f"Documents share common terminology and themes including: {', '.join(list(common_words)[:5])}",
            "key_sections": list(common_words)[:10]
        }
    
    return {"has_connection": False, "relevance_score": 0.0}

def _keyword_based_connection_analysis(text1: str, text2: str, title1: str, title2: str):
    """Keyword-based connection analysis as final fallback."""
    # Check for domain-specific connections
    domains = {
        'business': ['strategy', 'management', 'leadership', 'market', 'customer', 'revenue', 'profit', 'growth', 'innovation', 'competitive'],
        'technology': ['software', 'system', 'data', 'digital', 'platform', 'algorithm', 'development', 'engineering', 'automation'],
        'research': ['study', 'analysis', 'method', 'research', 'findings', 'conclusion', 'hypothesis', 'experiment', 'evidence'],
        'education': ['learning', 'student', 'education', 'teaching', 'curriculum', 'assessment', 'knowledge', 'skill']
    }
    
    text1_lower = text1.lower()
    text2_lower = text2.lower()
    
    for domain, keywords in domains.items():
        count1 = sum(1 for kw in keywords if kw in text1_lower)
        count2 = sum(1 for kw in keywords if kw in text2_lower)
        
        if count1 >= 2 and count2 >= 2:  # Both documents have domain keywords
            return {
                "has_connection": True,
                "connection_type": "domain_related",
                "relevance_score": 0.4,
                "explanation": f"Both documents appear to be related to {domain} domain with shared terminology and concepts.",
                "key_sections": [domain]
            }
    
    return {"has_connection": False, "relevance_score": 0.0}

async def _add_thematic_connections(doc_id: str, current_info: dict, other_documents: list, existing_connections: list):
    """Add thematic connections to ensure users get some useful results."""
    additional_connections = []
    existing_ids = {doc["document_id"] for doc in existing_connections}
    
    # Add up to 2 additional connections based on simple heuristics
    for other_id, other_data in other_documents[:5]:
        if other_id in existing_ids:
            continue
            
        other_info = other_data["info"]
        
        # Simple connection based on document presence in collection
        additional_connections.append({
            "document_id": other_id,
            "document_title": other_info.get("title", "Unknown Document"),
            "connection_type": "collection_related",
            "relevance_score": 0.2,
            "explanation": "Part of your document collection and may contain complementary information or different perspectives on related topics.",
            "key_sections": ["general"],
            "similarities": [],
            "complementary_insights": []
        })
        
        if len(additional_connections) >= 2:
            break
    
    return additional_connections

@app.post("/strategic-insights")
async def generate_strategic_insights(request: InsightsRequest):
    """Generate strategic insights at specific areas of the PDF."""
    if not llm_service.is_available():
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    try:
        text_to_analyze = request.text
        
        # If the text looks like a placeholder request for document-level analysis
        if ("Document content analysis" in request.text or 
            "Please analyze the full document" in request.text or
            len(request.text.strip()) < 50):
            
            # Try to extract document ID from text or context
            doc_id = None
            if "ID:" in request.text:
                import re
                match = re.search(r'ID:\s*([a-f0-9-]+)', request.text)
                if match:
                    doc_id = match.group(1)
            
            # If we have a document context, try to use it
            if request.document_context and request.document_context in documents_store:
                doc_id = request.document_context
            
            # Extract actual document content for analysis
            if doc_id and doc_id in documents_store:
                try:
                    full_text = extract_full_text(documents_store[doc_id]["file_path"])
                    # Use a substantial portion of the document for analysis
                    text_to_analyze = full_text[:8000]  # Use first 8000 characters
                    print(f"Using document-level analysis with {len(text_to_analyze)} characters from document {doc_id}")
                except Exception as e:
                    print(f"Error extracting full text for document {doc_id}: {e}")
                    # Fall back to the original request text
        
        strategic_insights = await llm_service.generate_strategic_insights(
            text_to_analyze,
            request.persona,
            request.job_to_be_done,
            request.document_context
        )
        
        return {"strategic_insights": strategic_insights}
        
    except Exception as e:
        print(f"Error generating strategic insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate strategic insights")

class ContextualAnalysisRequest(BaseModel):
    doc_id: str
    page_number: int
    section_text: str

@app.post("/contextual-analysis")
async def analyze_document_context(request: ContextualAnalysisRequest):
    """Analyze specific document context for deeper insights."""
    if request.doc_id not in documents_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not llm_service.is_available():
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    try:
        doc_info = documents_store[request.doc_id]["info"]
        full_text = extract_full_text(documents_store[request.doc_id]["file_path"])
        
        contextual_analysis = await llm_service.analyze_document_context(
            request.section_text,
            full_text[:5000],  # Context from full document
            doc_info.get("title", ""),
            request.page_number,
            doc_info.get("persona", ""),
            doc_info.get("job_to_be_done", "")
        )
        
        return contextual_analysis
        
    except Exception as e:
        print(f"Error analyzing document context: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze document context")

@app.post("/multi-document-insights")
async def generate_multi_document_insights(request: AnalysisRequest):
    """Generate comprehensive insights across multiple documents with patterns, contradictions, and recommendations."""
    if not llm_service.is_available():
        raise HTTPException(status_code=503, detail="LLM service unavailable")
    
    # Validate document IDs
    valid_docs = []
    for doc_id in request.document_ids:
        if doc_id in documents_store:
            valid_docs.append(doc_id)
    
    if not valid_docs:
        raise HTTPException(status_code=404, detail="No valid documents found")
    
    try:
        # Prepare document data for analysis
        documents_data = []
        for doc_id in valid_docs:
            doc_info = documents_store[doc_id]["info"]
            doc_text = extract_full_text(documents_store[doc_id]["file_path"])
            documents_data.append({
                "id": doc_id,
                "title": doc_info.get("title", "Unknown Document"),
                "text": doc_text
            })
        
        # Generate multi-document insights
        multi_insights = await llm_service.analyze_multi_document_insights(
            documents_data,
            request.persona,
            request.job_to_be_done
        )
        
        return {
            "analyzed_documents": len(valid_docs),
            "document_titles": [doc["title"] for doc in documents_data],
            "insights": multi_insights
        }
        
    except Exception as e:
        print(f"Error generating multi-document insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate multi-document insights")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "documents_count": len(documents_store),
        "services": {
            "llm": llm_service.is_available(),
            "tts": tts_service.is_available()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)