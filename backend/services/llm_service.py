import logging
from typing import Dict, Any, List
from backend.providers.llm.factory import get_llm_provider
from backend.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = get_llm_provider()

    def generate_search_keywords(self, profile: Dict[str, Any], max_queries: int | None = None) -> List[Dict[str, Any]]:
        system_prompt = (
            "You are an expert Job Hunter AI specialized in the Swiss job market. "
            "You are fluent in English, German, French, and Italian. "
            "Your goal is to generate HIGHLY DETAILED and COMPREHENSIVE search queries to find the best possible job matches."
        )
        
        limit_instruction = (
            f"Generate as MANY queries as needed to ensure comprehensive coverage. There is NO limit on the total number of queries."
            if max_queries is None else
            f"Generate at most {max_queries} queries total. prioritize the most relevant combined and occupation queries first."
        )

        user_prompt = f"""
        Analyze the user's profile and strategies to generate search queries for Swiss job boards (Job Room).
        
        Profile content:
        Role/What they are looking for: {profile.get('role_description')}
        Strategy/AI Instructions: {profile.get('search_strategy')}
        CV Summary: {profile.get('cv_content')}
        
        STRICT QUERY GENERATION RULES:
        1. NO "OR" OPERATORS: Never use "OR" or any other boolean operator in the query field.
        2. ONE OCCUPATION: Each query must contain ONLY ONE specific job title/occupation.
        3. QUERY TYPES:
           - "combined": Exactly ONE occupation combined with 1-3 critical technical keywords (e.g. "Python Developer React").
           - "occupation": Exactly ONE occupation title, translated. ABSOLUTELY NO keywords in this type.
           - "keyword": Single specific skill or technology.
        4. DIVERSITY & ACCURACY:
           - Do NOT generate slightly different versions of the same query (e.g. "Software Engineer" vs "Software-Engineer").
           - Use synonyms and different languages (DE, FR, EN) to maximize coverage.
           - Ensure queries are distinct and high-quality.

        Generate queries in this EXACT order:
        1. "combined" queries in EN, DE, FR, IT (Prioritize these!).
        2. "occupation" queries in EN, DE, FR, IT.
        3. "keyword" queries for specific assets (Limit these).
        
        {limit_instruction}
        Do NOT worry about token limits. 
        
        Return pure JSON with a 'searches' list.
        Format: {{ "searches": [ {{ "language": "en", "type": "combined", "query": "..." }}, ... ] }}
        """ 
        
        try:
            result = self.provider.generate_json(system_prompt, user_prompt)
            searches = result.get("searches", [])
            
            # Application-side enforcement of the limit just in case LLM goes over
            if max_queries is not None:
                searches = searches[:max_queries]
                
            return searches
        except Exception as e:
            logger.error(f"Error generating keywords: {e}")
            return []
        except Exception as e:
            logger.error(f"Error generating keywords: {e}")
            return []

    def check_title_relevance(self, title: str, role_description: str) -> Dict[str, Any]:
        system_prompt = "You are a helpful assistant that outputs JSON. Be concise."
        user_prompt = f"""Determine if job title '{title}' is relevant to role '{role_description}'. Return JSON: {{ "relevant": bool, "reason": "..." }}"""
        
        try:
            return self.provider.generate_json(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Error checking relevance: {e}")
            return {"relevant": True, "reason": "Error checking relevance"}

    def analyze_job_match(self, job_metadata: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        system_prompt = (
            "You are a strict and precise Career Coach AI. "
            "Your goal is to evaluate the match between a candidate's profile and a specific job listing."
        )
        
        user_prompt = f"""
        Analyze the match between this profile and job.
        
        PROFILE:
        Expected Role: {profile.get('role_description')}
        Experience Context: {profile.get('cv_content')}
        
        JOB METADATA (Title, Location, Metadata):
        {job_metadata}
        
        CRITICAL RULES:
        1. SENIORITY MISMATCH: If the user is a Junior/Entry-level and the job title or description palesently expects a "Senior", "Lead", "Staff", or "Principal" (with 5+ years experience), the 'affinity_score' MUST NOT exceed 50. You may still marks 'worth_applying' as true if the candidate has most skills.
        2. MULTI-FACTOR: Consider the title, the full description, and available metadata (like language or workload) together.
        3. STRICTNESS: Be realistic. 100% is only for a perfect resume-to-job match.
        
        Return JSON ONLY:
        {{
            "affinity_score": 0-100,
            "affinity_analysis": "Concise 2-3 sentence explanation focusing on why the score was given and mentioning seniority if applicable.",
            "worth_applying": bool (true if it's worth a shot even if the score is lower)
        }}
        """
        
        try:
            return self.provider.generate_json(system_prompt, user_prompt)
        except Exception as e:
            logger.error(f"Error analyzing affinity: {e}")
            return {"affinity_score": 0, "affinity_analysis": "Error during analysis", "worth_applying": False}

llm_service = LLMService()
