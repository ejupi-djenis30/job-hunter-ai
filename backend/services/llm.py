import os
import json
import logging
from openai import OpenAI
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# ─── Provider Configuration ───
# Supported: "groq", "deepseek"
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "groq")

# ─── Provider-specific defaults ───
PROVIDER_DEFAULTS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "default_model": "moonshotai/kimi-k2-instruct-0905",
        "max_tokens": 16384,
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "api_key_env": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-reasoner",
        "max_tokens": 32768,
    },
}

def _get_config():
    """Build LLM config from environment variables with provider defaults."""
    provider = LLM_PROVIDER.lower()
    defaults = PROVIDER_DEFAULTS.get(provider, PROVIDER_DEFAULTS["groq"])
    
    return {
        "provider": provider,
        "base_url": os.environ.get("LLM_BASE_URL", defaults["base_url"]),
        "api_key": os.environ.get(defaults["api_key_env"]) or os.environ.get("LLM_API_KEY", ""),
        "model": os.environ.get("LLM_MODEL", defaults["default_model"]),
        "max_tokens": int(os.environ.get("LLM_MAX_TOKENS", defaults["max_tokens"])),
        "temperature": float(os.environ.get("LLM_TEMPERATURE", "0.7")),
        "top_p": float(os.environ.get("LLM_TOP_P", "1.0")),
        "frequency_penalty": float(os.environ.get("LLM_FREQUENCY_PENALTY", "0.0")),
        "presence_penalty": float(os.environ.get("LLM_PRESENCE_PENALTY", "0.0")),
        "thinking": os.environ.get("LLM_THINKING", "false").lower() == "true",
    }

def _create_client(config: dict) -> OpenAI:
    """Create OpenAI-compatible client for any provider."""
    return OpenAI(
        api_key=config["api_key"],
        base_url=config["base_url"],
    )

def _build_params(config: dict, messages: list, json_mode: bool = True, max_tokens_override: int = None) -> dict:
    """Build API call parameters from config."""
    params = {
        "messages": messages,
        "model": config["model"],
        "max_tokens": max_tokens_override or config["max_tokens"],
        "temperature": config["temperature"],
        "top_p": config["top_p"],
        "frequency_penalty": config["frequency_penalty"],
        "presence_penalty": config["presence_penalty"],
    }
    
    # JSON mode
    if json_mode:
        if config["provider"] == "deepseek" and config.get("thinking"):
            pass
        else:
            params["response_format"] = {"type": "json_object"}
    
    # DeepSeek thinking mode
    if config["provider"] == "deepseek" and config.get("thinking"):
        params.pop("temperature", None)
        params.pop("top_p", None)
    
    return params

def _extract_content(response, config: dict) -> str:
    """Extract the text content from a completion response."""
    choice = response.choices[0]
    content = choice.message.content or ""
    
    if hasattr(choice.message, 'reasoning_content') and choice.message.reasoning_content:
        logger.info(f"[Thinking] {choice.message.reasoning_content[:200]}...")
    
    return content

def _parse_json(text: str) -> dict:
    """Parse JSON from text, handling edge cases like code blocks."""
    text = text.strip()
    
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines[1:] if not l.strip() == "```"]
        text = "\n".join(lines)
    
    return json.loads(text)


# ═══════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════

