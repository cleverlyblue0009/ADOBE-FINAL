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
    
    async def find_document_connections(self, text1: str, text2: str, title1: str, title2: str, persona: str, job: str):
        """Find connections between two documents with detailed analysis including specific quotes."""
        if not self.is_available():
            return {"has_connection": False, "explanation": "LLM service unavailable"}
        
        try:
            prompt = f"""
            Analyze these two documents and find detailed connections, similarities, contradictions, and insights.
            Focus particularly on identifying SPECIFIC contradictory statements with exact quotes.
            
            Document 1: "{title1}"
            Content: {text1[:3000]}
            
            Document 2: "{title2}"
            Content: {text2[:3000]}
            
            User Context:
            - Persona: {persona}
            - Job to be done: {job}
            
            CRITICAL INSTRUCTIONS FOR CONTRADICTIONS:
            - Only report contradictions if you can find EXACT quotes that directly contradict each other
            - Look for statements where Document 1 says X and Document 2 says NOT X about the same topic
            - Include the specific topic being contradicted
            - Provide clear, specific quotes, not summaries or paraphrases
            
            Examples of valid contradictions:
            - Doc1: "The weather in Madrid is humid" vs Doc2: "Madrid has a dry climate"
            - Doc1: "Method A is recommended" vs Doc2: "Method A should be avoided"
            - Doc1: "The study shows 85% success rate" vs Doc2: "Success rates were only 45%"
            
            Return a JSON response with:
            {{
                "has_connection": boolean,
                "connection_type": "complementary|contradictory|similar|related",
                "relevance_score": float (0-1),
                "explanation": "overall connection summary",
                "similarities": [
                    {{
                        "doc1_quote": "exact quote from document 1",
                        "doc2_quote": "similar quote from document 2",
                        "similarity_type": "identical|paraphrased|concept_match",
                        "explanation": "why these are similar"
                    }}
                ],
                "contradictions": [
                    {{
                        "topic": "specific topic being contradicted",
                        "doc1_quote": "exact contradicting statement from {title1}",
                        "doc2_quote": "exact contradicting statement from {title2}",
                        "contradiction_type": "direct|methodological|conclusion|factual",
                        "severity": "low|medium|high",
                        "explanation": "clear explanation of how these statements contradict each other"
                    }}
                ],
                "complementary_insights": [
                    {{
                        "insight": "how documents complement each other",
                        "doc1_support": "supporting evidence from doc 1",
                        "doc2_support": "supporting evidence from doc 2"
                    }}
                ],
                "key_sections": ["section1", "section2"],
                "has_contradiction": boolean,
                "overall_contradiction": "description if any",
                "severity": "low|medium|high"
            }}
            
            ONLY include contradictions if you have specific, exact quotes that clearly contradict each other.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            # Try to parse JSON response
            try:
                import json
                result = json.loads(response.text.strip())
                return result
            except:
                # Fallback if JSON parsing fails
                has_connection = "connection" in response.text.lower() or "related" in response.text.lower()
                return {
                    "has_connection": has_connection,
                    "connection_type": "related",
                    "relevance_score": 0.5,
                    "explanation": response.text[:200],
                    "similarities": [],
                    "contradictions": [],
                    "complementary_insights": [],
                    "key_sections": [],
                    "has_contradiction": "contradict" in response.text.lower(),
                    "overall_contradiction": "",
                    "severity": "low"
                }
                
        except Exception as e:
            print(f"Error finding document connections: {e}")
            return {"has_connection": False, "explanation": f"Error: {e}"}
    
    async def generate_cross_document_insights(self, current_text: str, related_titles: list, persona: str, job: str):
        """Generate insights based on cross-document analysis."""
        if not self.is_available():
            return {"insights": []}
        
        try:
            prompt = f"""
            Based on the current document and its connections to related documents, generate valuable insights.
            
            Current Document Content (excerpt):
            {current_text}
            
            Related Documents:
            {', '.join(related_titles)}
            
            User Context:
            - Persona: {persona}
            - Job to be done: {job}
            
            Generate 3-5 actionable insights that would be valuable for this persona, considering the connections between these documents. Focus on:
            1. Patterns across documents
            2. Gaps or opportunities
            3. Actionable recommendations
            4. Key takeaways for the specific job to be done
            
            Return as JSON:
            {{
                "insights": [
                    {{
                        "type": "pattern|opportunity|recommendation|takeaway",
                        "content": "insight description",
                        "confidence": float (0-1)
                    }}
                ]
            }}
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            try:
                import json
                result = json.loads(response.text.strip())
                return result
            except:
                # Fallback
                return {
                    "insights": [{
                        "type": "takeaway",
                        "content": response.text[:300],
                        "confidence": 0.7
                    }]
                }
                
        except Exception as e:
            print(f"Error generating cross-document insights: {e}")
            return {"insights": []}
    
    async def generate_strategic_insights(self, text: str, persona: str, job: str, document_context: str = None):
        """Generate strategic insights for specific areas of the document."""
        if not self.is_available():
            return {"insights": []}
        
        try:
            prompt = f"""
            As an expert analyst, provide strategic insights for the following text, considering the user's specific role and objectives.
            
            Text to analyze:
            {text}
            
            User Context:
            - Persona: {persona}
            - Job to be done: {job}
            {f"- Document context: {document_context}" if document_context else ""}
            
            Provide strategic insights in these categories:
            1. **Key Opportunities**: What opportunities does this text reveal for the user's role?
            2. **Critical Decisions**: What decisions should the user consider based on this information?
            3. **Risk Assessment**: What risks or challenges are implied by this content?
            4. **Action Items**: What specific actions should the user take?
            5. **Knowledge Gaps**: What additional information would be valuable?
            6. **Strategic Context**: How does this fit into the bigger picture for their job?
            
            Return as JSON:
            {{
                "opportunities": [
                    {{"insight": "description", "priority": "high|medium|low", "timeframe": "immediate|short-term|long-term"}}
                ],
                "critical_decisions": [
                    {{"decision": "description", "factors": ["factor1", "factor2"], "urgency": "high|medium|low"}}
                ],
                "risks": [
                    {{"risk": "description", "impact": "high|medium|low", "mitigation": "suggested approach"}}
                ],
                "action_items": [
                    {{"action": "description", "priority": "high|medium|low", "effort": "low|medium|high"}}
                ],
                "knowledge_gaps": [
                    {{"gap": "description", "importance": "high|medium|low", "source_suggestions": ["suggestion1", "suggestion2"]}}
                ],
                "strategic_context": {{
                    "relevance_to_role": "explanation",
                    "business_impact": "explanation",
                    "competitive_advantage": "explanation"
                }}
            }}
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            try:
                import json
                result = json.loads(response.text.strip())
                return result
            except:
                # Fallback
                return {
                    "opportunities": [{"insight": response.text[:200], "priority": "medium", "timeframe": "short-term"}],
                    "critical_decisions": [],
                    "risks": [],
                    "action_items": [],
                    "knowledge_gaps": [],
                    "strategic_context": {
                        "relevance_to_role": "High relevance to current role",
                        "business_impact": "Moderate business impact expected",
                        "competitive_advantage": "Potential for competitive advantage"
                    }
                }
                
        except Exception as e:
            print(f"Error generating strategic insights: {e}")
            return {"insights": []}
    
    async def analyze_document_context(self, section_text: str, full_context: str, title: str, page: int, persona: str, job: str):
        """Analyze specific document context for deeper insights."""
        if not self.is_available():
            return {"analysis": "LLM service unavailable"}
        
        try:
            prompt = f"""
            Analyze this specific section within the broader document context to provide deep, contextual insights.
            
            Document: "{title}" (Page {page})
            
            Current Section:
            {section_text}
            
            Document Context (first part):
            {full_context}
            
            User Profile:
            - Role: {persona}
            - Objective: {job}
            
            Provide a comprehensive analysis including:
            
            1. **Section Summary**: What is the core message of this section?
            2. **Contextual Significance**: How does this section relate to the overall document?
            3. **Personal Relevance**: Why is this specifically important for someone in the user's role?
            4. **Deeper Implications**: What are the unstated implications or consequences?
            5. **Cross-References**: What other parts of the document does this connect to?
            6. **Expert Perspective**: What would a domain expert notice about this section?
            7. **Questions to Consider**: What questions should the reader ask themselves?
            8. **Next Steps**: What should the reader do with this information?
            
            Return as JSON:
            {{
                "section_summary": "brief summary",
                "contextual_significance": "how it fits in the document",
                "personal_relevance": "why it matters for this role",
                "deeper_implications": ["implication1", "implication2"],
                "cross_references": ["section1", "section2"],
                "expert_perspective": "what an expert would notice",
                "questions_to_consider": ["question1", "question2"],
                "next_steps": ["step1", "step2"],
                "confidence_score": float (0-1)
            }}
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            try:
                import json
                result = json.loads(response.text.strip())
                return result
            except:
                # Fallback
                return {
                    "section_summary": response.text[:150],
                    "contextual_significance": "This section provides important context within the document",
                    "personal_relevance": f"Relevant for {persona} working on {job}",
                    "deeper_implications": ["Consider the broader implications", "Evaluate potential impacts"],
                    "cross_references": [],
                    "expert_perspective": "This section contains valuable insights",
                    "questions_to_consider": ["What are the key takeaways?", "How does this apply to your situation?"],
                    "next_steps": ["Review related sections", "Consider implementation"],
                    "confidence_score": 0.7
                }
                
        except Exception as e:
            print(f"Error analyzing document context: {e}")
            return {"analysis": f"Error: {e}"}

    async def analyze_multi_document_insights(self, documents_data: List[Dict[str, Any]], persona: str, job: str):
        """Analyze multiple documents to find overarching patterns, contradictions, and insights."""
        if not self.is_available():
            return {"insights": [], "patterns": [], "contradictions": [], "recommendations": []}
        
        try:
            # Prepare document summaries for analysis
            doc_summaries = []
            for doc in documents_data[:5]:  # Limit to 5 documents for performance
                doc_summaries.append(f"Document: {doc.get('title', 'Unknown')}\nContent: {doc.get('text', '')[:1500]}")
            
            prompt = f"""
            Analyze these {len(doc_summaries)} documents to provide comprehensive insights for a {persona} working on {job}.
            
            Documents:
            {chr(10).join([f"{i+1}. {summary}" for i, summary in enumerate(doc_summaries)])}
            
            Provide a comprehensive cross-document analysis including:
            
            1. **OVERARCHING PATTERNS**: What themes, concepts, or approaches appear across multiple documents?
            2. **CONTRADICTIONS**: What specific statements or conclusions contradict each other across documents?
            3. **KNOWLEDGE GAPS**: What important topics are missing or under-represented?
            4. **SYNTHESIS INSIGHTS**: What new understanding emerges from reading these documents together?
            5. **ACTIONABLE RECOMMENDATIONS**: What specific actions should the {persona} take based on all documents?
            
            Return as JSON:
            {{
                "overarching_patterns": [
                    {{
                        "pattern": "description of pattern",
                        "documents": ["doc1", "doc2"],
                        "evidence": ["quote1", "quote2"],
                        "significance": "why this pattern matters"
                    }}
                ],
                "contradictions": [
                    {{
                        "topic": "what the contradiction is about",
                        "doc1_position": "position from document 1",
                        "doc2_position": "conflicting position from document 2",
                        "doc1_evidence": "supporting quote from doc 1",
                        "doc2_evidence": "supporting quote from doc 2",
                        "impact": "how this affects the {persona}",
                        "resolution_suggestion": "how to resolve or navigate this contradiction"
                    }}
                ],
                "knowledge_gaps": [
                    {{
                        "gap": "missing information or topic",
                        "importance": "high|medium|low",
                        "impact_on_job": "how this gap affects the job to be done",
                        "suggested_research": "what to research to fill this gap"
                    }}
                ],
                "synthesis_insights": [
                    {{
                        "insight": "new understanding from combining documents",
                        "supporting_documents": ["doc1", "doc2"],
                        "implications": "what this means for the persona",
                        "confidence": float (0-1)
                    }}
                ],
                "actionable_recommendations": [
                    {{
                        "recommendation": "specific action to take",
                        "priority": "high|medium|low",
                        "timeframe": "immediate|short-term|long-term",
                        "based_on": "which documents support this recommendation",
                        "success_metrics": "how to measure success"
                    }}
                ]
            }}
            
            Focus on providing specific quotes and evidence. Be precise and actionable.
            """
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            try:
                import json
                result = json.loads(response.text.strip())
                return result
            except:
                # Fallback
                return {
                    "overarching_patterns": [],
                    "contradictions": [],
                    "knowledge_gaps": [],
                    "synthesis_insights": [{"insight": response.text[:300], "supporting_documents": [], "implications": "General insight", "confidence": 0.7}],
                    "actionable_recommendations": []
                }
                
        except Exception as e:
            print(f"Error analyzing multi-document insights: {e}")
            return {"insights": [], "patterns": [], "contradictions": [], "recommendations": []}