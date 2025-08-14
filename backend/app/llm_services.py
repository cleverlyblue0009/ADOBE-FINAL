import os
import asyncio
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-1.5-flash"
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Gemini model."""
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                print("Gemini model initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Gemini model: {e}")
                self.model = None
        else:
            print("Warning: GEMINI_API_KEY not found in environment variables")
    
    def is_available(self) -> bool:
        """Check if LLM service is available."""
        return self.model is not None
    
    async def generate_insights(self, 
                              text: str, 
                              persona: str, 
                              job_to_be_done: str,
                              context: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate AI insights for the given text."""
        if not self.is_available():
            return [{"type": "info", "content": "LLM service not available. Please configure GEMINI_API_KEY."}]
        
        try:
            prompt = f"""
            You are helping a {persona} with their task: {job_to_be_done}
            
            Analyze the following text and provide 3 key insights. For each insight, provide:
            1. A key takeaway or important fact
            2. An interesting "did you know?" fact
            3. A connection to broader concepts
            
            Text to analyze:
            {text[:2000]}
            
            {f"Additional context: {context}" if context else ""}
            
            Format your response as:
            TAKEAWAY: [your key takeaway here]
            FACT: [interesting fact here]
            CONNECTION: [connection to broader concepts here]
            
            Keep each insight under 2 sentences.
            """
            
            # Use async call with proper error handling
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            # Parse response
            try:
                response_text = response.text.strip()
                print(f"Raw response: {response_text[:200]}...")
                
                # Parse the structured response
                insights = []
                lines = response_text.split('\n')
                
                for line in lines:
                    line = line.strip()
                    if line.startswith('TAKEAWAY:'):
                        content = line.replace('TAKEAWAY:', '').strip()
                        insights.append({"type": "takeaway", "content": content})
                    elif line.startswith('FACT:'):
                        content = line.replace('FACT:', '').strip()
                        insights.append({"type": "fact", "content": content})
                    elif line.startswith('CONNECTION:'):
                        content = line.replace('CONNECTION:', '').strip()
                        insights.append({"type": "connection", "content": content})
                
                if insights:
                    return insights
                else:
                    # Fallback: create insights from the raw text
                    return [{"type": "info", "content": response_text[:200]}]
                    
            except Exception as parse_error:
                print(f"Parsing error: {parse_error}")
                return [{"type": "info", "content": response.text[:200]}]
                
        except Exception as e:
            error_msg = str(e)
            print(f"Error generating insights: {e}")
            
            # Check for quota exceeded error
            if "429" in error_msg and "quota" in error_msg.lower():
                return [{"type": "error", "content": "API quota exceeded. Please try again later or upgrade your plan."}]
            elif "quota" in error_msg.lower():
                return [{"type": "error", "content": "API quota exceeded. Please try again later or upgrade your plan."}]
            else:
                return [{"type": "error", "content": "Failed to generate insights"}]

    async def generate_comprehensive_insights(self,
                                           text: str,
                                           persona: str,
                                           job_to_be_done: str,
                                           document_context: str = None,
                                           keywords: List[str] = None) -> Dict[str, Any]:
        """Generate comprehensive AI insights with web search and persona-based analysis."""
        if not self.is_available():
            return {
                "insights": [{"type": "info", "content": "LLM service not available. Please configure GEMINI_API_KEY."}],
                "web_facts": [],
                "persona_insights": [],
                "keywords": keywords or []
            }
        
        try:
            # Extract keywords if not provided
            if not keywords:
                keywords = await self._extract_keywords(text)
            
            # Generate comprehensive prompt
            prompt = f"""
            You are an expert AI analyst helping a {persona} with their task: {job_to_be_done}
            
            Analyze ONLY the following text from the PDF document and provide insights that are DIRECTLY related to this specific content:
            
            TEXT TO ANALYZE:
            {text[:3000]}
            
            {f"DOCUMENT CONTEXT: {document_context}" if document_context else ""}
            
            EXTRACTED KEYWORDS: {', '.join(keywords[:10])}
            
            IMPORTANT: Base ALL insights ONLY on the actual content provided above. Do NOT add general knowledge or external information that isn't directly supported by the text.
            
            Please provide your analysis in this exact format:
            
            TAKEAWAY: [specific insight directly from the PDF content, relevant to {persona}]
            FACT: [specific fact or detail mentioned in the PDF text]
            CONNECTION: [how this specific content connects to {persona}'s {job_to_be_done}]
            IMPLICATION: [what this specific content means for {persona}'s immediate task]
            ROLE_RELEVANCE: [why this specific PDF content matters for {persona}]
            ACTION_ITEMS: [specific actions {persona} can take based on this PDF content]
            SKILL_DEVELOPMENT: [specific skills this PDF content helps develop for {persona}]
            MAIN_THEMES: [key themes specifically found in this PDF text]
            TRENDING_TOPICS: [trends or patterns specifically mentioned in this PDF content]
            RESEARCH_OPPORTUNITIES: [specific areas mentioned in the PDF that warrant further investigation]
            
            Keep each insight under 2 sentences and focus ONLY on what's actually in the provided text.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            # Parse the comprehensive response
            parsed_insights = await self._parse_comprehensive_response(response.text, persona, job_to_be_done)
            
            # Generate web search suggestions
            web_facts = await self._generate_web_search_suggestions(keywords, persona, job_to_be_done)
            
            return {
                "insights": parsed_insights["insights"],
                "persona_insights": parsed_insights["persona_insights"],
                "topic_analysis": parsed_insights["topic_analysis"],
                "web_facts": web_facts,
                "keywords": keywords,
                "search_queries": self._generate_search_queries(keywords, persona, job_to_be_done)
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"Error generating comprehensive insights: {e}")
            
            # Check for quota exceeded error
            if "429" in error_msg and "quota" in error_msg.lower():
                return {
                    "insights": [{"type": "error", "content": "API quota exceeded. Please try again later or upgrade your plan."}],
                    "web_facts": [],
                    "persona_insights": [],
                    "keywords": keywords or [],
                    "search_queries": []
                }
            elif "quota" in error_msg.lower():
                return {
                    "insights": [{"type": "error", "content": "API quota exceeded. Please try again later or upgrade your plan."}],
                    "keywords": keywords or [],
                    "search_queries": []
                }
            else:
                return {
                    "insights": [{"type": "error", "content": "Failed to generate comprehensive insights"}],
                    "web_facts": [],
                    "persona_insights": [],
                    "keywords": keywords or [],
                    "search_queries": []
                }

    async def _extract_keywords(self, text: str) -> List[str]:
        """Extract key terms and concepts from text."""
        try:
            prompt = f"""
            Extract 10-15 key terms, concepts, and important keywords from this text.
            Focus on technical terms, proper nouns, and central concepts.
            
            Text: {text[:2000]}
            
            Return only the keywords separated by commas, no explanations.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            keywords = [kw.strip() for kw in response.text.split(',')]
            return [kw for kw in keywords if len(kw) > 2][:15]  # Filter out very short terms
            
        except Exception as e:
            error_msg = str(e)
            print(f"Error extracting keywords: {e}")
            
            # Check for quota exceeded error
            if "429" in error_msg and "quota" in error_msg.lower():
                print("API quota exceeded during keyword extraction")
                return []
            elif "quota" in error_msg.lower():
                print("API quota exceeded during keyword extraction")
                return []
            else:
                return []

    async def _parse_comprehensive_response(self, response_text: str, persona: str, job_to_be_done: str) -> Dict[str, Any]:
        """Parse the comprehensive AI response into structured data."""
        try:
            insights = []
            persona_insights = []
            topic_analysis = {}
            
            lines = response_text.split('\n')
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                if line.startswith('TAKEAWAY:'):
                    content = line.replace('TAKEAWAY:', '').strip()
                    insights.append({"type": "takeaway", "content": content})
                elif line.startswith('FACT:'):
                    content = line.replace('FACT:', '').strip()
                    insights.append({"type": "fact", "content": content})
                elif line.startswith('CONNECTION:'):
                    content = line.replace('CONNECTION:', '').strip()
                    insights.append({"type": "connection", "content": content})
                elif line.startswith('IMPLICATION:'):
                    content = line.replace('IMPLICATION:', '').strip()
                    insights.append({"type": "implication", "content": content})
                elif line.startswith('ROLE_RELEVANCE:'):
                    content = line.replace('ROLE_RELEVANCE:', '').strip()
                    persona_insights.append({"type": "relevance", "content": content})
                elif line.startswith('ACTION_ITEMS:'):
                    content = line.replace('ACTION_ITEMS:', '').strip()
                    persona_insights.append({"type": "action", "content": content})
                elif line.startswith('SKILL_DEVELOPMENT:'):
                    content = line.replace('SKILL_DEVELOPMENT:', '').strip()
                    persona_insights.append({"type": "skill", "content": content})
                elif line.startswith('MAIN_THEMES:'):
                    content = line.replace('MAIN_THEMES:', '').strip()
                    topic_analysis["main_themes"] = content
                elif line.startswith('TRENDING_TOPICS:'):
                    content = line.replace('TRENDING_TOPICS:', '').strip()
                    topic_analysis["trending_topics"] = content
                elif line.startswith('RESEARCH_OPPORTUNITIES:'):
                    content = line.replace('RESEARCH_OPPORTUNITIES:', '').strip()
                    topic_analysis["research_opportunities"] = content
            
            return {
                "insights": insights,
                "persona_insights": persona_insights,
                "topic_analysis": topic_analysis
            }
            
        except Exception as e:
            print(f"Error parsing comprehensive response: {e}")
            return {"insights": [], "persona_insights": [], "topic_analysis": {}}

    async def _generate_web_search_suggestions(self, keywords: List[str], persona: str, job_to_be_done: str) -> List[Dict[str, str]]:
        """Generate web search suggestions for additional facts and current information."""
        try:
            prompt = f"""
            As a {persona} working on {job_to_be_done}, suggest 5 specific web search queries to find:
            1. Current facts and recent developments about: {', '.join(keywords[:5])}
            2. Latest research and trends related to the specific topics in the PDF
            3. Industry news and updates about the specific concepts mentioned
            4. Expert opinions and analysis on the specific subjects covered
            5. Related case studies or examples of the specific topics discussed
            
            IMPORTANT: Focus search queries on the specific topics, concepts, and terms found in the PDF content. Do NOT suggest generic searches.
            
            Format as:
            QUERY1: [specific search query focused on PDF content]
            QUERY2: [specific search query focused on PDF content]
            etc.
            
            Make queries specific and actionable for {persona}, directly related to what they just read.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            web_facts = []
            lines = response.text.split('\n')
            
            for line in lines:
                line = line.strip()
                if line.startswith('QUERY'):
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        web_facts.append({
                            "type": "search_query",
                            "query": parts[1].strip(),
                            "description": f"Search for current information about {parts[1].strip()}"
                        })
            
            return web_facts[:5]
            
        except Exception as e:
            print(f"Error generating web search suggestions: {e}")
            return []

    def _generate_search_queries(self, keywords: List[str], persona: str, job_to_be_done: str) -> List[str]:
        """Generate optimized search queries for web research."""
        queries = []
        
        # Focus on specific PDF content keywords
        for keyword in keywords[:5]:
            if len(keyword) > 3:  # Only use meaningful keywords
                queries.append(f'"{keyword}" latest developments 2024')
                queries.append(f'"{keyword}" {persona} {job_to_be_done} specific applications')
        
        # Persona-specific searches focused on PDF content
        if keywords:
            queries.append(f'"{", ".join(keywords[:3])}" current research {persona}')
            queries.append(f'"{keywords[0]}" practical examples {job_to_be_done}')
        
        # Remove duplicates and limit
        unique_queries = list(dict.fromkeys(queries))  # Preserve order while removing duplicates
        return unique_queries[:6]  # Limit to 6 focused queries
    
    async def generate_podcast_script(self,
                                    text: str,
                                    related_sections: List[str],
                                    insights: List[str]) -> str:
        """Generate a podcast script for the given content."""
        if not self.is_available():
            return "LLM service not available for podcast generation."
        
        try:
            prompt = f"""
            Create a 2-5 minute podcast script that narrates and explains the following content.
            Make it engaging, conversational, and educational.
            
            Main content:
            {text[:1500]}
            
            Related sections to reference:
            {chr(10).join(related_sections[:3])}
            
            Key insights to incorporate:
            {chr(10).join(insights[:3])}
            
            Guidelines:
            - Keep it conversational and engaging
            - Explain complex concepts simply
            - Include transitions between ideas
            - Add brief pauses with [PAUSE] markers
            - Target 2-5 minutes when read aloud
            - Don't use markdown formatting
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating podcast script: {e}")
            return "Failed to generate podcast script."
    
    async def simplify_text(self, text: str, difficulty_level: str = "simple") -> str:
        """Simplify text based on difficulty level."""
        if not self.is_available():
            return text  # Return original if service unavailable
        
        try:
            level_instructions = {
                "simple": "Use very simple words, short sentences, and explain any technical terms.",
                "moderate": "Use clear language but you can include some technical terms with brief explanations.",
                "advanced": "Keep technical terms but make the structure and flow clearer."
            }
            
            instruction = level_instructions.get(difficulty_level, level_instructions["simple"])
            
            prompt = f"""
            Rewrite the following text to make it easier to understand.
            {instruction}
            
            Original text:
            {text[:2000]}
            
            Simplified version:
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error simplifying text: {e}")
            return text  # Return original on error
    
    async def define_term(self, term: str, context: str) -> str:
        """Get definition for a complex term within context."""
        if not self.is_available():
            return f"Definition not available for '{term}'"
        
        try:
            prompt = f"""
            Define the term "{term}" in the context of the following text.
            Provide a clear, concise definition in 1-2 sentences.
            
            Context:
            {context[:500]}
            
            Definition:
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error defining term: {e}")
            return f"Unable to define '{term}'"