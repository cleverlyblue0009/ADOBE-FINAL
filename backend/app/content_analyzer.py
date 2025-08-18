import asyncio
import json
from typing import List, Dict, Any, Optional
from .fact_generator import ExternalFactGenerator
from .pdf_analyzer import extract_text_with_metadata, get_pdf_title

class ContentAnalyzer:
    """Service to analyze document content and identify pages with interesting external facts."""
    
    def __init__(self):
        self.fact_generator = ExternalFactGenerator()
        self.page_facts_cache = {}  # Cache facts by document_id
    
    def extract_page_content(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract content from PDF organized by pages."""
        try:
            text_blocks = extract_text_with_metadata(pdf_path)
            
            # Group text blocks by page
            pages_content = {}
            for block in text_blocks:
                page_num = block['page']
                if page_num not in pages_content:
                    pages_content[page_num] = {
                        'page_number': page_num,
                        'text_blocks': [],
                        'text': '',
                        'headings': [],
                        'has_significant_content': False
                    }
                
                pages_content[page_num]['text_blocks'].append(block)
                pages_content[page_num]['text'] += block['text'] + ' '
                
                # Identify headings (larger font size or bold)
                if block.get('is_bold') or block.get('font_size', 0) > 14:
                    pages_content[page_num]['headings'].append(block['text'])
            
            # Process and clean page content
            processed_pages = []
            for page_num, page_data in pages_content.items():
                # Clean and process text
                page_text = page_data['text'].strip()
                word_count = len(page_text.split())
                
                # Determine if page has significant content
                has_significant_content = (
                    word_count > 50 and  # At least 50 words
                    len(page_text) > 200 and  # At least 200 characters
                    not self._is_mostly_boilerplate(page_text)
                )
                
                page_data['text'] = page_text
                page_data['word_count'] = word_count
                page_data['has_significant_content'] = has_significant_content
                
                processed_pages.append(page_data)
            
            return processed_pages
            
        except Exception as e:
            print(f"Error extracting page content: {e}")
            return []
    
    def _is_mostly_boilerplate(self, text: str) -> bool:
        """Check if text is mostly boilerplate content."""
        text_lower = text.lower()
        
        # Common boilerplate indicators
        boilerplate_indicators = [
            'table of contents',
            'copyright',
            'all rights reserved',
            'page ',
            'chapter ',
            'references',
            'bibliography',
            'index',
            'appendix'
        ]
        
        boilerplate_count = sum(1 for indicator in boilerplate_indicators if indicator in text_lower)
        return boilerplate_count > 2 or len(text.split()) < 30
    
    async def analyze_document_content(self, document_id: str, pdf_path: str) -> Dict[str, Any]:
        """
        Analyze document content and generate external facts for interesting pages.
        
        Returns:
            Dictionary containing page facts mapping and analysis metadata
        """
        try:
            # Extract page content
            pages_content = self.extract_page_content(pdf_path)
            
            if not pages_content:
                return {'page_facts': {}, 'analysis_metadata': {'error': 'No content extracted'}}
            
            # Filter pages with significant content
            significant_pages = [
                page for page in pages_content 
                if page['has_significant_content']
            ]
            
            print(f"Analyzing {len(significant_pages)} significant pages out of {len(pages_content)} total pages")
            
            # Generate external facts for significant pages
            if self.fact_generator.is_available():
                page_facts = await self.fact_generator.analyze_document_for_facts(significant_pages)
            else:
                page_facts = {}
                print("Warning: Fact generator not available, no external facts generated")
            
            # Cache the results
            self.page_facts_cache[document_id] = page_facts
            
            # Prepare analysis metadata
            analysis_metadata = {
                'total_pages': len(pages_content),
                'significant_pages': len(significant_pages),
                'pages_with_facts': len(page_facts),
                'total_facts_generated': sum(len(facts) for facts in page_facts.values()),
                'fact_pages': list(page_facts.keys())
            }
            
            return {
                'page_facts': page_facts,
                'analysis_metadata': analysis_metadata
            }
            
        except Exception as e:
            print(f"Error analyzing document content: {e}")
            return {
                'page_facts': {},
                'analysis_metadata': {'error': str(e)}
            }
    
    def get_facts_for_page(self, document_id: str, page_number: int) -> List[Dict[str, Any]]:
        """Get external facts for a specific page."""
        if document_id not in self.page_facts_cache:
            return []
        
        page_facts = self.page_facts_cache[document_id]
        return page_facts.get(page_number, [])
    
    def get_all_document_facts(self, document_id: str) -> Dict[int, List[Dict[str, Any]]]:
        """Get all facts for a document."""
        return self.page_facts_cache.get(document_id, {})
    
    async def generate_fact_for_current_page(self, document_id: str, page_number: int, page_text: str) -> Optional[Dict[str, Any]]:
        """Generate an external fact for the current page being viewed."""
        if not self.fact_generator.is_available():
            return None
        
        try:
            # Check if we already have a fact for this page
            existing_facts = self.get_facts_for_page(document_id, page_number)
            if existing_facts:
                return existing_facts[0]  # Return the first existing fact
            
            # Generate a new fact for this page
            fact = await self.fact_generator.generate_fact_for_page_content(page_text, page_number)
            
            # Cache the new fact
            if fact:
                if document_id not in self.page_facts_cache:
                    self.page_facts_cache[document_id] = {}
                
                if page_number not in self.page_facts_cache[document_id]:
                    self.page_facts_cache[document_id][page_number] = []
                
                self.page_facts_cache[document_id][page_number].append(fact)
            
            return fact
            
        except Exception as e:
            print(f"Error generating fact for page {page_number}: {e}")
            return None
    
    def has_facts_for_page(self, document_id: str, page_number: int) -> bool:
        """Check if a page has external facts available."""
        return len(self.get_facts_for_page(document_id, page_number)) > 0
    
    def get_document_fact_summary(self, document_id: str) -> Dict[str, Any]:
        """Get summary of facts available for a document."""
        page_facts = self.get_all_document_facts(document_id)
        
        return {
            'total_pages_with_facts': len(page_facts),
            'total_facts': sum(len(facts) for facts in page_facts.values()),
            'fact_pages': sorted(page_facts.keys()),
            'categories': self._get_fact_categories(page_facts)
        }
    
    def _get_fact_categories(self, page_facts: Dict[int, List[Dict[str, Any]]]) -> Dict[str, int]:
        """Get distribution of fact categories."""
        categories = {}
        
        for facts_list in page_facts.values():
            for fact in facts_list:
                category = fact.get('category', 'other')
                categories[category] = categories.get(category, 0) + 1
        
        return categories
    
    def clear_document_cache(self, document_id: str):
        """Clear cached facts for a document."""
        if document_id in self.page_facts_cache:
            del self.page_facts_cache[document_id]
    
    def clear_all_cache(self):
        """Clear all cached facts."""
        self.page_facts_cache.clear()