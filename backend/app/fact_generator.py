import os
import asyncio
import json
import re
from typing import List, Dict, Any, Optional, Tuple
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class ExternalFactGenerator:
    """Service to generate external 'Did you know?' facts based on document content."""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-2.0-flash-exp"
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Gemini model."""
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                print("Fact Generator: Gemini model initialized successfully")
            except Exception as e:
                print(f"Fact Generator: Failed to initialize Gemini model: {e}")
                self.model = None
        else:
            print("Warning: GEMINI_API_KEY not found for fact generator")
    
    def is_available(self) -> bool:
        """Check if the service is available."""
        return self.model is not None
    
    async def extract_topics_from_page(self, page_text: str, page_number: int) -> List[str]:
        """Extract key topics and concepts from a page of text."""
        if not self.is_available() or not page_text.strip():
            return []
        
        try:
            prompt = f"""
            Analyze the following text from page {page_number} of a document and extract 2-3 key topics, concepts, or subjects that could have interesting external facts.
            
            Focus on:
            - Scientific concepts, discoveries, or phenomena
            - Historical events, figures, or periods
            - Technical terms or processes
            - Geographic locations or places
            - Notable people, organizations, or entities
            - Industry-specific concepts
            
            Text:
            {page_text[:1500]}
            
            Return ONLY a JSON array of topics, like: ["topic1", "topic2", "topic3"]
            Each topic should be 1-4 words maximum and represent a concept that could have interesting external facts.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                topics_json = json_match.group(0)
                try:
                    topics = json.loads(topics_json)
                except json.JSONDecodeError as json_err:
                    print(f"JSON decode error for topics on page {page_number}: {json_err}")
                    return []
                
                # Ensure topics is a list or iterable, not a set
                if isinstance(topics, set):
                    topics = list(topics)
                elif not isinstance(topics, (list, tuple)):
                    topics = [topics] if topics else []
                
                # Filter and return valid string topics
                try:
                    return [topic for topic in topics if isinstance(topic, str) and len(topic.strip()) > 0]
                except TypeError as type_err:
                    print(f"Type error when processing topics on page {page_number}: {type_err}")
                    return []
            
            return []
            
        except Exception as e:
            print(f"Error extracting topics from page {page_number}: {e}")
            # Return empty list to ensure consistent return type
            return []
    
    async def generate_external_fact(self, topic: str, page_context: str) -> Optional[Dict[str, Any]]:
        """Generate an external 'Did you know?' fact about a topic."""
        if not self.is_available():
            return None
        
        try:
            prompt = f"""
            You are a knowledgeable fact generator. Based on the topic "{topic}" mentioned in a document, generate ONE fascinating external fact that is:
            
            1. NOT directly mentioned in the document text
            2. Related to or inspired by the topic
            3. Surprising, interesting, or educational
            4. Factually accurate and verifiable
            5. Suitable for a general audience
            
            Document context (DO NOT repeat information from this):
            {page_context[:800]}
            
            Generate a "Did you know?" fact about {topic} that goes beyond what's in the document.
            
            Format your response as JSON:
            {{
                "fact": "Did you know that [your fascinating external fact here]?",
                "topic": "{topic}",
                "category": "science|history|technology|nature|culture|other"
            }}
            
            Make the fact engaging and start with "Did you know that..." but ensure the fact text is natural and readable, not in JSON format when displayed.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                fact_json = json_match.group(0)
                fact_data = json.loads(fact_json)
                
                # Validate the fact structure
                if all(key in fact_data for key in ['fact', 'topic', 'category']):
                    return fact_data
            
            return None
            
        except Exception as e:
            print(f"Error generating external fact for topic '{topic}': {e}")
            return None
    
    async def analyze_document_for_facts(self, document_pages: List[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
        """
        Analyze entire document and generate external facts for interesting pages.
        
        Args:
            document_pages: List of page data with 'page_number', 'text', and other metadata
            
        Returns:
            Dict mapping page numbers to lists of external facts
        """
        if not self.is_available():
            return {}
        
        page_facts = {}
        
        for page_data in document_pages:
            page_number = page_data.get('page_number', 0)
            page_text = page_data.get('text', '')
            
            if not page_text.strip() or len(page_text.strip()) < 100:
                continue
            
            try:
                # Extract topics from this page
                topics = await self.extract_topics_from_page(page_text, page_number)
                
                if not topics:
                    continue
                
                # Generate external facts for each topic (limit to 2 facts per page)
                page_facts[page_number] = []
                
                # Ensure topics is a list before slicing
                if isinstance(topics, set):
                    topics = list(topics)
                
                for topic in topics[:2]:  # Limit to 2 topics per page
                    fact = await self.generate_external_fact(topic, page_text)
                    if fact:
                        fact['page_number'] = page_number
                        page_facts[page_number].append(fact)
                        
                        # Add a small delay to avoid rate limiting
                        await asyncio.sleep(0.5)
                
                # Remove empty pages
                if not page_facts[page_number]:
                    del page_facts[page_number]
                    
            except Exception as e:
                print(f"Error processing page {page_number} for facts: {e}")
                continue
        
        return page_facts
    
    async def generate_fact_for_page_content(self, page_text: str, page_number: int) -> Optional[Dict[str, Any]]:
        """Generate a single external fact for a specific page's content."""
        if not page_text.strip():
            return None
        
        # Extract topics from the page
        topics = await self.extract_topics_from_page(page_text, page_number)
        
        if not topics:
            return None
        
        # Generate fact for the first/most relevant topic
        # Ensure topics is a list and has at least one element
        if isinstance(topics, set):
            topics = list(topics)
        if not topics:
            return None
        
        fact = await self.generate_external_fact(topics[0], page_text)
        if fact:
            fact['page_number'] = page_number
        
        return fact
    
    def format_fact_for_display(self, fact_data: Dict[str, Any]) -> str:
        """Format a fact for display in the UI."""
        fact_text = fact_data.get('fact', '')
        category = fact_data.get('category', 'general')
        
        # Add category emoji
        category_emojis = {
            'science': '🔬',
            'history': '📜',
            'technology': '💻',
            'nature': '🌿',
            'culture': '🎭',
            'other': '💡'
        }
        
        emoji = category_emojis.get(category, '💡')
        return f"{emoji} {fact_text}"