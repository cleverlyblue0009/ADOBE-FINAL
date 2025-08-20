import os
import asyncio
import json
import aiohttp
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        self.model_name = "mistralai/Mistral-7B-Instruct-v0.1"
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Hugging Face model."""
        if self.api_key:
            self.model = True
            print("Hugging Face model initialized successfully")
        else:
            print("Warning: HUGGINGFACE_API_KEY not found. Using public API with rate limits.")
            self.model = True
    
    def is_available(self) -> bool:
        """Check if LLM service is available."""
        return self.model is not None
    
    async def _make_api_call(self, prompt: str, max_tokens: int = 500) -> str:
        """Make an API call to Hugging Face Inference API."""
        formatted_prompt = f"<s>[INST] {prompt} [/INST]"
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.7,
                "do_sample": True,
                "return_full_text": False
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.api_url, headers=self.headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get("generated_text", "")
                    elif isinstance(result, dict):
                        return result.get("generated_text", "")
                    return str(result)
                elif response.status == 503:
                    await asyncio.sleep(20)
                    return await self._make_api_call(prompt, max_tokens)
                else:
                    error_text = await response.text()
                    raise Exception(f"API call failed with status {response.status}: {error_text}")

    async def generate_insights(self, text: str, persona: str, job_to_be_done: str, context: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate AI insights for the given text."""
        if not self.is_available():
            return [{"type": "info", "content": "LLM service not available. Please configure HUGGINGFACE_API_KEY."}]
        
        try:
            prompt = f"""You are helping a {persona} with their task: {job_to_be_done}

Analyze the following text and provide 3 key insights:

Text: {text[:2000]}
{f"Context: {context}" if context else ""}

Format your response as:
TAKEAWAY: [key takeaway]
FACT: [interesting fact]
CONNECTION: [connection to broader concepts]

Keep each insight under 2 sentences."""
            
            response_text = await self._make_api_call(prompt, max_tokens=300)
            
            insights = []
            lines = response_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if line.startswith('TAKEAWAY:'):
                    insights.append({"type": "takeaway", "content": line.replace('TAKEAWAY:', '').strip()})
                elif line.startswith('FACT:'):
                    insights.append({"type": "fact", "content": line.replace('FACT:', '').strip()})
                elif line.startswith('CONNECTION:'):
                    insights.append({"type": "connection", "content": line.replace('CONNECTION:', '').strip()})
            
            return insights if insights else [{"type": "info", "content": response_text[:200]}]
                
        except Exception as e:
            print(f"Error generating insights: {e}")
            return [{"type": "error", "content": "Failed to generate insights"}]

    async def generate_comprehensive_insights(self, text: str, persona: str, job_to_be_done: str, document_context: str = None, keywords: List[str] = None) -> Dict[str, Any]:
        insights = await self.generate_insights(text, persona, job_to_be_done, document_context)
        return {
            "insights": insights,
            "persona_insights": [],
            "topic_analysis": {},
            "web_facts": [],
            "keywords": keywords or [],
            "search_queries": []
        }