def generate_search_keywords(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates extensive, multilingual search keywords based on user CV and profile.
    Returns a list of search configurations.
    """
    config = _get_config()
    client = _create_client(config)
    
    prompt = f"""
    You are an expert Swiss Headhunter and AI Recruiter specializing in the Swiss job market.
    
    Analyze the user's CV/profile in depth and generate an EXTENSIVE set of search queries 
    to find ALL relevant jobs on Swiss job boards.
    
    === USER PROFILE & CV ===
    {json.dumps(profile, indent=2)}
    === END PROFILE ===
    
    SEARCH TYPES AVAILABLE:
    1. "occupation" — A generic occupation title (resolves to AVAM code). 
       CRITICAL: NEVER include seniority levels (Junior, Senior, Lead, Principal, Head of, etc.).
       Use ONLY the base role: "Software Engineer", NOT "Senior Software Engineer".
       
    2. "keyword" — Free-text search terms. Can be skills, technologies, or job titles.
    
    3. "combined" — An occupation + keyword filter together.
       CRITICAL: The occupation part must also have NO seniority.
    
    SEARCH STRATEGY (follow this EXACTLY):
    
    Phase 1 - COMBINED searches (broad):
      Search with the base occupation + ALL relevant skills combined.
      Example: occupation "Software Engineer", keywords "C#, Azure, Terraform, .NET"
    
    Phase 2 - GRANULAR keyword searches:
      For EACH important skill/technology from the CV, create a SEPARATE keyword search.
      Example: "C#" alone, "Azure" alone, "Terraform" alone
    
    Phase 3 - MULTILINGUAL searches:
      For EACH relevant occupation and key skill, generate keyword searches in:
      - English (e.g. "Software Developer")
      - German (e.g. "Softwareentwickler")
      - French (e.g. "Développeur logiciel")
      - Italian (e.g. "Sviluppatore software")
    
    Phase 4 - OCCUPATION searches:
      Search by the most relevant base occupation titles (NO seniority).
      Include variations: "Software Engineer", "Application Developer", "Backend Developer", etc.
    
    RULES:
    - Generate AT LEAST 15 searches, ideally 20+
    - Extract ALL technologies, frameworks, languages, tools from the CV
    - Each granular keyword search should be a SINGLE technology/skill
    - Multilingual searches should cover DE, FR, IT, EN
    - Occupation type must NEVER have seniority prefixes
    - The user has ALREADY specified location, do NOT generate location
    - Read the CV deeply: extract certifications, industry experience, soft skills
    
    JSON Format:
    {{
        "searches": [
            {{ "type": "combined", "occupation": "Software Engineer", "keywords": "C#, Azure, Terraform, .NET" }},
            {{ "type": "keyword", "value": "C#" }},
            {{ "type": "keyword", "value": "Azure" }},
            {{ "type": "keyword", "value": "Terraform" }},
            {{ "type": "keyword", "value": ".NET" }},
            {{ "type": "keyword", "value": "Softwareentwickler" }},
            {{ "type": "keyword", "value": "Développeur logiciel" }},
            {{ "type": "keyword", "value": "Sviluppatore software" }},
            {{ "type": "keyword", "value": "Informatiker" }},
            {{ "type": "occupation", "value": "Software Engineer" }},
            {{ "type": "occupation", "value": "Application Developer" }},
            {{ "type": "combined", "occupation": "System Engineer", "keywords": "DevOps, CI/CD" }}
        ]
    }}
    """
    
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant that outputs JSON. You are an expert in the Swiss job market and know job titles in German, French, Italian, and English."},
            {"role": "user", "content": prompt}
        ]
        
        params = _build_params(config, messages, json_mode=True)
        logger.info(f"[LLM] Generating keywords via {config['provider']} / {config['model']} (max_tokens={config['max_tokens']}, temp={config.get('temperature', 'auto')})")
        
        completion = client.chat.completions.create(**params)
        content = _extract_content(completion, config)
        result = _parse_json(content)
        searches = result.get("searches", [])
        
        # Post-process: strip seniority from any occupation values
        seniority_prefixes = ["junior ", "senior ", "lead ", "principal ", "head of ", "chief ", "staff "]
        for s in searches:
            if s.get("type") == "occupation" and s.get("value"):
                val = s["value"]
                for prefix in seniority_prefixes:
                    if val.lower().startswith(prefix):
                        s["value"] = val[len(prefix):]
                        break
            if s.get("type") == "combined" and s.get("occupation"):
                val = s["occupation"]
                for prefix in seniority_prefixes:
                    if val.lower().startswith(prefix):
                        s["occupation"] = val[len(prefix):]
                        break
        
        logger.info(f"[LLM] Generated {len(searches)} search configurations")
        return searches
    except Exception as e:
        logger.error(f"Error generating keywords: {e}")
        return []


def check_title_relevance(title: str, role_description: str) -> Dict[str, Any]:
    """
    PHASE 1: Fast title-only pre-filter.
    Returns {"relevant": bool, "reason": "..."}
    Skips obviously irrelevant jobs without full analysis.
    """
    config = _get_config()
    client = _create_client(config)
    
    prompt = f"""You are a job relevance filter. Determine if this job title could POSSIBLY be relevant 
to the candidate's target role. Be INCLUSIVE — only reject titles that are CLEARLY in a different field.

Candidate's target: {role_description[:300]}

Job title: "{title}"

Rules:
- If the job is in a COMPLETELY different field (e.g. "Logistiker" vs IT role, "Koch" vs engineering), mark as NOT relevant
- If the title COULD be related even loosely (e.g. different specialization but same field), mark as relevant
- When in doubt, mark as relevant — we filter more strictly in phase 2
- Be especially careful with German/French/Italian job titles that may relate to the target field

JSON Format:
{{"relevant": true, "reason": "Brief reason"}}"""

    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant that outputs JSON. Be concise."},
            {"role": "user", "content": prompt}
        ]
        
        params = _build_params(config, messages, json_mode=True, max_tokens_override=200)
        completion = client.chat.completions.create(**params)
        content = _extract_content(completion, config)
        return _parse_json(content)
    except Exception as e:
        logger.error(f"Error in title relevance check: {e}")
        # On error, assume relevant (don't skip)
        return {"relevant": True, "reason": "Error during check, defaulting to relevant"}


def analyze_job_affinity(job_metadata: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    PHASE 2: Detailed job analysis with strict scoring.
    Expects curated metadata (not full JSON dump).
    Returns score, analysis, and worth_applying flag.
    """
    config = _get_config()
    client = _create_client(config)
    
    prompt = f"""You are an EXTREMELY strict and accurate job matching analyst. 
Analyze the match between the candidate profile and job posting with surgical precision.

=== CANDIDATE PROFILE ===
{json.dumps(profile, indent=2)}
=== END PROFILE ===

=== JOB POSTING ===
{json.dumps(job_metadata, indent=2)}
=== END JOB ===

STRICT SCORING RUBRIC (follow this EXACTLY):
  0-20:  COMPLETELY different field (e.g. logistics job for IT candidate)
  21-40: Same broad field but MAJOR mismatch — wrong seniority level (Senior role for Junior candidate 
         or vice versa), completely different specialization, missing critical requirements
  41-60: PARTIAL match — some skills overlap but significant gaps. Maybe same tech stack but 
         wrong domain, or right domain but missing >50% of required skills
  61-75: GOOD match — most requirements met, minor gaps. Right field, right level, 
         most skills present
  76-90: STRONG match — nearly all requirements met, candidate would be competitive
  91-100: PERFECT match — candidate meets or exceeds all stated requirements

CRITICAL PENALTIES (apply these BEFORE scoring):
- Seniority mismatch: If the job requires Senior/Lead and the candidate is Junior, 
  or the job is entry-level and candidate is Senior → DEDUCT 25-35 points from base score
- Missing required languages: If the job requires specific languages (German, French) 
  the candidate doesn't speak → DEDUCT 15-25 points
- Wrong specialization: If same field but fundamentally different specialty → DEDUCT 20 points

WORTH APPLYING:
Even if the score is low (30-55), some jobs might still be worth applying to because:
- The company might consider a slightly underqualified but promising candidate
- The role has flexible requirements or "nice to have" skills
- The candidate brings unique value the job description doesn't explicitly mention
Set worth_applying=true ONLY when there's a genuine strategic reason to apply despite low match.

JSON Format:
{{
    "affinity_score": 45,
    "affinity_analysis": "Concise 1-2 sentence analysis explaining the score. Mention key matching and missing skills.",
    "worth_applying": false,
    "worth_applying_reason": "Only filled if worth_applying is true. Brief strategic reason."
}}"""

    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant that outputs JSON. Be strict and precise in your scoring."},
            {"role": "user", "content": prompt}
        ]
        
        params = _build_params(config, messages, json_mode=True)
        completion = client.chat.completions.create(**params)
        content = _extract_content(completion, config)
        result = _parse_json(content)
        
        # Ensure score is within bounds
        score = result.get("affinity_score", 0)
        if not isinstance(score, (int, float)):
            score = 0
        result["affinity_score"] = max(0, min(100, int(score)))
        
        return result
    except Exception as e:
        logger.error(f"Error analyzing job: {e}")
        return {
            "affinity_score": 0,
            "affinity_analysis": "Error during analysis",
            "worth_applying": False,
            "worth_applying_reason": "",
        }
